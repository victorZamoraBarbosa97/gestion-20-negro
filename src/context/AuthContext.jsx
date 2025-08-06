// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithRedirect, getRedirectResult, setPersistence, browserSessionPersistence, signInAnonymously } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async () => {
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (error) {
      toast.error("Error al configurar o iniciar el inicio de sesión.");
      console.error("Error en el proceso de login:", error);
    }
  }, []);
  
  const loginAsGuest = useCallback(async () => {
    try {
      await setPersistence(auth, browserSessionPersistence);
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
    let unsubscribe = () => {}; // Placeholder para la función de limpieza.

    const checkAuthStatus = async () => {
      try {
        // 1. PRIMERO: Esperamos a que se procese cualquier resultado de redirección.
        // Esto pausa la ejecución hasta que Firebase haya procesado internamente el token de inicio de sesión.
        await getRedirectResult(auth);
      } catch (error) {
        // Capturamos cualquier error que ocurriera en la página de Google.
        console.error("Error durante el procesamiento de la redirección:", error);
        toast.error("Fallo en el inicio de sesión. Por favor, intenta de nuevo.");
      }
      
      // 2. SEGUNDO: Configuramos el listener.
      // Ahora que la redirección está procesada, onAuthStateChanged tendrá el estado de usuario definitivo y correcto.
      unsubscribe = onAuthStateChanged(auth, async (user) => {
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
                toast.error(`Acceso denegado: ${user.email} no autorizado.`);
                await signOut(auth);
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
        // 3. TERCERO: Dejamos de cargar SOLO cuando tenemos el estado final.
        setLoading(false);
      });
    };

    checkAuthStatus();

    // La función de limpieza que devuelve useEffect se encargará de desuscribirse.
    return () => unsubscribe();
  }, []);

  const value = { currentUser, loading, login, logout, loginAsGuest };

  return (
    <AuthContext.Provider value={value}>
       {children}
    </AuthContext.Provider>
  );
};
