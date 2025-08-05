// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInAnonymously } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // 'loading' representa la verificación inicial del estado de autenticación al cargar la app.
  const [loading, setLoading] = useState(true);

  const login = useCallback(async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      // onAuthStateChanged se encargará del resto.
    } catch (error) {
      // Evitar mostrar error si el usuario simplemente cierra el popup.
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error("Error al iniciar sesión con Google.");
        console.error("Error en signInWithPopup:", error);
      }
    }
  }, []);

  const loginAsGuest = useCallback(async () => {
    try {
      await signInAnonymously(auth);
      toast.success("Has iniciado sesión como invitado.");
    } catch (error) {
      toast.error("No se pudo iniciar sesión como invitado.");
      console.error("Error en signInAnonymously:", error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      toast.success("Sesión cerrada correctamente.");
    } catch (error) {
      toast.error("Error al cerrar sesión.");
      console.error("Error en signOut:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.isAnonymous) {
          setCurrentUser({ ...user, displayName: 'Invitado' });
        } else {
          try {
            const allowlistRef = doc(db, "allowlist", user.email);
            const allowlistSnap = await getDoc(allowlistRef);

            if (allowlistSnap.exists()) {
              const userRef = doc(db, "usuarios", user.uid);
              await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: serverTimestamp(),
                role: allowlistSnap.data().role || "user",
              }, { merge: true });
              setCurrentUser(user);
            } else {
              // CORRECCIÓN: Se utiliza el template literal (`) correctamente.
              toast.error(`Acceso denegado. ${user.email} no está autorizado.`);
              await signOut(auth); // Esto disparará onAuthStateChanged de nuevo con user=null.
            }
          } catch (error) {
            console.error("Error en la verificación de permisos:", error);
            toast.error("Error al verificar permisos.");
            await signOut(auth);
          }
        }
      } else {
        setCurrentUser(null);
      }
      // Cuando la verificación termina (haya usuario o no), finaliza el estado de carga inicial.
      setLoading(false);
    });
    
    // Se retorna la función de limpieza para desuscribirse al desmontar el componente.
    return () => unsubscribe();
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez.

  const value = {
    currentUser,
    loading,
    login,
    logout,
    loginAsGuest, 
  };

  return (
    <AuthContext.Provider value={value}>
       {children}
    </AuthContext.Provider>
  );
};
