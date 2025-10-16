// src/context/AuthContext.jsx
// ✨ VERSIÓN MEJORADA - Sin Race Conditions
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserSessionPersistence,
  signInAnonymously,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { logger } from "../utils/logger";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // ✅ MEJORA 1: Estados separados y más descriptivos
  // ANTES: Solo había `loading`
  // AHORA: Separamos "initialized" de "loading"
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false); // Para operaciones específicas
  const [initialized, setInitialized] = useState(false); // Para la inicialización de Firebase
  const [authError, setAuthError] = useState(null); // Para errores de auth

  // ✅ MEJORA 2: Login con mejor manejo de errores
  const login = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      await setPersistence(auth, browserSessionPersistence);

      if (window.location.hostname === "localhost") {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } else {
        await signInWithRedirect(auth, new GoogleAuthProvider());
      }
      
      logger.event('login_initiated', { method: 'google' });
    } catch (error) {
      const errorMessage = "Error al iniciar el inicio de sesión.";
      setAuthError(errorMessage);
      toast.error(errorMessage);
      logger.error("Error en el proceso de login", error);
    } finally {
      // ✅ Siempre limpiamos loading, incluso si hay error
      setLoading(false);
    }
  }, []);

  const loginAsGuest = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInAnonymously(auth);
      toast.success("Has iniciado sesión como invitado.");
      logger.event('login_guest');
    } catch (error) {
      const errorMessage = "No se pudo iniciar sesión como invitado.";
      setAuthError(errorMessage);
      toast.error(errorMessage);
      logger.error("Error en signInAnonymously", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      await signOut(auth);
      toast.success("Sesión cerrada correctamente.");
      logger.event('logout');
    } catch (error) {
      const errorMessage = "Error al cerrar sesión.";
      setAuthError(errorMessage);
      toast.error(errorMessage);
      logger.error("Error en signOut", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ MEJORA 3: useEffect completamente reescrito para evitar race conditions
  useEffect(() => {
    // ✅ Flag para prevenir updates después de unmount
    // ANTES: No existía
    // AHORA: Protege contra actualizaciones de estado en componente desmontado
    let isMounted = true;
    let unsubscribe = () => {};

    const initializeAuth = async () => {
      try {
        // ✅ MEJORA 4: Procesar redirect ANTES de setup listener
        // Protegido con isMounted
        logger.info('Inicializando autenticación...');
        
        const redirectResult = await getRedirectResult(auth);
        
        // ✅ Verificar si aún estamos montados después del async
        if (!isMounted) {
          logger.warn('Componente desmontado durante getRedirectResult');
          return;
        }

        if (redirectResult?.user) {
          logger.info('Redirect result procesado', { 
            uid: redirectResult.user.uid 
          });
        }
      } catch (error) {
        // ✅ Solo procesar error si seguimos montados
        if (!isMounted) return;
        
        logger.error("Error durante el procesamiento de la redirección", error);
        toast.error("Fallo en el inicio de sesión. Por favor, intenta de nuevo.");
        setAuthError("Error en redirección de autenticación");
      }

      // ✅ MEJORA 5: Setup listener con protección contra unmount
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        // ✅ Verificar isMounted INMEDIATAMENTE al inicio del callback
        if (!isMounted) {
          logger.warn('Componente desmontado durante onAuthStateChanged');
          return;
        }

        try {
          if (user) {
            logger.info('Usuario detectado', { 
              uid: user.uid, 
              isAnonymous: user.isAnonymous 
            });

            // ✅ Caso: Usuario anónimo (invitado)
            if (user.isAnonymous) {
              if (!isMounted) return; // ✅ Verificar antes de setState
              setCurrentUser({ ...user, displayName: "Invitado" });
              setAuthError(null);
            } else {
              // ✅ Caso: Usuario autenticado con Google
              
              // ✅ MEJORA 6: Verificar allowlist con protección
              const allowlistRef = doc(db, "allowlist", user.email);
              const allowlistSnap = await getDoc(allowlistRef);

              // ✅ Verificar isMounted después de operación async
              if (!isMounted) return;

              if (allowlistSnap.exists()) {
                // Usuario autorizado - guardar/actualizar en Firestore
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

                // ✅ Verificar isMounted después de setDoc
                if (!isMounted) return;

                setCurrentUser(user);
                setAuthError(null);
                logger.event('user_authenticated', { 
                  uid: user.uid, 
                  role: allowlistSnap.data().role 
                });
              } else {
                // Usuario NO autorizado
                const errorMsg = `Acceso denegado: ${user.email} no autorizado.`;
                logger.warn('Usuario no autorizado intentó acceder', { 
                  email: user.email 
                });
                
                toast.error(errorMsg);
                
                // ✅ MEJORA 7: Manejo de errores en signOut
                try {
                  await signOut(auth);
                } catch (signOutError) {
                  logger.error('Error al hacer signOut de usuario no autorizado', signOutError);
                  // No mostrar toast adicional para evitar confundir al usuario
                }

                // ✅ Verificar isMounted después de signOut
                if (!isMounted) return;
                
                setCurrentUser(null);
                setAuthError(errorMsg);
              }
            }
          } else {
            // ✅ Usuario no autenticado (logout o nunca logueado)
            logger.info('Usuario no autenticado');
            if (!isMounted) return;
            setCurrentUser(null);
            setAuthError(null);
          }
        } catch (error) {
          // ✅ MEJORA 8: Manejo robusto de errores
          logger.error("Error en onAuthStateChanged", error);
          
          if (!isMounted) return;
          
          const errorMsg = "Error al verificar permisos.";
          setAuthError(errorMsg);
          toast.error(errorMsg);

          // ✅ Intentar logout seguro en caso de error
          try {
            await signOut(auth);
          } catch (signOutError) {
            logger.error('Error al hacer signOut después de error de permisos', signOutError);
          }

          if (!isMounted) return;
          setCurrentUser(null);
        } finally {
          // ✅ MEJORA 9: Siempre marcar como inicializado
          // ANTES: setLoading(false) solo se ejecutaba en el happy path
          // AHORA: setInitialized(false) se ejecuta SIEMPRE, incluso con errores
          if (isMounted) {
            setInitialized(true);
            logger.info('Autenticación inicializada');
          }
        }
      });
    };

    // ✅ Ejecutar inicialización
    initializeAuth();

    // ✅ MEJORA 10: Cleanup mejorado
    // ANTES: return () => unsubscribe();
    // AHORA: Marcamos como unmounted Y desuscribimos
    return () => {
      logger.info('Limpiando AuthContext');
      isMounted = false; // ✅ Previene cualquier setState después de esto
      unsubscribe(); // ✅ Limpia el listener de Firebase
    };
  }, []); // ✅ Array de dependencias vacío - solo corre una vez

  // ✅ MEJORA 11: No renderizar children hasta que esté inicializado
  // ANTES: Renderizaba inmediatamente con loading=true
  // AHORA: Muestra loading spinner hasta que Firebase esté listo
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando autenticación...</p>
        </div>
      </div>
    );
  }

  // ✅ MEJORA 12: Value mejorado con más información útil
  const value = {
    currentUser,
    loading,        // ✅ Para operaciones específicas (login, logout)
    initialized,    // ✅ Para saber si Firebase está listo
    authError,      // ✅ Para manejar errores de auth
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
