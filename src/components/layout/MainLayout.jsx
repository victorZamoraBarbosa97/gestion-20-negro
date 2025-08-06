// src/components/layout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Header from '../navigation/Header';

const MainLayout = () => {
  return (
    // Fondo de la aplicación consistente, aplicado aquí
    <div className="min-h-screen bg-slate-100 font-sans">
      <Header />
      {/* El contenido de la página se renderizará aquí */}
      <Outlet />
    </div>
  );
};

export default MainLayout;
