import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  deleteObject,
  listAll,
} from "firebase/storage";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { db, auth, storage } from "./client";

/**
 * Universal Database Client bridging Firestore to the application interface
 */
class FirestoreQueryBuilder {
  private colName: string;
  private constraints: QueryConstraint[] = [];
  private isSingle = false;
  private isMaybeSingle = false;
  private isCount = false;

  constructor(collectionName: string) {
    this.colName = collectionName;
  }

  select(_columns?: string, options?: { count?: "exact"; head?: boolean }) {
    if (options?.count === "exact") {
      this.isCount = true;
    }
    return this;
  }

  eq(field: string, value: unknown) {
    this.constraints.push(where(field, "==", value));
    return this;
  }

  neq(field: string, value: unknown) {
    this.constraints.push(where(field, "!=", value));
    return this;
  }

  in(field: string, values: unknown[]) {
    if (values && values.length > 0) {
      this.constraints.push(where(field, "in", values.slice(0, 10)));
    }
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.constraints.push(orderBy(field, options?.ascending ? "asc" : "desc"));
    return this;
  }

  limit(count: number) {
    this.constraints.push(limit(count));
    return this;
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this.execute();
  }

  async insert(data: Record<string, unknown> | Record<string, unknown>[]) {
    try {
      const records = Array.isArray(data) ? data : [data];
      const inserted: Record<string, unknown>[] = [];

      for (const item of records) {
        const id = (item.id as string) || doc(collection(db, this.colName)).id;
        const now = new Date().toISOString();
        const record = {
          ...item,
          id,
          created_at: item.created_at || now,
          updated_at: now,
        };
        await setDoc(doc(db, this.colName, id), record);
        inserted.push(record);
      }

      return { data: Array.isArray(data) ? inserted : inserted[0], error: null };
    } catch (err: unknown) {
      console.error(`[FirestoreAdapter] Insert error in ${this.colName}:`, err);
      return { data: null, error: err as Error };
    }
  }

  async update(data: Record<string, unknown>) {
    return {
      eq: async (field: string, value: string) => {
        try {
          if (field === "id") {
            const docRef = doc(db, this.colName, value);
            await updateDoc(docRef, {
              ...data,
              updated_at: new Date().toISOString(),
            });
            return { data, error: null };
          } else {
            const q = query(collection(db, this.colName), where(field, "==", value));
            const snap = await getDocs(q);
            for (const d of snap.docs) {
              await updateDoc(doc(db, this.colName, d.id), {
                ...data,
                updated_at: new Date().toISOString(),
              });
            }
            return { data, error: null };
          }
        } catch (err: unknown) {
          console.error(`[FirestoreAdapter] Update error in ${this.colName}:`, err);
          return { data: null, error: err as Error };
        }
      },
    };
  }

  async delete() {
    return {
      eq: async (field: string, value: string) => {
        try {
          if (field === "id") {
            await deleteDoc(doc(db, this.colName, value));
            return { data: null, error: null };
          } else {
            const q = query(collection(db, this.colName), where(field, "==", value));
            const snap = await getDocs(q);
            for (const d of snap.docs) {
              await deleteDoc(doc(db, this.colName, d.id));
            }
            return { data: null, error: null };
          }
        } catch (err: unknown) {
          console.error(`[FirestoreAdapter] Delete error in ${this.colName}:`, err);
          return { data: null, error: err as Error };
        }
      },
    };
  }

  async then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: Error | null; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    try {
      const colRef = collection(db, this.colName);
      const q = this.constraints.length > 0 ? query(colRef, ...this.constraints) : query(colRef);
      const snap = await getDocs(q);

      if (this.isCount) {
        return { data: null, count: snap.size, error: null };
      }

      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (this.isSingle) {
        if (rows.length === 0) {
          return { data: null, error: new Error("Record not found") };
        }
        return { data: rows[0], error: null };
      }

      if (this.isMaybeSingle) {
        return { data: rows.length > 0 ? rows[0] : null, error: null };
      }

      return { data: rows, count: rows.length, error: null };
    } catch (err: unknown) {
      console.warn(`[FirestoreAdapter] Query error in ${this.colName}:`, err);
      return { data: this.isSingle || this.isMaybeSingle ? null : [], count: 0, error: err as Error };
    }
  }
}

