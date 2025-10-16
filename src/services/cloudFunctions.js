/**
 * Servicio para interactuar con Google Cloud Functions
 * Ahora con manejo robusto de errores
 */

import { logger } from '../utils/logger';
import { AppError, handleHTTPError } from '../utils/errorHandler';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Analiza una imagen de estado de cuenta o pago usando Gemini AI
 * 
 * @param {string} firestorePath - Ruta del documento en Firestore
 * @param {'STATEMENT' | 'PAYMENT'} submissionType - Tipo de documento
 * @returns {Promise<{total: string}>}
 * @throws {AppError} Si la petición falla
 */
export async function getTotalAmount(firestorePath, submissionType) {
  const startTime = performance.now();
  
  try {
    logger.info('Iniciando análisis de documento', {
      firestorePath,
      submissionType,
    });

    const response = await fetch(`${API_BASE_URL}/getTotalAmount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firestorePath,
        submissionType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || handleHTTPError(response);
      
      logger.error('Error en respuesta de Cloud Function', new Error(errorMessage), {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });

      throw new AppError(
        errorMessage,
        'CLOUD_FUNCTION_ERROR',
        response.status
      );
    }

    const data = await response.json();
    
    const duration = performance.now() - startTime;
    logger.performance('cloud_function_call', duration, {
      submissionType,
      success: true,
    });

    logger.info('Análisis completado exitosamente', {
      total: data.total,
      duration: `${duration}ms`,
    });

    return data;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Error llamando a getTotalAmount', error, {
      firestorePath,
      submissionType,
      duration: `${duration}ms`,
    });

    // Si ya es un AppError, solo re-lanzarlo
    if (error instanceof AppError) {
      throw error;
    }

    // Si es un error de red
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new AppError(
        'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        'NETWORK_ERROR',
        0
      );
    }

    // Error genérico
    throw new AppError(
      'Error al procesar el documento. Por favor, intenta de nuevo.',
      'UNKNOWN_ERROR',
      500
    );
  }
}

/**
 * Hook de React para usar el servicio getTotalAmount con manejo de errores integrado
 * 
 * @example
 * const { analyze, loading, error, result } = useGetTotalAmount();
 * 
 * const handleAnalyze = async () => {
 *   try {
 *     await analyze('submissions/abc123', 'STATEMENT');
 *   } catch (error) {
 *     // Error ya está en el estado
 *   }
 * };
 */
export function useGetTotalAmount() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [result, setResult] = React.useState(null);

  const analyze = async (firestorePath, submissionType) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getTotalAmount(firestorePath, submissionType);
      setResult(data);
      
      logger.event('document_analyzed', {
        submissionType,
        success: true,
      });

      return data;
    } catch (err) {
      setError(err.message);
      
      logger.event('document_analysis_failed', {
        submissionType,
        errorCode: err.code,
      });

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setResult(null);
  };

  return { analyze, loading, error, result, reset };
}

// Export para uso directo sin hook
export const cloudFunctionsAPI = {
  getTotalAmount,
};

export default cloudFunctionsAPI;
