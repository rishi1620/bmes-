import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db, auth, storage } from "@/integrations/firebase/client";

export { db, auth, storage };

// Generic CRUD helpers for Firestore
export async function getCollectionData<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as unknown as T[];
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

export async function getDocumentData<T = DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as unknown as T;
  } catch (error) {
    console.error(`Error fetching doc ${collectionName}/${docId}:`, error);
    return null;
  }
}

export async function createDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: T,
  customId?: string
): Promise<string> {
  try {
    const docRef = customId ? doc(db, collectionName, customId) : doc(collection(db, collectionName));
    const now = new Date().toISOString();
    await setDoc(docRef, {
      ...data,
      id: docRef.id,
      created_at: data.created_at || now,
      updated_at: now,
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

export async function updateDocument<T extends Record<string, unknown>>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}/${docId}:`, error);
    throw error;
  }
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document in ${collectionName}/${docId}:`, error);
    throw error;
  }
}

// Storage helpers
export async function uploadFileToFirebaseStorage(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });
}
