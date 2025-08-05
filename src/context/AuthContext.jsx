// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut, getRedirectResult } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged: Se disparó el evento.");

      if (user) {
        // Comprobar si el usuario es anónimo
        if (user.isAnonymous) {
          console.log("Usuario anónimo detectado. Acceso concedido.");
          setCurrentUser(user);
        } else {
          // Lógica para usuarios de Google
          try {
            console.log(`Verificando autorización para: ${user.email}`);
            const allowlistRef = doc(db, "allowlist", user.email);
            const allowlistSnap = await getDoc(allowlistRef);

            if (allowlistSnap.exists()) {
              console.log("¡Acceso concedido! Estableciendo usuario.");
              const userRef = doc(db, "usuarios", user.uid);
              await setDoc(
                userRef,
                {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                  lastLogin: serverTimestamp(),
                  role: allowlistSnap.data().role || "user",
                },
                { merge: true }
              );
              setCurrentUser(user);
            } else {
              console.warn(
                `¡ACCESO DENEGADO! ${user.email} no está en 'allowlist'.`
              );
              await signOut(auth);
              setCurrentUser(null);
            }
          } catch (error) {
            console.error("Error en la verificación de permisos:", error);
            await signOut(auth);
            setCurrentUser(null);
          }
        }
      } else {
        console.log("No hay usuario de Firebase.");
        setCurrentUser(null);
      }

      setLoading(false);
    });

    getRedirectResult(auth).catch((error) => {
      console.error("AuthContext: Error al procesar la redirección:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
