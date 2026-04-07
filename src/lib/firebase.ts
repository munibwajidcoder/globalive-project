import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || "").trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
  databaseURL: (import.meta.env.VITE_FIREBASE_DATABASE_URL || "").trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || "").trim(),
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "").trim(),
};

// Check if critical config properties are present
const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId && !firebaseConfig.apiKey.includes("your_"));

let isFirebaseReady = false;
let app: any = null;
let auth: any = null;
let rtdb: any = null;
let db: any = null;
let storage: any = null;

if (isConfigValid) {
  try {
    console.log("Firebase: Initializing app...");
    app = initializeApp(firebaseConfig);
    
    try {
      auth = getAuth(app);
      console.log("Firebase: Auth initialized.");
    } catch (e) {
      console.error("Firebase: Auth failed:", e);
    }
    
    try {
      rtdb = getDatabase(app);
      console.log("Firebase: RTDB initialized.");
    } catch (e) {
      console.error("Firebase: RTDB failed:", e);
    }
    
    try {
      db = getFirestore(app);
      console.log("Firebase: Firestore initialized.");
    } catch (e) {
      console.error("Firebase: Firestore failed:", e);
    }
    
    try {
      storage = getStorage(app);
      console.log("Firebase: Storage initialized.");
    } catch (e) {
      console.error("Firebase: Storage failed:", e);
    }
    
    // Consider it ready if at least the app and Firestore/Auth are initialized
    isFirebaseReady = !!(app && (db || auth));
    console.log("Firebase: Initialization status:", isFirebaseReady ? "Ready" : "Failed");
  } catch (error) {
    console.error("Firebase: Root initialization failed:", error);
  }
} else {
  console.warn("Firebase: Configuration is missing or using placeholders! Please check your Vercel Environment Variables.");
}

export { auth, rtdb, db, storage, isConfigValid, isFirebaseReady };
export default app;
