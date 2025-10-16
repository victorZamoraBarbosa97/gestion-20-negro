/**
 * Hook personalizado para manejar errores de forma declarativa
 * Proporciona funciones helpers para manejar errores comunes
 */

import { useState, useCallback } from 'react';
import { handleError, handleFirebaseError, handleHTTPError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

/**
 * Hook principal para manejo de errores
 * @param {string} context - Contexto donde se usa el hook (para logging)
 */
export function useErrorHandler(context = 'component') {
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);

  /**
   * Captura y procesa un error
   */
  const catchError = useCallback((error, customMessage = null) => {
    const errorMessage = customMessage || handleError(error, context);
    setError(errorMessage);
    setIsError(true);
    logger.error(`Error in ${context}`, error);
  }, [context]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  /**
   * Wrapper para funciones async con manejo automático de errores
   */
  const executeAsync = useCallback(async (asyncFn, errorMessage = null) => {
    try {
      clearError();
      return await asyncFn();
    } catch (error) {
      catchError(error, errorMessage);
      throw error;
    }
  }, [catchError, clearError]);

  return {
    error,
    isError,
    catchError,
    clearError,
    executeAsync,
  };
}

/**
 * Hook específico para errores de Firebase
 */
export function useFirebaseError() {
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);

  const catchFirebaseError = useCallback((error) => {
    const errorMessage = handleFirebaseError(error);
    setError(errorMessage);
    setIsError(true);
    logger.error('Firebase error', error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  return {
    error,
    isError,
    catchFirebaseError,
    clearError,
  };
}

/**
 * Hook específico para errores HTTP/API
 */
export function useAPIError() {
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);

  const catchAPIError = useCallback((error) => {
    const errorMessage = handleHTTPError(error);
    setError(errorMessage);
    setIsError(true);
    logger.error('API error', error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  return {
    error,
    isError,
    catchAPIError,
    clearError,
  };
}

/**
 * Hook para manejo de errores con toast notifications
 * Requiere que tengas un sistema de notificaciones (puedes usar react-hot-toast, sonner, etc.)
 */
export function useErrorToast(context = 'component') {
  const { error, isError, catchError, clearError } = useErrorHandler(context);

  /**
   * Muestra un error como notificación toast
   * Si tienes react-hot-toast instalado, descomenta la línea
   */
  const showErrorToast = useCallback((error, duration = 4000) => {
    const errorMessage = handleError(error, context);
    
    // Si tienes react-hot-toast:
    // toast.error(errorMessage, { duration });
    
    // Fallback: usar console.error
    console.error('Toast Error:', errorMessage);
    
    catchError(error);
  }, [catchError, context]);

  return {
    error,
    isError,
    clearError,
    showErrorToast,
  };
}

/**
 * Hook para manejar estados de loading y error juntos
 */
export function useAsyncOperation(context = 'operation') {
  const [loading, setLoading] = useState(false);
  const { error, isError, catchError, clearError, executeAsync } = useErrorHandler(context);

  const execute = useCallback(async (asyncFn, errorMessage = null) => {
    try {
      setLoading(true);
      clearError();
      const result = await asyncFn();
      return result;
    } catch (error) {
      catchError(error, errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [catchError, clearError]);

  return {
    loading,
    error,
    isError,
    execute,
    clearError,
  };
}

export default useErrorHandler;