/**
 * Storage adapter bridging Supabase Storage calls to Firebase Storage
 */
class FirebaseStorageAdapter {
  from(bucketName: string) {
    return {
      upload: async (filePath: string, file: File | Blob) => {
        try {
          const storageRef = ref(storage, `${bucketName}/${filePath}`);
          await uploadBytes(storageRef, file);
          return { data: { path: `${bucketName}/${filePath}` }, error: null };
        } catch (err: unknown) {
          console.error("[FirebaseStorage] Upload error:", err);
          return { data: null, error: err as Error };
        }
      },
      getPublicUrl: (filePath: string) => {
        const bucket = (storage.app.options as { storageBucket?: string }).storageBucket || "gen-lang-client-0157270870.firebasestorage.app";
        const encodedPath = encodeURIComponent(`${bucketName}/${filePath}`);
        return {
          data: {
            publicUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`,
          },
        };
      },
      list: async (folder = "") => {
        try {
          const listRef = ref(storage, folder ? `${bucketName}/${folder}` : bucketName);
          const res = await listAll(listRef);
          const files = res.items.map((item) => ({
            name: item.name,
            id: item.fullPath,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            metadata: {},
          }));
          return { data: files, error: null };
        } catch (err: unknown) {
          console.warn("[FirebaseStorage] List error:", err);
          return { data: [], error: null };
        }
      },
      remove: async (paths: string[]) => {
        try {
          for (const p of paths) {
            const fileRef = ref(storage, `${bucketName}/${p}`);
            await deleteObject(fileRef);
          }
          return { data: null, error: null };
        } catch (err: unknown) {
          console.error("[FirebaseStorage] Remove error:", err);
          return { data: null, error: err as Error };
        }
      },
    };
  }
}

/**
 * Main Firebase-backed unified client
 */
export const firebaseAdapter = {
  from(collectionName: string) {
    return new FirestoreQueryBuilder(collectionName);
  },
  storage: new FirebaseStorageAdapter(),
  auth: {
    getUser: async () => {
      const curr = auth.currentUser;
      if (!curr) return { data: { user: null }, error: null };
      return {
        data: {
          user: {
            id: curr.uid,
            email: curr.email,
            user_metadata: { full_name: curr.displayName },
          },
        },
        error: null,
      };
    },
    getSession: async () => {
      const curr = auth.currentUser;
      if (!curr) return { data: { session: null }, error: null };
      return {
        data: {
          session: {
            user: { id: curr.uid, email: curr.email },
            access_token: await curr.getIdToken(),
          },
        },
        error: null,
      };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return {
          data: { user: { id: cred.user.uid, email: cred.user.email } },
          error: null,
        };
      } catch (err: unknown) {
        return { data: null, error: err as Error };
      }
    },
    signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        return {
          data: { user: { id: cred.user.uid, email: cred.user.email, full_name: options?.data?.full_name } },
          error: null,
        };
      } catch (err: unknown) {
        return { data: null, error: err as Error };
      }
    },
    signOut: async () => {
      try {
        await fbSignOut(auth);
        return { error: null };
      } catch (err: unknown) {
        return { error: err as Error };
      }
    },
    resetPasswordForEmail: async (email: string) => {
      try {
        await sendPasswordResetEmail(auth, email);
        return { data: {}, error: null };
      } catch (err: unknown) {
        return { data: null, error: err as Error };
      }
    },
    onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdToken();
          callback("SIGNED_IN", {
            user: { id: user.uid, email: user.email },
            access_token: token,
          });
        } else {
          callback("SIGNED_OUT", null);
        }
      });
      return {
        data: {
          subscription: {
            unsubscribe,
          },
        },
      };
    },
  },
};
