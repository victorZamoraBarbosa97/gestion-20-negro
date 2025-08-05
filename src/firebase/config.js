import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// This will be populated by the init.js script in Firebase Hosting environments
const firebaseConfig = window.firebaseConfig;

let app;

// Check if the firebaseConfig object is available (from init.js)
if (firebaseConfig) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized with config from Firebase Hosting.");
} else {
  // Fallback for local development using environment variables
  console.log("Firebase config not found, using environment variables for local development.");
  const localFirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  app = initializeApp(localFirebaseConfig);
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
