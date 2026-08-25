import { useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isPlaceholder } from "@/integrations/supabase/client";
import { AuthContext, AppRole } from "@/context/AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const checkRoles = useCallback(async (userId: string, email?: string) => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    let userRoles: AppRole[] = [];
    let isEnvAdmin = false;

    if (adminEmail && email && email.toLowerCase() === adminEmail.toLowerCase()) {
      userRoles.push("admin");
      isEnvAdmin = true;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.warn("Could not fetch user roles from database:", error.message || error);
      }

      const dbRoles = data
        ? (data.map((r: { role: AppRole }) => r.role).filter(Boolean) as AppRole[])
        : [];

      // Auto-sync: If user is admin in ENV but not in DB, try to add them to DB
      if (isEnvAdmin && !dbRoles.includes("admin")) {
        console.log("Auto-syncing admin role to database for:", email);
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (!insertError) {
          dbRoles.push("admin");
        } else {
          console.warn("Could not auto-sync admin role to DB (user still has access via ENV).");
        }
      }

      userRoles = [...new Set([...userRoles, ...dbRoles])];
    } catch (err) {
      console.warn("Error fetching user roles:", err);
    }

    // Default to user role if no role assigned
    if (userRoles.length === 0) {
      userRoles = isEnvAdmin ? ["admin"] : ["user"];
    }

    setRoles(userRoles);
    setIsAdmin(userRoles.includes("admin") || userRoles.includes("super_admin") || isEnvAdmin);
    setHasAdminAccess(
      isEnvAdmin ||
        userRoles.some((r) => ["admin", "super_admin", "editor", "content_manager"].includes(r))
    );
  }, []);

  const hasRole = (allowedRoles: AppRole[]) => {
    if (isAdmin) return true; // Admins have all permissions
    return roles.some((role) => allowedRoles.includes(role));
  };

  const handleAuthError = async (error: unknown) => {
    if (!error) return;
    const err = error as { message?: string; code?: string } | string | null;
    const message =
      (typeof err === "object" ? err?.message || err?.code : typeof err === "string" ? err : "") || "";

    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes("refresh token") ||
      lowerMessage.includes("session_not_found") ||
      lowerMessage.includes("invalid_refresh_token") ||
      lowerMessage.includes("refresh token not found") ||
      lowerMessage.includes("invalid grant") ||
      lowerMessage.includes("pgrst301") ||
      lowerMessage.includes("expected 3 parts") ||
      lowerMessage.includes("session expired")
    ) {
      console.warn("Invalid auth session detected, clearing storage...");

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("supabase") || key.includes("sb-"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();

      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Error during signOut cleanup:", e);
      }
    }
  };

  const syncUserProfileAndRoles = useCallback(
    async (currentUser: User) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (error) {
          console.warn("Notice checking profile:", error.message || error);
        }

        if (!data) {
          const { error: insertError } = await supabase.from("profiles").insert({
            id: currentUser.id,
            user_id: currentUser.id,
            full_name:
              currentUser.user_metadata?.full_name ||
              currentUser.email?.split("@")[0] ||
              "User",
          });

          if (insertError && insertError.code !== "23505") {
            console.warn("Notice creating profile:", insertError.message || insertError);
          }
        }
      } catch (err) {
        console.warn("Profile synchronization notice:", err);
      } finally {
        await checkRoles(currentUser.id, currentUser.email);
      }
    },
    [checkRoles]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await syncUserProfileAndRoles(currentSession.user);
      } else {
        setIsAdmin(false);
        setHasAdminAccess(false);
        setRoles([]);
      }
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(async ({ data: { session: currentSession }, error }) => {
        if (error) {
          handleAuthError(error);
        }
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await syncUserProfileAndRoles(currentSession.user);
        }
        setLoading(false);
      })
      .catch((error) => {
        handleAuthError(error);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [syncUserProfileAndRoles]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // If in placeholder/mock mode and auth fails, provide mock session
        if (isPlaceholder) {
          const mockUser = {
            id: "00000000-0000-0000-0000-000000000001",
            email,
            user_metadata: { full_name: email.split("@")[0] },
          } as unknown as User;
          setUser(mockUser);
          setIsAdmin(true);
          setHasAdminAccess(true);
          setRoles(["admin"]);
          return { error: null };
        }
        return { error: error as Error };
      }
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        await checkRoles(data.session.user.id, data.session.user.email);
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });

      if (!error && data.user) {
        try {
          await fetch("/api/send-welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name: fullName }),
          });
        } catch {
          // ignore notification errors
        }
      }

      return { error: (error as Error) || null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Sign out notice:", error);
    } finally {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("supabase") || key.includes("sb-"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setHasAdminAccess(false);
      setRoles([]);
      window.location.href = "/";
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error: (error as Error) || null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        hasAdminAccess,
        roles,
        hasRole,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
