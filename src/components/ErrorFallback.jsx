/**
 * Componente de fallback que se muestra cuando ocurre un error
 * Proporciona una UI amigable con opciones para recuperarse
 */

import { formatErrorForUI } from '../utils/errorHandler';

export default function ErrorFallback({ error, resetError }) {
  const errorInfo = formatErrorForUI(error);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReset = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Icono de error */}
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-red-100 p-3">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {errorInfo.title}
        </h2>

        {/* Mensaje principal */}
        <p className="text-gray-600 text-center mb-6">
          {errorInfo.message}
        </p>

        {/* Sugerencias */}
        {errorInfo.suggestions.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 font-medium mb-1">
                  Sugerencias:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  {errorInfo.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="space-y-3">
          <button
            onClick={handleReset}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Intentar de nuevo
          </button>

          <button
            onClick={handleGoHome}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Ir al inicio
          </button>

          <button
            onClick={handleReload}
            className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            Recargar página
          </button>
        </div>

        {/* Detalles técnicos (solo en desarrollo) */}
        {import.meta.env.MODE === 'development' && (
          <details className="mt-6 text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              Detalles técnicos (solo visible en desarrollo)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-gray-700 overflow-auto">
              <p className="font-semibold mb-1">Error:</p>
              <p className="mb-2">{error.message}</p>
              {error.stack && (
                <>
                  <p className="font-semibold mb-1">Stack Trace:</p>
                  <pre className="text-xs whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </>
              )}
            </div>
          </details>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Si el problema persiste, contacta a soporte
          </p>
        </div>
      </div>
    </div>
  );
}
