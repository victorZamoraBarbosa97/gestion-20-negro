// functions/validation.js
// ✨ Sistema completo de validación para Cloud Functions

/**
 * Tipos de error personalizados para validación
 */
export class ValidationError extends Error {
  constructor(message, field = null, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
    this.statusCode = 400;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Autenticación requerida') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'UNAUTHENTICATED';
    this.statusCode = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'No tienes permisos para esta operación') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'PERMISSION_DENIED';
    this.statusCode = 403;
  }
}

export class ResourceNotFoundError extends Error {
  constructor(resource = 'Recurso', id = null) {
    const message = id 
      ? `${resource} con ID "${id}" no encontrado`
      : `${resource} no encontrado`;
    super(message);
    this.name = 'ResourceNotFoundError';
    this.code = 'NOT_FOUND';
    this.statusCode = 404;
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Demasiadas solicitudes. Intenta más tarde.') {
    super(message);
    this.name = 'RateLimitError';
    this.code = 'RATE_LIMIT_EXCEEDED';
    this.statusCode = 429;
  }
}

// ============================================================================
// CONSTANTES DE VALIDACIÓN
// ============================================================================

const VALIDATION_RULES = {
  FIRESTORE_PATH: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 500,
    PATTERN: /^[a-zA-Z0-9_\-\/]+$/,
    REQUIRED_PARTS: 2, // collection/document
  },
  SUBMISSION_TYPE: {
    ALLOWED_VALUES: ['STATEMENT', 'PAYMENT'],
  },
  FILE: {
    MAX_SIZE_MB: 10,
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  },
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_REQUESTS_PER_HOUR: 1000,
  },
};

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Valida que un valor no sea null, undefined o vacío
 */
export function validateRequired(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(
      `El campo "${fieldName}" es requerido`,
      fieldName,
      'REQUIRED_FIELD'
    );
  }
  return true;
}

/**
 * Valida que un valor sea de un tipo específico
 */
export function validateType(value, expectedType, fieldName) {
  const actualType = typeof value;
  
  if (actualType !== expectedType) {
    throw new ValidationError(
      `El campo "${fieldName}" debe ser de tipo ${expectedType}, recibido: ${actualType}`,
      fieldName,
      'INVALID_TYPE'
    );
  }
  return true;
}

/**
 * Valida que un string tenga longitud dentro de límites
 */
export function validateStringLength(value, fieldName, minLength = null, maxLength = null) {
  if (typeof value !== 'string') {
    throw new ValidationError(
      `El campo "${fieldName}" debe ser un string`,
      fieldName,
      'INVALID_TYPE'
    );
  }

  if (minLength !== null && value.length < minLength) {
    throw new ValidationError(
      `El campo "${fieldName}" debe tener al menos ${minLength} caracteres, tiene ${value.length}`,
      fieldName,
      'STRING_TOO_SHORT'
    );
  }

  if (maxLength !== null && value.length > maxLength) {
    throw new ValidationError(
      `El campo "${fieldName}" no puede exceder ${maxLength} caracteres, tiene ${value.length}`,
      fieldName,
      'STRING_TOO_LONG'
    );
  }

  return true;
}

/**
 * Valida que un string coincida con un patrón regex
 */
export function validatePattern(value, pattern, fieldName, exampleFormat = null) {
  if (typeof value !== 'string') {
    throw new ValidationError(
      `El campo "${fieldName}" debe ser un string`,
      fieldName,
      'INVALID_TYPE'
    );
  }

  if (!pattern.test(value)) {
    const message = exampleFormat
      ? `El campo "${fieldName}" tiene formato inválido. Formato esperado: ${exampleFormat}`
      : `El campo "${fieldName}" tiene formato inválido`;
    
    throw new ValidationError(message, fieldName, 'INVALID_FORMAT');
  }

  return true;
}

/**
 * Valida que un valor esté dentro de una lista de valores permitidos
 */
export function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `El campo "${fieldName}" debe ser uno de: [${allowedValues.join(', ')}], recibido: "${value}"`,
      fieldName,
      'INVALID_ENUM_VALUE'
    );
  }
  return true;
}

/**
 * Valida la ruta de Firestore
 */
export function validateFirestorePath(path) {
  const fieldName = 'firestorePath';

  // 1. Requerido
  validateRequired(path, fieldName);

  // 2. Tipo string
  validateType(path, 'string', fieldName);

  // 3. Longitud
  validateStringLength(
    path,
    fieldName,
    VALIDATION_RULES.FIRESTORE_PATH.MIN_LENGTH,
    VALIDATION_RULES.FIRESTORE_PATH.MAX_LENGTH
  );

  // 4. Patrón (solo caracteres alfanuméricos, guiones, underscores y slashes)
  validatePattern(
    path,
    VALIDATION_RULES.FIRESTORE_PATH.PATTERN,
    fieldName,
    'collection/document'
  );

  // 5. Estructura (debe tener al menos collection/document)
  const parts = path.split('/');
  if (parts.length < VALIDATION_RULES.FIRESTORE_PATH.REQUIRED_PARTS) {
    throw new ValidationError(
      `El campo "${fieldName}" debe tener formato "collection/document"`,
      fieldName,
      'INVALID_PATH_STRUCTURE'
    );
  }

  // 6. Partes no vacías
  if (parts.some(part => part.trim() === '')) {
    throw new ValidationError(
      `El campo "${fieldName}" no puede contener partes vacías`,
      fieldName,
      'EMPTY_PATH_SEGMENT'
    );
  }

  // 7. Sanitización (prevenir path traversal)
  if (path.includes('..') || path.includes('//')) {
    throw new ValidationError(
      `El campo "${fieldName}" contiene caracteres no permitidos`,
      fieldName,
      'MALICIOUS_PATH'
    );
  }

  return path;
}

