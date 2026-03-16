import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  setDoc,
  getDoc,
  FieldValue
} from 'firebase/firestore';
import { db, auth } from '@/firebase';

// Types
export interface SocietyEvent {
  id?: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  type: 'workshop' | 'seminar' | 'social' | 'other';
  createdBy: string;
  createdAt: FieldValue;
}

export interface Member {
  uid: string;
  name: string;
  email: string;
  role: 'member' | 'admin' | 'executive';
  joinedAt: FieldValue;
  bio?: string;
}

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  date: FieldValue;
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
}

// Error Handling
const handleFirestoreError = (error: Error, operation: string, path: string) => {
  const errInfo = {
    error: error.message || String(error),
    operationType: operation,
    path: path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    }
  };
  console.error(`Firestore Error [${operation}] at [${path}]:`, JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

// Events Service
export const eventsService = {
  subscribe: (callback: (events: SocietyEvent[]) => void) => {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SocietyEvent[];
      callback(events);
    }, (error) => handleFirestoreError(error, 'list', 'events'));
  },

  add: async (event: Omit<SocietyEvent, 'id' | 'createdBy' | 'createdAt'>) => {
    if (!auth.currentUser) throw new Error("Auth required");
    const path = 'events';
    try {
      return await addDoc(collection(db, path), {
        ...event,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'create', path);
    }
  },

  update: async (id: string, event: Partial<SocietyEvent>) => {
    const path = `events/${id}`;
    try {
      const docRef = doc(db, 'events', id);
      await updateDoc(docRef, event);
    } catch (error) {
      handleFirestoreError(error, 'update', path);
    }
  },

  delete: async (id: string) => {
    const path = `events/${id}`;
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      handleFirestoreError(error, 'delete', path);
    }
  }
};

// Members Service
export const membersService = {
  subscribe: (callback: (members: Member[]) => void) => {
    const q = query(collection(db, 'members'), orderBy('joinedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => doc.data()) as Member[];
      callback(members);
    }, (error) => handleFirestoreError(error, 'list', 'members'));
  },

  getProfile: async (uid: string) => {
    const path = `members/${uid}`;
    try {
      const docSnap = await getDoc(doc(db, 'members', uid));
      return docSnap.exists() ? docSnap.data() as Member : null;
    } catch (error) {
      handleFirestoreError(error, 'get', path);
    }
  },

  updateProfile: async (uid: string, profile: Partial<Member>) => {
    const path = `members/${uid}`;
    try {
      const docRef = doc(db, 'members', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, profile);
      } else {
        await setDoc(docRef, {
          ...profile,
          uid,
          joinedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, 'write', path);
    }
  }
};

// Announcements Service
export const announcementsService = {
  subscribe: (callback: (announcements: Announcement[]) => void) => {
    const q = query(collection(db, 'announcements'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const announcements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      callback(announcements);
    }, (error) => handleFirestoreError(error, 'list', 'announcements'));
  },

  add: async (announcement: Omit<Announcement, 'id' | 'createdBy' | 'date'>) => {
    if (!auth.currentUser) throw new Error("Auth required");
    const path = 'announcements';
    try {
      return await addDoc(collection(db, path), {
        ...announcement,
        date: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });
    } catch (error) {
      handleFirestoreError(error, 'create', path);
    }
  }
};
