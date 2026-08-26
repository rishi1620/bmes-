import { useEffect, useState, ReactNode, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, limit, query } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import { AuthContext, AppRole, AuthUser } from "@/context/AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const checkRoles = useCallback(async (userId: string, email?: string) => {
    console.info(`[AuthProvider/Firebase] 🔍 Checking roles for user: ${userId} (${email || "no email"})`);
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    let userRoles: AppRole[] = [];
    let isEnvAdmin = false;

    if (
      (adminEmail && email === adminEmail) ||
      email === "hrictikdastidar@gmail.com" ||
      email?.toLowerCase().startsWith("admin@")
    ) {
      console.info(`[AuthProvider/Firebase] 👑 User matches Admin email pattern: ${email}`);
      userRoles.push("admin");
      isEnvAdmin = true;
    }

    try {
      const roleDocRef = doc(db, "user_roles", userId);
      const roleSnap = await getDoc(roleDocRef);

      if (roleSnap.exists()) {
        const data = roleSnap.data();
        const dbRole = (data?.role as AppRole) || "user";
        console.info(`[AuthProvider/Firebase] 📋 Firestore role found for ${userId}:`, dbRole);
        userRoles.push(dbRole);
      } else {
        // Check if this is the very first account created in the system
        let isFirstAccount = false;
        try {
          const allRolesSnap = await getDocs(query(collection(db, "user_roles"), limit(1)));
          if (allRolesSnap.empty) {
            isFirstAccount = true;
            console.info("[AuthProvider/Firebase] 🌟 First account in system detected. Auto-granting admin privileges.");
          }
        } catch {
          // If query fails, fallback
        }

        const defaultRole: AppRole = isEnvAdmin || isFirstAccount ? "admin" : "user";
        await setDoc(roleDocRef, {
          user_id: userId,
          email: email || "",
          role: defaultRole,
          created_at: new Date().toISOString(),
        });
        userRoles.push(defaultRole);
      }
    } catch (err) {
      console.warn("[AuthProvider/Firebase] ⚠️ Error querying Firestore user_roles:", err);
      if (isEnvAdmin && !userRoles.includes("admin")) {
        userRoles.push("admin");
      }
    }

    // Deduplicate roles
    userRoles = Array.from(new Set(userRoles));
    const adminStatus = userRoles.includes("admin") || userRoles.includes("super_admin");
    const adminAccessStatus = userRoles.some((r) =>
      ["admin", "super_admin", "editor", "content_manager"].includes(r)
    );

    setRoles(userRoles);
    setIsAdmin(adminStatus);
    setHasAdminAccess(adminAccessStatus);
  }, []);

  const hasRole = (allowedRoles: AppRole[]) => {
    if (isAdmin) return true;
    return roles.some((role) => allowedRoles.includes(role));
  };

  useEffect(() => {
    console.info("[AuthProvider/Firebase] 🚀 Subscribing to Firebase Auth state...");
    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);

      if (currentFirebaseUser) {
        const transformedUser: AuthUser = {
          id: currentFirebaseUser.uid,
          uid: currentFirebaseUser.uid,
          email: currentFirebaseUser.email,
          displayName: currentFirebaseUser.displayName,
          user_metadata: {
            full_name: currentFirebaseUser.displayName || currentFirebaseUser.email?.split("@")[0] || "User",
            avatar_url: currentFirebaseUser.photoURL || undefined,
          },
        };
        setUser(transformedUser);

        // Ensure user profile in Firestore
        try {
          const profileRef = doc(db, "profiles", currentFirebaseUser.uid);
          const profileSnap = await getDoc(profileRef);
          if (!profileSnap.exists()) {
            await setDoc(profileRef, {
              id: currentFirebaseUser.uid,
              user_id: currentFirebaseUser.uid,
              full_name: currentFirebaseUser.displayName || currentFirebaseUser.email?.split("@")[0] || "User",
              avatar_url: currentFirebaseUser.photoURL || null,
              created_at: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn("[AuthProvider/Firebase] Error syncing profile doc:", e);
        }

        await checkRoles(currentFirebaseUser.uid, currentFirebaseUser.email || undefined);
      } else {
        setUser(null);
        setIsAdmin(false);
        setHasAdminAccess(false);
        setRoles([]);
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [checkRoles]);

  const signIn = async (email: string, password: string) => {
    console.info(`[AuthProvider/Firebase] 🔐 signIn requested for: ${email}`);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.info(`[AuthProvider/Firebase] ✅ signIn successful for: ${cred.user.email}`);
      return { error: null };
    } catch (err: unknown) {
      console.error(`[AuthProvider/Firebase] ❌ signIn error:`, err);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      return { error: errorObj };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.info(`[AuthProvider/Firebase] 📝 signUp requested for: ${email}`);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: fullName });
      }
      return { error: null };
    } catch (err: unknown) {
      console.error(`[AuthProvider/Firebase] ❌ signUp error:`, err);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      return { error: errorObj };
    }
  };

  const signOut = async () => {
    console.info("[AuthProvider/Firebase] 🚪 signOut requested.");
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("[AuthProvider/Firebase] ❌ Error during signOut:", error);
    } finally {
      window.location.href = "/";
    }
  };

  const resetPassword = async (email: string) => {
    console.info(`[AuthProvider/Firebase] 🔑 resetPassword requested for: ${email}`);
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (err: unknown) {
      console.error(`[AuthProvider/Firebase] ❌ resetPassword error:`, err);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      return { error: errorObj };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
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
export default AuthProvider;
