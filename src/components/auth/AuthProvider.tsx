import { useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, AppRole } from "@/context/AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const checkRoles = useCallback(async (userId: string, email?: string) => {
    console.info(`[AuthProvider] 🔍 Checking roles for user: ${userId} (${email || "no email"})`);
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    let userRoles: AppRole[] = [];
    let isEnvAdmin = false;
    
    if (adminEmail && email === adminEmail) {
      console.info(`[AuthProvider] 👑 User matches VITE_ADMIN_EMAIL: ${adminEmail}`);
      userRoles.push("admin");
      isEnvAdmin = true;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
        
      if (error) {
        console.warn(`[AuthProvider] ⚠️ Error querying user_roles from database:`, error);
      } else {
        const dbRoles = data ? (data.map(r => r.role) as AppRole[]) : [];
        console.info(`[AuthProvider] 📋 Database roles found for ${userId}:`, dbRoles);
        
        // Auto-sync: If user is admin in ENV but not in DB, try to add them to DB
        if (isEnvAdmin && !dbRoles.includes("admin")) {
          console.info(`[AuthProvider] 🔄 Auto-syncing admin role to database for: ${email}`);
          const { error: insertError } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: "admin" });
          
          if (!insertError) {
            console.info(`[AuthProvider] ✅ Successfully synced admin role to DB for: ${email}`);
            dbRoles.push("admin");
          } else {
            console.warn(`[AuthProvider] ⚠️ Could not auto-sync admin role to DB (likely RLS). User still has env admin access:`, insertError);
          }
        }

        userRoles = [...new Set([...userRoles, ...dbRoles])];
      }
    } catch (err) {
      console.error("[AuthProvider] ❌ Exception during fetch user_roles:", err);
    }
    
    const adminStatus = userRoles.includes("admin") || userRoles.includes("super_admin");
    const adminAccessStatus = userRoles.some(r => ["admin", "super_admin", "editor", "content_manager"].includes(r));
    
    console.info(`[AuthProvider] 🛡️ Final evaluated roles:`, {
      userId,
      email,
      roles: userRoles,
      isAdmin: adminStatus,
      hasAdminAccess: adminAccessStatus
    });

    setRoles(userRoles);
    setIsAdmin(adminStatus);
    setHasAdminAccess(adminAccessStatus);
  }, []);

  const hasRole = (allowedRoles: AppRole[]) => {
    if (isAdmin) return true; // Admins have all permissions
    return roles.some(role => allowedRoles.includes(role));
  };

  const handleAuthError = async (error: unknown) => {
    console.error("[AuthProvider] ❌ Auth error encountered:", error);
    const err = error as { message?: string } | string | null;
    const message = (typeof err === 'object' ? err?.message : (typeof err === 'string' ? err : "")) || "";
    
    console.info(`[AuthProvider] ⚠️ Parsed auth error message: "${message}"`);
    
    if (message.toLowerCase().includes("refresh token") || 
        message.toLowerCase().includes("session_not_found") ||
        message.toLowerCase().includes("invalid_refresh_token") ||
        message.toLowerCase().includes("refresh token not found") ||
        message.toLowerCase().includes("invalid grant") ||
        message.toLowerCase().includes("session expired")) {
      console.warn("[AuthProvider] 🔄 Stale/Invalid refresh token or session detected. Purging storage and signing out...");
      
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      
      try {
        await supabase.auth.signOut();
        console.info("[AuthProvider] 🚪 SignOut completed after auth error.");
      } catch (e) {
        console.error("[AuthProvider] ❌ Error during signOut cleanup:", e);
      }
      
      if (!window.location.pathname.includes('/auth')) {
        console.info("[AuthProvider] 🔀 Redirecting to /auth due to expired session.");
        window.location.href = '/auth';
      }
    }
  };

  useEffect(() => {
    console.info("[AuthProvider] 🚀 Initializing AuthProvider subscription and session check...");
    let isMounted = true;

    // Safety timeout to prevent loading state from getting permanently stuck
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(prev => {
          if (prev) {
            console.warn("[AuthProvider] ⏱️ Auth initial loading timeout reached (5000ms). Forcing loading to false.");
            return false;
          }
          return prev;
        });
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.info(`[AuthProvider] ⚡ onAuthStateChange event: "${event}"`, {
        userId: currentSession?.user?.id || "anonymous",
        email: currentSession?.user?.email,
        expiresAt: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000).toLocaleTimeString() : undefined
      });

      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        try {
          // Check profile asynchronously
          const { data: profileData, error: profileErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", currentSession.user.id)
            .maybeSingle();

          if (profileErr) {
            console.warn("[AuthProvider] ⚠️ Error querying user profile:", profileErr);
          }

          if (!profileData) {
            console.info("[AuthProvider] 👤 Missing profile detected, inserting profile record for:", currentSession.user.id);
            const { error: insertError } = await supabase.from("profiles").insert({
              id: currentSession.user.id,
              user_id: currentSession.user.id,
              full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || "User"
            });
            if (insertError && insertError.code !== '23505') {
              console.warn("[AuthProvider] ⚠️ Error inserting profile (non-duplicate):", insertError);
            }
          }
        } catch (e) {
          console.warn("[AuthProvider] ⚠️ Exception during profile verification:", e);
        }

        if (isMounted) {
          await checkRoles(currentSession.user.id, currentSession.user.email);
        }
      } else {
        if (isMounted) {
          setIsAdmin(false);
          setHasAdminAccess(false);
          setRoles([]);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    // Initial getSession check
    supabase.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      console.info("[AuthProvider] 🔑 supabase.auth.getSession() returned:", {
        hasSession: !!initialSession,
        userId: initialSession?.user?.id,
        email: initialSession?.user?.email,
        error: error?.message || null
      });

      if (!isMounted) return;

      if (error) {
        await handleAuthError(error);
      }

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        await checkRoles(initialSession.user.id, initialSession.user.email);
      }
      
      setLoading(false);
    }).catch(async (error) => {
      console.error("[AuthProvider] ❌ getSession rejection:", error);
      if (isMounted) {
        await handleAuthError(error);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      console.info("[AuthProvider] 🧹 Cleaning up AuthProvider subscription.");
      subscription.unsubscribe();
    };
  }, [checkRoles]);

  const signIn = async (email: string, password: string) => {
    console.info(`[AuthProvider] 🔐 signIn requested for: ${email}`);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.warn(`[AuthProvider] ❌ signIn failed for ${email}:`, error.message, error);
        return { error: error as Error };
      }
      console.info(`[AuthProvider] ✅ signIn successful for ${email}:`, {
        userId: data.user?.id,
        email: data.user?.email
      });
      return { error: null };
    } catch (err: unknown) {
      console.error(`[AuthProvider] ❌ signIn exception for ${email}:`, err);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      return { error: errorObj };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.info(`[AuthProvider] 📝 signUp requested for: ${email} (${fullName})`);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });

      if (error) {
        console.warn(`[AuthProvider] ❌ signUp failed for ${email}:`, error.message, error);
        return { error: error as Error };
      }

      console.info(`[AuthProvider] ✅ signUp response received for ${email}:`, {
        userId: data.user?.id,
        identities: data.user?.identities?.length
      });

      if (data.user) {
        try {
          const emailResponse = await fetch("/api/send-welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name: fullName }),
          });
          if (!emailResponse.ok) {
            console.warn("[AuthProvider] ⚠️ Welcome email route responded with status:", emailResponse.status);
          } else {
            console.info("[AuthProvider] ✉️ Welcome email sent successfully.");
          }
        } catch (err) {
          console.warn("[AuthProvider] ⚠️ Error sending welcome email:", err);
        }
      }

      return { error: null };
    } catch (err: unknown) {
      console.error(`[AuthProvider] ❌ signUp exception for ${email}:`, err);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      return { error: errorObj };
    }
  };

  const signOut = async () => {
    console.info("[AuthProvider] 🚪 signOut requested.");
    try {
      await supabase.auth.signOut();
      console.info("[AuthProvider] ✅ supabase.auth.signOut completed.");
    } catch (error) {
      console.error("[AuthProvider] ❌ Error during signOut:", error);
    } finally {
      // Force clear local storage keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      console.info(`[AuthProvider] 🧹 Removed ${keysToRemove.length} storage keys. Redirecting to home.`);
      window.location.href = '/';
    }
  };

  const resetPassword = async (email: string) => {
    console.info(`[AuthProvider] 🔑 resetPassword requested for: ${email}`);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        console.warn(`[AuthProvider] ❌ resetPassword error for ${email}:`, error);
        return { error: error as Error };
      }
      console.info(`[AuthProvider] ✅ resetPassword link sent to: ${email}`);
      return { error: null };
    } catch (err: unknown) {
      console.error(`[AuthProvider] ❌ resetPassword exception for ${email}:`, err);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      return { error: errorObj };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, hasAdminAccess, roles, hasRole, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
