/**
 * Exportaciones centralizadas del sistema de manejo de errores
 * Importa todo desde aquí para mayor comodidad
 */

// Componentes
export { default as ErrorBoundary, useErrorHandler as useErrorBoundaryHandler, withErrorBoundary } from '../components/ErrorBoundary';
export { default as ErrorFallback } from '../components/ErrorFallback';
export { default as ErrorAlert, FormErrorAlert, ErrorList } from '../components/ErrorAlert';

// Hooks
export {
  default as useErrorHandler,
  useFirebaseError,
  useAPIError,
  useErrorToast,
  useAsyncOperation,
} from '../hooks/useErrorHandler';

// Utilidades
export {
  AppError,
  handleError,
  handleFirebaseError,
  handleHTTPError,
  withErrorHandling,
  isOperationalError,
  formatErrorForUI,
} from './errorHandler';

// Logger
export { logger, LOG_LEVELS } from './logger';
