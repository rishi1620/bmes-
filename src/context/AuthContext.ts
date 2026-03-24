import { createContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface AuthContextType {
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
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
