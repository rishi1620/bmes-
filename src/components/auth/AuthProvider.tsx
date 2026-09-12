import { useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, clearSupabaseStorage } from "@/integrations/supabase/client";
import { AuthContext, AppRole } from "@/context/AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const checkRoles = async (userId: string, email?: string) => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    let userRoles: AppRole[] = [];
    let isEnvAdmin = false;
    
    if (adminEmail && email === adminEmail) {
      userRoles.push("admin");
      isEnvAdmin = true;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
        
      if (error) throw error;
      
      const dbRoles = data ? data.map(r => r.role) : [];
      
      // Auto-sync: If user is admin in ENV but not in DB, try to add them to DB
      if (isEnvAdmin && !dbRoles.includes("admin")) {
        console.log("Auto-syncing admin role to database for:", email);
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        
        if (!insertError) {
          dbRoles.push("admin");
        } else {
          console.warn("Could not auto-sync admin role (likely RLS). User will still have admin access via ENV.");
        }
      }

      userRoles = [...new Set([...userRoles, ...dbRoles])];
    } catch (err) {
      console.error("Error fetching user roles:", err);
    }
    
    setRoles(userRoles);
    setIsAdmin(userRoles.includes("admin") || userRoles.includes("super_admin"));
    setHasAdminAccess(userRoles.some(r => ["admin", "super_admin", "editor", "content_manager"].includes(r)));
  };

  const hasRole = (allowedRoles: AppRole[]) => {
    if (isAdmin) return true; // Admins have all permissions
    return roles.some(role => allowedRoles.includes(role));
  };

  const handleAuthError = async (error: unknown) => {
    const err = error as { message?: string; name?: string } | string | null;
    const message = (typeof err === 'object' ? err?.message : (typeof err === 'string' ? err : "")) || "";
    const name = typeof err === 'object' ? err?.name : "";
    
    // Ignore lock contention or abort errors cleanly without logging as critical errors
    if (
      name === "AbortError" ||
      message.toLowerCase().includes("lock broken") ||
      message.toLowerCase().includes("steal") ||
      message.toLowerCase().includes("aborted")
    ) {
      console.warn("Ignored transient auth lock or abort event:", message || name);
      return;
    }

    if (
      message.toLowerCase().includes("refresh token") || 
      message.toLowerCase().includes("session_not_found") ||
      message.toLowerCase().includes("invalid_refresh_token") ||
      message.toLowerCase().includes("refresh token not found") ||
      message.toLowerCase().includes("invalid grant") ||
      message.toLowerCase().includes("session expired") ||
      message.toLowerCase().includes("failed to fetch")
    ) {
      console.warn("Stale or expired session encountered during auth initialization. Resetting session.");
      clearSupabaseStorage();
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setHasAdminAccess(false);
      setRoles([]);
      setLoading(false);
      return;
    }

    console.warn("Supabase auth event:", message);
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Ensure profile exists on login
        supabase.from("profiles").select("id").eq("id", session.user.id).maybeSingle().then(({ data, error }) => {
          if (!isMounted) return;
          if (error) {
            console.warn("Notice checking profile:", error.message);
          }
          if (!data) {
            console.log("Creating missing profile for user:", session.user.id);
            // Try to insert, but catch and ignore 409 (already exists) errors
            // This can happen if multiple tabs/reloads trigger this simultaneously
            supabase.from("profiles").insert({
              id: session.user.id,
              user_id: session.user.id,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User"
            }).then(({ error: insertError }) => {
              if (!isMounted) return;
              if (insertError && insertError.code !== '23505') {
                console.warn("Notice creating profile:", insertError.message);
              }
              checkRoles(session.user.id, session.user.email);
            });
          } else {
            checkRoles(session.user.id, session.user.email);
          }
        });
      } else {
        setIsAdmin(false);
        setHasAdminAccess(false);
        setRoles([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        handleAuthError(error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          checkRoles(session.user.id, session.user.email);
        }
      }
      setLoading(false);
    }).catch((error) => {
      if (!isMounted) return;
      handleAuthError(error);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });

    if (!error && data.user) {
      try {
        const emailResponse = await fetch("/api/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: fullName }),
        });
        if (!emailResponse.ok) {
          console.error("Failed to send welcome email. Server responded with:", emailResponse.status);
        }
      } catch (err) {
        console.error("Error sending welcome email:", err);
      }
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      // Force clear local storage just in case
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, hasAdminAccess, roles, hasRole, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
