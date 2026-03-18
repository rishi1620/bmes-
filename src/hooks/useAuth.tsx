import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
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
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string, email?: string) => {
    // Check if the user's email matches the admin email from env
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    if (adminEmail && email === adminEmail) {
      setIsAdmin(true);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (error) throw error;
      setIsAdmin(!!data);
    } catch (err) {
      console.error("Error checking admin role:", err);
      // Fallback: if RPC fails but email matches, still allow (already handled above)
      // Otherwise, default to false
      if (!(adminEmail && email === adminEmail)) {
        setIsAdmin(false);
      }
    }
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
      
      // Clear all auth related storage to be safe
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Also clear session storage just in case
      sessionStorage.clear();
      
      // Give it a small delay before reload to ensure storage is cleared
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
        setTimeout(() => checkAdmin(session.user.id, session.user.email), 0);
      } else {
        setIsAdmin(false);
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
        checkAdmin(session.user.id, session.user.email);
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
