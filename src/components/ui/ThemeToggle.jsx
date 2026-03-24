// src/components/ui/ThemeToggle.jsx

import { useTheme } from "../../context/ThemeContext";
import { MoonIcon, SunIcon } from "./Icons";

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
        ${
          theme === "dark"
            ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
            : "bg-gray-100 text-slate-600 hover:bg-gray-200"
        } ${className}`}
      aria-label="Cambiar tema"
      title={
        theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
    >
      {theme === "dark" ? (
        // Icono de Sol (para cambiar a light)
        <SunIcon className="w-5 h-5" />
      ) : (
        // Icono de Luna (para cambiar a dark)
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
