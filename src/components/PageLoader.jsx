// src/components/PageLoader.jsx
// Componente de loading para Suspense boundaries

const PageLoader = ({ message = "Cargando..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-100">
      <div className="relative">
        {/* Spinner animado */}
        <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>

        {/* Logo o ícono en el centro (opcional) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full opacity-20"></div>
        </div>
      </div>

      {/* Mensaje de carga */}
      <p className="mt-4 text-sm text-slate-600 font-medium animate-pulse">
        {message}
      </p>

      {/* Barra de progreso (opcional, puramente visual) */}
      <div className="w-48 h-1 bg-slate-200 rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full animate-progress"></div>
      </div>
    </div>
  );
};

export default PageLoader;
