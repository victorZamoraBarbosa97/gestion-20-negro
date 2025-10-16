// src/App.jsx
// ✨ VERSIÓN OPTIMIZADA CON CODE SPLITTING Y LAZY LOADING

import { useContext, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

// 🚀 EAGER LOADING - Componentes críticos que necesitamos inmediatamente
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AppLayout from "./components/layout/AppLayout";
import PageLoader from "./components/PageLoader";

// 🎯 LAZY LOADING - Componentes secundarios que pueden cargarse bajo demanda
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const DocumentAnalyzerExample = lazy(() =>
  import("./components/DocumentAnalyzerExample")
);

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  return currentUser ? children : <Navigate to="/login" />;
};

function App() {
  const { currentUser, loading } = useContext(AuthContext);

  // Loading inicial de autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-900">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "",
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            theme: {
              primary: "green",
              secondary: "black",
            },
          },
        }}
      />
      <Routes>
        {/* Ruta de Login - EAGER LOADING */}
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/" /> : <LoginPage />}
        />

        {/* Ruta de Dashboard - EAGER LOADING (página principal) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Ruta de Reports - LAZY LOADING (página secundaria) */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Suspense
                  fallback={<PageLoader message="Cargando reportes..." />}
                >
                  <ReportsPage />
                </Suspense>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Ruta raíz - Redirección */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" />
            </ProtectedRoute>
          }
        />

        {/* Ruta de ejemplo - LAZY LOADING */}
        <Route
          path="/ejemplo-errores"
          element={
            <Suspense fallback={<PageLoader message="Cargando ejemplo..." />}>
              <DocumentAnalyzerExample />
            </Suspense>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
