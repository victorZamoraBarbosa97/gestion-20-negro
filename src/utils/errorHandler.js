/**
 * Sistema de manejo de errores
 * Proporciona funciones para procesar y formatear errores de forma consistente
 */

import { logger } from './logger';

/**
 * Clase base para errores personalizados de la aplicación
 */
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Mantener el stack trace correcto
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Mapeo de códigos de error de Firebase a mensajes amigables en español
 */
const FIREBASE_ERROR_MESSAGES = {
  // Auth errors
  'auth/user-not-found': 'Usuario no encontrado. Verifica tus credenciales.',
  'auth/wrong-password': 'Contraseña incorrecta. Inténtalo de nuevo.',
  'auth/email-already-in-use': 'Este email ya está registrado. Intenta iniciar sesión.',
  'auth/weak-password': 'La contraseña es muy débil. Debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El formato del email es inválido.',
  'auth/operation-not-allowed': 'Esta operación no está permitida.',
  'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este email usando otro método.',
  'auth/invalid-credential': 'Las credenciales proporcionadas son inválidas.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
  'auth/network-request-failed': 'Error de red. Verifica tu conexión a internet.',
  
  // Firestore errors
  'permission-denied': 'No tienes permisos para realizar esta operación.',
  'not-found': 'El documento solicitado no fue encontrado.',
  'already-exists': 'Este documento ya existe.',
  'failed-precondition': 'No se cumplieron las condiciones para esta operación.',
  'aborted': 'La operación fue cancelada.',
  'out-of-range': 'El valor está fuera del rango permitido.',
  'unimplemented': 'Esta operación no está implementada.',
  'internal': 'Error interno del servidor. Intenta más tarde.',
  'unavailable': 'El servicio no está disponible temporalmente.',
  'data-loss': 'Se perdieron datos durante la operación.',
  'unauthenticated': 'Debes iniciar sesión para realizar esta acción.',
  
  // Storage errors
  'storage/unauthorized': 'No tienes permisos para acceder a este archivo.',
  'storage/canceled': 'La operación fue cancelada.',
  'storage/unknown': 'Error desconocido en Storage.',
  'storage/object-not-found': 'El archivo no fue encontrado.',
  'storage/bucket-not-found': 'El bucket de almacenamiento no existe.',
  'storage/project-not-found': 'El proyecto no fue encontrado.',
  'storage/quota-exceeded': 'Se excedió la cuota de almacenamiento.',
  'storage/unauthenticated': 'Debes iniciar sesión para acceder al archivo.',
  'storage/retry-limit-exceeded': 'Se excedió el límite de reintentos.',
  'storage/invalid-checksum': 'El archivo está corrupto.',
  'storage/canceled': 'La subida fue cancelada.',
};

/**
 * Mapeo de códigos de error HTTP a mensajes amigables
 */
const HTTP_ERROR_MESSAGES = {
  400: 'Solicitud inválida. Verifica los datos enviados.',
  401: 'No estás autenticado. Por favor, inicia sesión.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  408: 'La solicitud tardó demasiado tiempo. Intenta de nuevo.',
  409: 'Conflicto con el estado actual del recurso.',
  429: 'Demasiadas solicitudes. Intenta más tarde.',
  500: 'Error interno del servidor. Intenta más tarde.',
  502: 'Error de conexión con el servidor.',
  503: 'El servicio no está disponible temporalmente.',
  504: 'Tiempo de espera agotado. Verifica tu conexión.',
};

/**
 * Procesa errores de Firebase y retorna un mensaje amigable
 * @param {Error} error - Error de Firebase
 * @returns {string} Mensaje de error amigable
 */
export function handleFirebaseError(error) {
  const errorCode = error.code || error.message;
  const friendlyMessage = FIREBASE_ERROR_MESSAGES[errorCode];
  
  if (friendlyMessage) {
    logger.warn('Firebase error', { code: errorCode, originalMessage: error.message });
    return friendlyMessage;
  }
  
  logger.error('Unknown Firebase error', error, { code: errorCode });
  return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
}

