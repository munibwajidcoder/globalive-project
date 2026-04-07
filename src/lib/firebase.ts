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

let app: any;
let auth: any;
let rtdb: any;
let db: any;
let storage: any;

if (isConfigValid) {
  try {
    console.log("Firebase: Configuration found, initializing...");
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    rtdb = getDatabase(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("Firebase: Initialization successful.");
  } catch (error) {
    console.error("Firebase: Initialization failed:", error);
  }
} else {
  console.warn("Firebase: Configuration is missing or using placeholders! Please check your Vercel Environment Variables.");
  console.log("Firebase: Running in safe fallback mode.");
  // Provide empty objects to avoid crashing the whole app during module load
  auth = { currentUser: null } as any;
  rtdb = {} as any;
  db = {} as any;
  storage = {} as any;
}

export { auth, rtdb, db, storage };
export default app;
