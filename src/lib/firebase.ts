import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

// Check if critical config properties are present
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId;

let app;
try {
  if (!isConfigValid) {
    console.error("Firebase configuration is missing in .env file! Please check the README and populate your VITE_FIREBASE_* variables.");
    // We still initialize with whatever we have to avoid breaking the module export, but it might fail later.
    // Or we can return a mock if it strictly crashes.
    app = initializeApp(firebaseConfig);
  } else {
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Attempt to initialize anyway to keep exports satisfied, or handle gracefully
}

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
