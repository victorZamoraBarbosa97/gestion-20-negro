// src/components/navigation/Header.jsx
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { BaselineOutput } from "../ui/Icons";

const Header = () => {
  const { logout, currentUser } = useContext(AuthContext); // Usamos el logout del contexto

  return (
    <nav className="bg-gradient-to-r from-blue-800 to-indigo-900 shadow-xl sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        {/* Logo o Título del Dashboard */}
        <div className="flex items-center space-x-2">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Avatar"
              className="h-9 w-9 rounded-full"
            />
          ) : (
             <img
                src="logo.svg"
                alt="Logo"
                className="h-8 md:h-9 w-auto filter drop-shadow-md rounded-full"
              />
          )}

          <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
            {currentUser?.displayName || 'Gestión 20 Negro'}
          </span>
        </div>

        {/* Botón de Cerrar Sesión */}
        <button
          onClick={logout} // Llamamos directamente a logout
          className="group flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-2.5 bg-blue-700 bg-opacity-70 text-white text-sm sm:text-base font-semibold rounded-full 
                     shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
                     transition duration-300 ease-in-out 
                     border border-blue-600 hover:border-blue-500
                     hover:bg-blue-600 hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-800"
          aria-label="Cerrar Sesión"
        >
          <span className="text-white">Salir</span>
          {/* Icono animado */}
          <BaselineOutput className="h-4 w-4 sm:h-5 sm:w-5 text-white transform transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </nav>
  );
};

export default Header;