/**
 * Valida el tipo de submisión
 */
export function validateSubmissionType(type) {
  const fieldName = 'submissionType';

  // 1. Requerido
  validateRequired(type, fieldName);

  // 2. Tipo string
  validateType(type, 'string', fieldName);

  // 3. Enum
  validateEnum(type, VALIDATION_RULES.SUBMISSION_TYPE.ALLOWED_VALUES, fieldName);

  return type;
}

/**
 * Valida la extensión y tipo MIME de un archivo
 */
export function validateFileType(filePath, fieldName = 'file') {
  // Extraer extensión
  const extension = filePath.split('.').pop().toLowerCase();

  // Validar extensión
  if (!VALIDATION_RULES.FILE.ALLOWED_EXTENSIONS.includes(extension)) {
    throw new ValidationError(
      `Tipo de archivo no permitido. Extensiones permitidas: ${VALIDATION_RULES.FILE.ALLOWED_EXTENSIONS.join(', ')}`,
      fieldName,
      'INVALID_FILE_TYPE'
    );
  }

  return true;
}

/**
 * Valida el tamaño de un archivo (en bytes)
 */
export function validateFileSize(sizeInBytes, fieldName = 'file') {
  const maxSizeBytes = VALIDATION_RULES.FILE.MAX_SIZE_MB * 1024 * 1024;

  if (sizeInBytes > maxSizeBytes) {
    throw new ValidationError(
      `El archivo excede el tamaño máximo de ${VALIDATION_RULES.FILE.MAX_SIZE_MB}MB`,
      fieldName,
      'FILE_TOO_LARGE'
    );
  }

  return true;
}

/**
 * Sanitiza un string para prevenir inyecciones
 */
export function sanitizeString(value) {
  if (typeof value !== 'string') {
    return value;
  }

  // Remover caracteres potencialmente peligrosos
  return value
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/['"]/g, '') // Remover comillas
    .replace(/\\/g, ''); // Remover backslashes
}

/**
 * Valida el body completo de la request para getTotalAmount
 */
export function validateGetTotalAmountRequest(body) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError(
      'El body de la request debe ser un objeto JSON válido',
      'body',
      'INVALID_BODY'
    );
  }

  // Extraer y validar parámetros
  let { firestorePath, submissionType } = body;

  // Manejo de parámetros anidados (backward compatibility)
  if (
    typeof firestorePath === 'object' &&
    firestorePath !== null &&
    firestorePath.firestorePath
  ) {
    submissionType = firestorePath.submissionType;
    firestorePath = firestorePath.firestorePath;
  }

  // Validar cada campo
  const validatedFirestorePath = validateFirestorePath(firestorePath);
  const validatedSubmissionType = validateSubmissionType(submissionType);

  return {
    firestorePath: validatedFirestorePath,
    submissionType: validatedSubmissionType,
  };
}

/**
 * Valida headers HTTP requeridos
 */
export function validateHeaders(headers) {
  const contentType = headers['content-type'] || headers['Content-Type'];

  if (!contentType || !contentType.includes('application/json')) {
    throw new ValidationError(
      'Content-Type debe ser application/json',
      'Content-Type',
      'INVALID_CONTENT_TYPE'
    );
  }

  return true;
}

/**
 * Valida que el método HTTP sea el correcto
 */
export function validateMethod(method, allowedMethods = ['POST']) {
  const upperMethod = method.toUpperCase();

  if (!allowedMethods.includes(upperMethod)) {
    throw new ValidationError(
      `Método HTTP no permitido. Métodos permitidos: ${allowedMethods.join(', ')}`,
      'method',
      'METHOD_NOT_ALLOWED'
    );
  }

  return true;
}

// ============================================================================
// RATE LIMITING (Simpleimplementación en memoria)
// ============================================================================

// Nota: En producción, usar Redis o similar
const requestCounts = new Map();

/**
 * Verifica el rate limit para una IP
 */
export function checkRateLimit(ip, identifier = 'default') {
  const key = `${ip}-${identifier}`;
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  // Obtener o inicializar contador
  if (!requestCounts.has(key)) {
    requestCounts.set(key, []);
  }

  const timestamps = requestCounts.get(key);

  // Limpiar timestamps viejos (más de 1 hora)
  const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);
  requestCounts.set(key, recentTimestamps);

  // Contar requests en el último minuto
  const requestsInLastMinute = recentTimestamps.filter(ts => ts > oneMinuteAgo).length;

  if (requestsInLastMinute >= VALIDATION_RULES.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
    throw new RateLimitError(
      `Límite de ${VALIDATION_RULES.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE} requests por minuto excedido`
    );
  }

  // Contar requests en la última hora
  if (recentTimestamps.length >= VALIDATION_RULES.RATE_LIMIT.MAX_REQUESTS_PER_HOUR) {
    throw new RateLimitError(
      `Límite de ${VALIDATION_RULES.RATE_LIMIT.MAX_REQUESTS_PER_HOUR} requests por hora excedido`
    );
  }

  // Agregar timestamp actual
  recentTimestamps.push(now);
  requestCounts.set(key, recentTimestamps);

  return true;
}

/**
 * Limpia contadores de rate limit (llamar periódicamente)
 */
export function cleanupRateLimitCounters() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const [key, timestamps] of requestCounts.entries()) {
    const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);
    
    if (recentTimestamps.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, recentTimestamps);
    }
  }
}

// Limpiar contadores cada 10 minutos
setInterval(cleanupRateLimitCounters, 10 * 60 * 1000);

// ============================================================================
// EXPORTAR REGLAS PARA REFERENCIA
// ============================================================================

export { VALIDATION_RULES };
