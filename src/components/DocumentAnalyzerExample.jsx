/**
 * EJEMPLO COMPLETO: Componente que usa el sistema de manejo de errores
 * Este archivo es solo para referencia
 */

import { useState } from "react";
import { useAsyncOperation } from "../hooks/useErrorHandler";
import ErrorAlert from "../components/ErrorAlert";
import { getTotalAmount } from "../services/cloudFunctions";
import { logger } from "../utils/logger";

export default function DocumentAnalyzerExample() {
  const [documentPath, setDocumentPath] = useState("");
  const [documentType, setDocumentType] = useState("STATEMENT");
  const [result, setResult] = useState(null);

  // Hook que maneja loading, error y ejecución automáticamente
  const { loading, error, isError, execute, clearError } =
    useAsyncOperation("DocumentAnalyzer");

  const handleAnalyze = async (e) => {
    e.preventDefault();

    // Validación simple
    if (!documentPath.trim()) {
      clearError();
      // Puedes usar el hook useErrorHandler para mostrar un error personalizado
      return;
    }

    // execute() maneja automáticamente loading y errores
    const data = await execute(
      async () => {
        // Log del evento
        logger.event("document_analysis_started", {
          documentType,
          documentPath,
        });

        // Llamar al servicio (que ya tiene su propio manejo de errores)
        const response = await getTotalAmount(documentPath, documentType);

        // Log de éxito
        logger.event("document_analysis_completed", {
          documentType,
          total: response.total,
        });

        return response;
      },
      // Mensaje de error personalizado (opcional)
      "No se pudo analizar el documento. Verifica la ruta e intenta de nuevo."
    );

    // Si llegamos aquí, fue exitoso
    if (data) {
      setResult(data);
    }
  };

  const handleReset = () => {
    setDocumentPath("");
    setResult(null);
    clearError();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Analizador de Documentos</h1>

      {/* Mostrar errores si los hay */}
      {isError && (
        <ErrorAlert
          error={error}
          title="Error al analizar documento"
          onDismiss={clearError}
          className="mb-4"
        />
      )}

      {/* Formulario */}
      <form onSubmit={handleAnalyze} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ruta del documento en Firestore
          </label>
          <input
            type="text"
            value={documentPath}
            onChange={(e) => setDocumentPath(e.target.value)}
            placeholder="submissions/abc123"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de documento
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="STATEMENT">Estado de Cuenta</option>
            <option value="PAYMENT">Comprobante de Pago</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Analizando...
              </span>
            ) : (
              "Analizar Documento"
            )}
          </button>

          {(result || isError) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      {/* Resultado */}
      {result && !isError && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            ✓ Análisis completado
          </h3>
          <div className="space-y-1">
            <p className="text-green-700">
              <span className="font-medium">Monto total:</span> ${result.total}
            </p>
            <p className="text-sm text-green-600">
              Tipo:{" "}
              {documentType === "STATEMENT"
                ? "Estado de Cuenta"
                : "Comprobante de Pago"}
            </p>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          ℹ️ Sobre este ejemplo
        </h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>
            Usa{" "}
            <code className="bg-blue-100 px-1 rounded">useAsyncOperation</code>{" "}
            para manejo automático de loading y errores
          </li>
          <li>
            Muestra errores con{" "}
            <code className="bg-blue-100 px-1 rounded">ErrorAlert</code>{" "}
            component
          </li>
          <li>Logging automático de eventos y performance</li>
          <li>Mensajes de error amigables en español</li>
          <li>Manejo de estados de carga y resultado</li>
        </ul>
      </div>
    </div>
  );
}
