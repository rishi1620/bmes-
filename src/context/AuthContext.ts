import { createContext } from "react";
import type { User as FirebaseUser } from "firebase/auth";

export type AppRole = "admin" | "user" | "super_admin" | "editor" | "content_manager";

export interface AuthUser {
  id: string;
  uid: string;
  email: string | null;
  displayName?: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
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
