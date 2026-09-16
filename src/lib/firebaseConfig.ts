/**
 * Firebase Client Configuration
 * 
 * Safely manages Firebase configuration with fallback values to ensure builds succeed
 * across all environments (Vercel, Cloud Run, GitHub exports, CI/CD) without missing module errors.
 */

export interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
  [key: string]: unknown;
}

export const firebaseConfig: FirebaseAppletConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0157270870",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:454092063858:web:d7ed4efdeea854d2e72eeb",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDcor_raMxPVtynMAZBV29_qtkhzkJo0jo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0157270870.firebaseapp.com",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0157270870.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "454092063858",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-51S906HNK0",
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || "454092063858-7roq6294thptbhn44qcavbuh3ri6scf3.apps.googleusercontent.com",
  recaptchaSiteKey: import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || "",
};

export default firebaseConfig;
