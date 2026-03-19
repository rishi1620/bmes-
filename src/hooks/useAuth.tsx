import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  hasAdminAccess: boolean;
  roles: AppRole[];
  hasRole: (role: AppRole[]) => boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    
    if (adminEmail && email === adminEmail) {
      userRoles.push("admin");
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
        
      if (error) throw error;
      if (data) {
        userRoles = [...new Set([...userRoles, ...data.map(r => r.role)])];
      }
    } catch (err) {
      console.error("Error fetching user roles:", err);
    }
    
    setRoles(userRoles);
    setIsAdmin(userRoles.includes("admin") || userRoles.includes("super_admin"));
    setHasAdminAccess(userRoles.length > 0);
  };

  const hasRole = (allowedRoles: AppRole[]) => {
    if (isAdmin) return true; // Admins have all permissions
    return roles.some(role => allowedRoles.includes(role));
  };

  const handleAuthError = async (error: unknown) => {
    console.error("Auth error:", error);
    const err = error as { message?: string } | string | null;
    const message = (typeof err === 'object' ? err?.message : (typeof err === 'string' ? err : "")) || "";
    
    if (message.includes("Refresh Token Not Found") || 
        message.includes("refresh_token_not_found") ||
        message.includes("invalid_refresh_token") ||
        message.includes("session_not_found")) {
      console.warn("Invalid refresh token or session detected, signing out and clearing storage...");
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Error during signOut:", e);
      }
      
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => checkRoles(session.user.id, session.user.email), 0);
      } else {
        setIsAdmin(false);
        setHasAdminAccess(false);
        setRoles([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        handleAuthError(error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRoles(session.user.id, session.user.email);
      }
      setLoading(false);
    }).catch((error) => {
      handleAuthError(error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, hasAdminAccess, roles, hasRole, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
