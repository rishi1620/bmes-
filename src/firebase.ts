import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Connection test
async function testConnection() {
  try {
    // Attempt to get a non-existent doc to test connection
    await getDocFromServer(doc(db, '_connection_test_', 'init'));
    console.log("Firebase connected successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase connection failed: Client is offline. Check configuration.");
    }
    // Other errors (like permission denied) are expected for this test doc
  }
}

testConnection();

export default app;
