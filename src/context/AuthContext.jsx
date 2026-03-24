// src/context/AuthContext.jsx
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { logger } from "../utils/logger";

export const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // ✅ MEJORA 1: Estados separados y más descriptivos
  // ANTES: Solo había `loading`
  // AHORA: Separamos "initialized" de "loading"
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false); // Para operaciones específicas
  const [initialized, setInitialized] = useState(false); // Para la inicialización de Firebase
  const [authError, setAuthError] = useState(null); // Para errores de auth

  // ✅ MEJORA: Mutex para evitar doble ejecución (doble clic)
  // useRef cambia instantáneamente sin esperar al re-render de React
  const isOperating = useRef(false);

  // MEJORA 2: Login con mejor manejo de errores
  const login = useCallback(async () => {
    if (isOperating.current) return; // 🔒 Bloqueo inmediato
    isOperating.current = true;

    setLoading(true);
    setAuthError(null);

    try {
      console.log("🔐 [AUTH] Iniciando proceso de login...");
      await setPersistence(auth, browserLocalPersistence);

      // ESTRATEGIA HÍBRIDA ROBUSTA
      // Móvil: Redirect (Obligatorio por UX y limitaciones de SO)
      // Desktop: Popup (Más fiable, evita problemas de cookies/storage en redirecciones)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log("📱 [AUTH] ¿Es dispositivo móvil?:", isMobile);

      if (isMobile) {
        console.log("🔀 [AUTH] Ejecutando signInWithRedirect...");
        await signInWithRedirect(auth, new GoogleAuthProvider());
      } else {
        console.log("🪟 [AUTH] Ejecutando signInWithPopup...");
        await signInWithPopup(auth, new GoogleAuthProvider());
        console.log("✅ [AUTH] Popup cerrado y autenticación exitosa.");
      }
    } catch (error) {
      console.error("❌ [AUTH ERROR] Falló el login:", error);
      const errorMessage = "Error al iniciar el inicio de sesión.";
      setAuthError(errorMessage);
      toast.error(errorMessage);
      logger.error("Error en el proceso de login", error);
    } finally {
      // Siempre limpiamos loading, incluso si hay error
      setLoading(false);
      isOperating.current = false; // 🔓 Liberar bloqueo
    }
  }, []);

  const loginAsGuest = useCallback(async () => {
    if (isOperating.current) return; // 🔒 Bloqueo inmediato
    isOperating.current = true;

    setLoading(true);
    setAuthError(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInAnonymously(auth);
      toast.success("Has iniciado sesión como invitado.");
    } catch (error) {
      const errorMessage = "No se pudo iniciar sesión como invitado.";
      setAuthError(errorMessage);
      toast.error(errorMessage);
      logger.error("Error en signInAnonymously", error);
    } finally {
      setLoading(false);
      isOperating.current = false; // 🔓 Liberar bloqueo
    }
  }, []);

  const logout = useCallback(async () => {
    if (isOperating.current) return; // 🔒 Bloqueo inmediato
    isOperating.current = true;

    setLoading(true);
    setAuthError(null);

    try {
      await signOut(auth);
      // El toast de éxito ya no es necesario aquí si onAuthStateChanged maneja la transición
      // O podemos dejarlo, pero asegurarnos de que onAuthStateChanged no lance errores
      toast.success("Sesión cerrada.");
    } catch (error) {
      // Ignoramos errores de logout si son triviales (ej. ya estaba deslogueado)
      logger.error("Error en signOut", error);
    } finally {
      setLoading(false);
      isOperating.current = false; // 🔓 Liberar bloqueo
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
      // ✅ MEJORA 5: Setup listener con protección contra unmount
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        // ✅ Verificar isMounted INMEDIATAMENTE al inicio del callback
        if (!isMounted) {
          logger.warn("Componente desmontado durante onAuthStateChanged");
          return;
        }

        try {
          if (user) {
            logger.info("Usuario detectado", {
              uid: user.uid,
              isAnonymous: user.isAnonymous,
            });

            // Usuario anónimo (invitado)
            if (user.isAnonymous) {
              if (!isMounted) return; // Verificar antes de setState
              setCurrentUser({ ...user, displayName: "Invitado" });
              setAuthError(null);
            } else {
              // Usuario autenticado con Google

              // Verificar allowlist con protección
              const allowlistRef = doc(db, "allowlist", user.email);
              const allowlistSnap = await getDoc(allowlistRef);

              // Verificar isMounted después de operación async
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
                  { merge: true },
                );

                // Verificar isMounted después de setDoc
                if (!isMounted) return;

                setCurrentUser(user);
                setAuthError(null);
              } else {
                // Usuario NO autorizado
                const errorMsg = `Acceso denegado: ${user.email} no autorizado.`;
                logger.warn("Usuario no autorizado intentó acceder", {
                  email: user.email,
                });

                toast.error(errorMsg);

                // Manejo de errores en signOut
                try {
                  await signOut(auth);
                } catch (signOutError) {
                  logger.error(
                    "Error al hacer signOut de usuario no autorizado",
                    signOutError,
                  );
                  // No mostrar toast adicional para evitar confundir al usuario
                }

                // Verificar isMounted después de signOut
                if (!isMounted) return;

                setCurrentUser(null);
                setAuthError(errorMsg);
              }
            }
          } else {
            // Usuario no autenticado (logout o nunca logueado)
            logger.info("Usuario no autenticado");
            if (!isMounted) return;
            setCurrentUser(null);
            setAuthError(null);
          }
        } catch (error) {
          // Manejo robusto de errores
          logger.error("Error en onAuthStateChanged", error);

          if (!isMounted) return;

          const errorMsg = "Error al verificar permisos.";
          setAuthError(errorMsg);
          toast.error(errorMsg);

          // Intentar logout seguro en caso de error
          try {
            await signOut(auth);
          } catch (signOutError) {
            logger.error(
              "Error al hacer signOut después de error de permisos",
              signOutError,
            );
          }

          if (!isMounted) return;
          setCurrentUser(null);
        } finally {
          // AsetInitialized(false) se ejecuta SIEMPRE, incluso con errores
          if (isMounted) {
            setInitialized(true);
            logger.info("Autenticación inicializada");
          }
        }
      });

      // No bloqueamos la interfaz esperando la respuesta del redirect.
      try {
        console.log(
          "🔄 [AUTH] Verificando resultado de redirección (getRedirectResult)...",
        );
        const redirectResult = await getRedirectResult(auth);

        if (isMounted && redirectResult?.user) {
          logger.info("Redirect result procesado exitosamente", {
            uid: redirectResult.user.uid,
          });
          console.log(
            "[AUTH] Usuario recuperado de redirección:",
            redirectResult.user.uid,
          );
          // No es necesario setear el usuario aquí manualmente,
          // onAuthStateChanged se disparará automáticamente.
        }
      } catch (error) {
        if (isMounted) {
          logger.error("Error verificando resultado de redirección", error);
          // Solo mostramos toast si es un error real y no una cancelación de usuario
          if (
            error.code !== "auth/popup-closed-by-user" &&
            error.code !== "auth/cancelled-popup-request"
          ) {
            toast.error("Hubo un problema al completar el inicio de sesión.");
          }
        }
      }
    };

    // Ejecutar inicialización
    initializeAuth();

    // Marcamos como unmounted Y desuscribimos
    return () => {
      logger.info("Limpiando AuthContext");
      isMounted = false; // Previene cualquier setState después de esto
      unsubscribe(); // Limpia el listener de Firebase
    };
  }, []); // ✅ Array de dependencias vacío - solo corre una vez

  // ✅ MEJORA 11: No renderizar children hasta que esté inicializado
  // Muestra loading spinner hasta que Firebase esté listo
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

  const value = {
    currentUser,
    loading, // Para operaciones específicas (login, logout)
    initialized, // Para saber si Firebase está listo
    authError, // Para manejar errores de auth
    login,
    logout,
    loginAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
