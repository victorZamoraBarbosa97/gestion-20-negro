// src/pages/LoginPage.jsx
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/config"; // Importamos la configuración de auth directamente.
import { AuthContext } from "../context/AuthContext"; // Todavía lo necesitamos para el login de invitado
import { useContext } from "react";


// --- UI Components ---
const Logo = () => (
  <img src="/logo.svg" alt="Logo 20 Negro" className="w-24 h-24 mx-auto mb-6" />
);

const GoogleLoginButton = ({ onClick, isLoading }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-gray-200 bg-gray-800 border border-gray-600 rounded-lg shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
     <svg className="w-5 h-5 mr-3" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    <span>{isLoading ? "Iniciando..." : "Iniciar sesión con Google"}</span>
  </button>
);

const GuestLoginButton = ({ onClick, isLoading }) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors duration-200"
    >
      Entrar como invitado
    </button>
);


const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginAsGuest, loading: guestLoading } = useContext(AuthContext);

  const handleGoogleLoginDebug = async () => {
    setIsLoading(true);
    alert("Paso 1: Iniciando handleGoogleLoginDebug");
    console.log("Paso 1: Iniciando handleGoogleLoginDebug");

    try {
      const provider = new GoogleAuthProvider();
      console.log("Paso 2: Proveedor de Google creado.");
      alert("Paso 2: Proveedor de Google creado. Abriendo popup...");

      const result = await signInWithPopup(auth, provider);
      
      console.log("Paso 3: ¡ÉXITO! signInWithPopup completado.");
      alert(`Paso 3: ¡ÉXITO! Usuario: ${result.user.displayName}`);
      console.log("Resultado completo:", result);
      console.log("Usuario:", result.user);

    } catch (error) {
      console.error("Paso 3: ¡ERROR! Ocurrió un problema en signInWithPopup.", error);
      alert(`Paso 3: ¡ERROR! Código: ${error.code}\nMensaje: ${error.message}`);
    } finally {
      setIsLoading(false);
      console.log("Paso 4: Fin del proceso de login.");
      alert("Paso 4: Fin del proceso de login.");
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen w-full bg-black p-4">
      <div className="relative w-full max-w-md">
        <div className="absolute -top-20 -left-10 w-72 h-72 bg-red-600/30 rounded-full mix-blend-lighten filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-20 -right-10 w-72 h-72 bg-red-800/30 rounded-full mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative w-full p-8 space-y-6 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl">
          <Logo />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Gestión 20 Negro
            </h1>
            <p className="mt-2 text-gray-400">Control de Pagos Semanales</p>
          </div>
          <div className="pt-4 space-y-4">
            <GoogleLoginButton onClick={handleGoogleLoginDebug} isLoading={isLoading} />
            <GuestLoginButton onClick={loginAsGuest} isLoading={guestLoading} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
