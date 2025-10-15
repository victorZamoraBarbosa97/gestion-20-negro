import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app;

// ¿Hay aplicaciones de Firebase ya inicializadas?
if (getApps().length === 0) {
  // NO: Estamos en desarrollo local. Inicializamos la app.
  console.log("No Firebase app found, initializing for local development...");
  const localFirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  app = initializeApp(localFirebaseConfig);
} else {
  // SÍ: Estamos en producción. Obtenemos la app que init.js ya creó.
  console.log("Firebase already initialized by hosting script. Getting app...");
  app = getApp();
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db, app };