/**
 * Procesa errores HTTP y retorna un mensaje amigable
 * @param {Error|Response} error - Error HTTP o Response object
 * @returns {string} Mensaje de error amigable
 */
export function handleHTTPError(error) {
  const statusCode = error.status || error.statusCode || 500;
  const friendlyMessage = HTTP_ERROR_MESSAGES[statusCode];
  
  if (friendlyMessage) {
    logger.warn('HTTP error', { statusCode, originalMessage: error.message });
    return friendlyMessage;
  }
  
  logger.error('Unknown HTTP error', error, { statusCode });
  return 'Error de conexión. Por favor, verifica tu internet e intenta de nuevo.';
}

/**
 * Procesa cualquier tipo de error y retorna un mensaje amigable
 * @param {Error} error - Cualquier tipo de error
 * @param {string} context - Contexto donde ocurrió el error
 * @returns {string} Mensaje de error amigable
 */
export function handleError(error, context = 'general') {
  // Si es un error de Firebase
  if (error.code && (
    error.code.startsWith('auth/') || 
    error.code.startsWith('storage/') ||
    FIREBASE_ERROR_MESSAGES[error.code]
  )) {
    return handleFirebaseError(error);
  }
  
  // Si es un error HTTP
  if (error.status || error.statusCode) {
    return handleHTTPError(error);
  }
  
  // Si es un AppError personalizado
  if (error instanceof AppError) {
    logger.error(`AppError in ${context}`, error, { code: error.code });
    return error.message;
  }
  
  // Error genérico
  logger.error(`Unexpected error in ${context}`, error);
  
  // En desarrollo, mostrar el mensaje real para debugging
  if (import.meta.env.MODE === 'development') {
    return error.message || 'Error desconocido';
  }
  
  // En producción, mensaje genérico
  return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
}

/**
 * Wrapper para funciones async que maneja errores automáticamente
 * @param {Function} fn - Función async a ejecutar
 * @param {string} context - Contexto de la operación
 * @returns {Function} Función wrapped con manejo de errores
 */
export function withErrorHandling(fn, context) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const friendlyMessage = handleError(error, context);
      throw new AppError(friendlyMessage, error.code, error.statusCode);
    }
  };
}

/**
 * Verifica si un error es operacional (esperado) o un bug
 * @param {Error} error - Error a verificar
 * @returns {boolean}
 */
export function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  
  // Errores de Firebase y HTTP son considerados operacionales
  if (error.code || error.status || error.statusCode) {
    return true;
  }
  
  return false;
}

/**
 * Formatea errores para mostrar en UI
 * @param {Error} error - Error a formatear
 * @returns {Object} Objeto con título, mensaje y sugerencias
 */
export function formatErrorForUI(error) {
  const friendlyMessage = handleError(error);
  
  let title = 'Error';
  let suggestions = [];
  
  // Personalizar según el tipo de error
  if (error.code?.startsWith('auth/')) {
    title = 'Error de Autenticación';
    suggestions = [
      'Verifica que tus credenciales sean correctas',
      'Si olvidaste tu contraseña, usa "Recuperar contraseña"',
    ];
  } else if (error.code?.startsWith('storage/')) {
    title = 'Error de Almacenamiento';
    suggestions = [
      'Verifica que el archivo sea válido',
      'Intenta subir un archivo más pequeño',
    ];
  } else if (error.status === 401 || error.statusCode === 401) {
    title = 'Sesión Expirada';
    suggestions = [
      'Tu sesión ha expirado',
      'Por favor, inicia sesión nuevamente',
    ];
  } else if (error.message?.includes('red') || error.message?.includes('network')) {
    title = 'Error de Conexión';
    suggestions = [
      'Verifica tu conexión a internet',
      'Intenta recargar la página',
    ];
  }
  
  return {
    title,
    message: friendlyMessage,
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

export default {
  AppError,
  handleError,
  handleFirebaseError,
  handleHTTPError,
  withErrorHandling,
  isOperationalError,
  formatErrorForUI,
};
