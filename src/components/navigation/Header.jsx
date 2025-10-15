// src/components/navigation/Header.jsx
import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { HomeIcon, ChartBarIcon, LogoutIcon } from "../ui/Icons";

const Header = () => {
  const { logout, currentUser } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeLinkStyle = {
    color: "#FFFFFF",
    textDecoration: "underline",
    textDecorationColor: "#60A5FA",
    textDecorationThickness: "2px",
    textUnderlineOffset: "4px",
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-blue-800 to-indigo-900 shadow-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Lado Izquierdo: Logo y Título (Clickable to Dashboard) */}
          <NavLink
            to="/dashboard"
            className="flex items-center space-x-2 flex-shrink-0"
            onClick={closeMobileMenu}
          >
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-9 w-auto rounded-full filter drop-shadow-md"
            />
            <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md hidden md:block">
              Gestión 20 Negro
            </span>
          </NavLink>

          {/* Navegación de Escritorio con Iconos */}
          <nav className="hidden md:flex md:space-x-4 flex-grow justify-center">
            <NavLink
              to="/dashboard"
              style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
              className="text-blue-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <HomeIcon className="h-5 w-5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/reports"
              style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
              className="text-blue-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <ChartBarIcon className="h-5 w-5" />
              <span>Reportes</span>
            </NavLink>
          </nav>

          {/* Lado Derecho: Avatar de Usuario y Botón de Salir (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            <span className="text-sm font-medium text-white">
              {currentUser?.displayName}
            </span>
            {currentUser?.photoURL && (
              <img
                src={currentUser.photoURL}
                alt="Avatar"
                className="h-9 w-9 rounded-full"
              />
            )}
            <button
              onClick={logout}
              className="group flex items-center space-x-2 px-4 py-2 bg-blue-700 bg-opacity-70 text-white text-sm font-semibold rounded-full 
                         shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
                         transition duration-300 ease-in-out 
                         border border-blue-600 hover:border-blue-500
                         hover:bg-blue-600 hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-800"
              aria-label="Cerrar Sesión"
            >
              <span className="hidden sm:block">Salir</span>
              <LogoutIcon className="h-5 w-5 text-white transition-transform duration-300 group-hover:translate-x-1" />{" "}
            </button>
          </div>

          {/* Botón de Menú Móvil */}
          <div className="md:hidden flex items-center">
            {currentUser?.photoURL && (
              <img
                src={currentUser.photoURL}
                alt="Avatar"
                className="h-8 w-8 rounded-full mr-2"
              />
            )}
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Abrir menú principal</span>
              {!isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil con Iconos */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink
              to="/dashboard"
              onClick={closeMobileMenu}
              className="text-blue-200 hover:bg-blue-700 hover:text-white  px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-3"
            >
              <HomeIcon className="h-6 w-6" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/reports"
              onClick={closeMobileMenu}
              className="text-blue-200 hover:bg-blue-700 hover:text-white  px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-3"
            >
              <ChartBarIcon className="h-6 w-6" />
              <span>Reportes</span>
            </NavLink>
            <button
              onClick={() => {
                logout();
                closeMobileMenu();
              }}
              className="w-full text-left text-blue-200 hover:bg-red-700 hover:text-white  px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-3"
            >
              <LogoutIcon className="h-6 w-6" /> {/* REEMPLAZADO */}
              <span>Salir ({currentUser?.displayName})</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
