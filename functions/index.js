import functions from "@google-cloud/functions-framework";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { VertexAI } from "@google-cloud/vertexai";
import { existsSync } from "fs";

// ✨ NUEVO: Importar sistema de validación
import {
  validateGetTotalAmountRequest,
  validateMethod,
  validateHeaders,
  checkRateLimit,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ResourceNotFoundError,
  RateLimitError,
  validateFileType,
  VALIDATION_RULES,
} from "./validation.js";

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
  PROJECT_ID: "gestion-20",
  LOCATION: "us-central1",
  KEY_FILENAME: "service-account-key.json",
  STORAGE_BUCKET: "gestion-20.firebasestorage.app",
  MODEL: "gemini-2.0-flash",
};

const SUBMISSION_TYPES = {
  STATEMENT: "STATEMENT",
  PAYMENT: "PAYMENT",
};

const PROMPTS = {
  [SUBMISSION_TYPES.STATEMENT]:
    "Eres un asistente experto en análisis financiero. Tu única tarea es analizar la imagen de este estado de cuenta. Extrae el MONTO TOTAL A PAGAR. Devuelve exclusivamente el valor numérico, usando un punto como separador decimal y sin comas para los miles. No incluyas símbolos de moneda ni texto adicional. Ejemplo de respuesta correcta: 1234.56",
  [SUBMISSION_TYPES.PAYMENT]:
    "Eres un asistente experto en análisis financiero. Tu única tarea es analizar la imagen de este recibo o comprobante de pago. Extrae el MONTO TOTAL PAGADO. Devuelve exclusivamente el valor numérico, usando un punto como separador decimal y sin comas para los miles. No incluyas símbolos de moneda ni texto adicional. Ejemplo de respuesta correcta: 500.00",
};

const MIME_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
  default: "application/octet-stream",
};

// ============================================================================
// DETECCIÓN DE ENTORNO Y CONFIGURACIÓN DE CREDENCIALES
// ============================================================================

const isProduction = !existsSync(CONFIG.KEY_FILENAME);

const getClientConfig = () => {
  if (isProduction) {
    console.log('[INFO] Usando credenciales por defecto de Google Cloud (producción)');
    return { projectId: CONFIG.PROJECT_ID };
  } else {
    console.log('[INFO] Usando service account key (desarrollo local)');
    return {
      projectId: CONFIG.PROJECT_ID,
      keyFilename: CONFIG.KEY_FILENAME,
    };
  }
};

const getVertexConfig = () => {
  if (isProduction) {
    return {
      project: CONFIG.PROJECT_ID,
      location: CONFIG.LOCATION,
    };
  } else {
    return {
      project: CONFIG.PROJECT_ID,
      location: CONFIG.LOCATION,
      keyFilename: CONFIG.KEY_FILENAME,
    };
  }
};

// ============================================================================
// INICIALIZACIÓN DE CLIENTES
// ============================================================================

const firestore = new Firestore(getClientConfig());
const storage = new Storage(getClientConfig());
const vertexAI = new VertexAI(getVertexConfig());

// ============================================================================
// UTILIDADES
// ============================================================================

const logger = {
  info: (message, data = {}) => console.log(`[INFO] ${message}`, JSON.stringify(data)),
  error: (message, error) => console.error(`[ERROR] ${message}`, error),
  warn: (message, data = {}) => console.warn(`[WARN] ${message}`, JSON.stringify(data)),
};

function getMimeType(filePath) {
  const extension = filePath.split(".").pop().toLowerCase();
  return MIME_TYPES[extension] || MIME_TYPES.default;
}

function parseGcsUri(gcsUri) {
  const [bucketName, filePath] = gcsUri.replace("gs://", "").split(/\/(.+)/);
  return { bucketName, filePath };
}

function buildGcsUri(storagePath) {
  return `gs://${CONFIG.STORAGE_BUCKET}/${storagePath}`;
}

// ============================================================================
// LÓGICA DE NEGOCIO
// ============================================================================

async function fileToGenerativePart(gcsUri) {
  const { bucketName, filePath } = parseGcsUri(gcsUri);
  
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  // ✅ VALIDACIÓN: Verificar que el archivo existe
  const [exists] = await file.exists();
  if (!exists) {
    throw new ResourceNotFoundError('Archivo', filePath);
  }

  // ✅ VALIDACIÓN: Obtener metadata y verificar tamaño
  const [metadata] = await file.getMetadata();
  const sizeInBytes = parseInt(metadata.size);
  const maxSizeBytes = VALIDATION_RULES.FILE.MAX_SIZE_MB * 1024 * 1024;

  if (sizeInBytes > maxSizeBytes) {
    throw new ValidationError(
      `El archivo excede el tamaño máximo de ${VALIDATION_RULES.FILE.MAX_SIZE_MB}MB`,
      'file',
      'FILE_TOO_LARGE'
    );
  }

  logger.info('Descargando archivo', {
    bucket: bucketName,
    file: filePath,
    size: `${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`
  });

  // Descargar archivo
  const [buffer] = await file.download();

  // ✅ VALIDACIÓN: Verificar tipo de archivo
  validateFileType(filePath);

  const mimeType = getMimeType(filePath);

  return {
    inlineData: {
      mimeType,
      data: buffer.toString("base64"),
    },
  };
}

async function getStoragePathFromFirestore(firestorePath) {
  logger.info("Obteniendo documento de Firestore", { firestorePath });
  
  const docRef = firestore.doc(firestorePath);
  
  let docSnap;
  try {
    docSnap = await docRef.get();
  } catch (error) {
    logger.error('Error accediendo a Firestore', error);
    throw new Error('Error al acceder a la base de datos');
  }

  if (!docSnap.exists) {
    throw new ResourceNotFoundError('Documento', firestorePath);
  }

  const data = docSnap.data();
  const { storagePath } = data;
  
  if (!storagePath) {
    throw new ValidationError(
      'El documento no contiene el campo "storagePath"',
      'storagePath',
      'MISSING_FIELD'
    );
  }

  // ✅ VALIDACIÓN: Verificar que storagePath sea string válido
  if (typeof storagePath !== 'string' || storagePath.trim() === '') {
    throw new ValidationError(
      'El campo "storagePath" debe ser un string no vacío',
      'storagePath',
      'INVALID_STORAGE_PATH'
    );
  }

  return storagePath;
}

async function analyzeImageWithGemini(gcsUri, submissionType) {
  const prompt = PROMPTS[submissionType] || PROMPTS[SUBMISSION_TYPES.PAYMENT];
  
  logger.info("Preparando análisis con Gemini", { 
    submissionType,
    model: CONFIG.MODEL 
  });

  const generativeModel = vertexAI.getGenerativeModel({
    model: CONFIG.MODEL,
  });

  let imagePart;
  try {
    imagePart = await fileToGenerativePart(gcsUri);
  } catch (error) {
    logger.error('Error procesando archivo para Gemini', error);
    throw error;
  }

  const requestPayload = {
    contents: [
      {
        role: "user",
        parts: [imagePart, { text: prompt }],
      },
    ],
  };

  logger.info("Enviando solicitud a Gemini AI");
  
  let result;
  try {
    result = await generativeModel.generateContent(requestPayload);
  } catch (error) {
    logger.error('Error en Gemini AI', error);
    throw new Error('Error al analizar la imagen con IA. Por favor, intenta de nuevo.');
  }

  // ✅ VALIDACIÓN: Verificar que la respuesta tenga la estructura esperada
  if (!result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    logger.error('Respuesta de Gemini con estructura inesperada', { result });
    throw new Error('Respuesta inválida de la IA');
  }

  const textResponse = result.response.candidates[0].content.parts[0].text;

  logger.info("Respuesta recibida de Gemini", { response: textResponse });
  
  // ✅ VALIDACIÓN: Verificar que la respuesta sea un número válido
  const trimmedResponse = textResponse.trim();
  const parsedNumber = parseFloat(trimmedResponse);

  if (isNaN(parsedNumber)) {
    logger.warn('Gemini devolvió un valor no numérico', { response: trimmedResponse });
    throw new ValidationError(
      'La IA no pudo extraer un monto válido de la imagen',
      'aiResponse',
      'INVALID_AI_RESPONSE'
    );
  }

  // ✅ VALIDACIÓN: Verificar que el número esté en un rango razonable
  if (parsedNumber < 0) {
    throw new ValidationError(
      'El monto extraído no puede ser negativo',
      'amount',
      'INVALID_AMOUNT'
    );
  }

  if (parsedNumber > 1000000000) { // 1 billón
    throw new ValidationError(
      'El monto extraído excede el límite razonable',
      'amount',
      'AMOUNT_TOO_LARGE'
    );
  }
  
  return trimmedResponse;
}

function setCorsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");
}

// ✅ NUEVO: Función centralizada para manejo de errores
function handleError(error, res) {
  logger.error('Error en la función', error);

  // Determinar status code y mensaje según el tipo de error
  let statusCode = 500;
  let errorResponse = {
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
  };

  if (error instanceof ValidationError) {
    statusCode = error.statusCode;
    errorResponse = {
      error: error.message,
      code: error.code,
      field: error.field,
    };
  } else if (error instanceof AuthenticationError) {
    statusCode = error.statusCode;
    errorResponse = {
      error: error.message,
      code: error.code,
    };
  } else if (error instanceof AuthorizationError) {
    statusCode = error.statusCode;
    errorResponse = {
      error: error.message,
      code: error.code,
    };
  } else if (error instanceof ResourceNotFoundError) {
    statusCode = error.statusCode;
    errorResponse = {
      error: error.message,
      code: error.code,
    };
  } else if (error instanceof RateLimitError) {
    statusCode = error.statusCode;
    errorResponse = {
      error: error.message,
      code: error.code,
      retryAfter: 60, // segundos
    };
    res.set('Retry-After', '60');
  } else if (error.message) {
    // Error genérico pero con mensaje
    errorResponse.error = error.message;
  }

  // Agregar más contexto en modo desarrollo
  if (!isProduction && error.stack) {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
}

// ============================================================================
// HANDLER DE LA FUNCIÓN HTTP CON VALIDACIÓN ROBUSTA
// ============================================================================

functions.http("getTotalAmount", async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  logger.info('Nueva solicitud recibida', {
    requestId,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Configurar CORS
  setCorsHeaders(res);

  // Manejar preflight request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    // ✅ VALIDACIÓN 1: Método HTTP
    validateMethod(req.method, ['POST']);

    // ✅ VALIDACIÓN 2: Headers
    if (req.method !== 'OPTIONS') {
      validateHeaders(req.headers);
    }

    // ✅ VALIDACIÓN 3: Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    checkRateLimit(clientIp, 'getTotalAmount');

    // ✅ VALIDACIÓN 4: Body y parámetros
    const { firestorePath, submissionType } = validateGetTotalAmountRequest(req.body);

    logger.info('Solicitud validada exitosamente', {
      requestId,
      firestorePath,
      submissionType,
    });

    // Obtener ruta del archivo
    const storagePath = await getStoragePathFromFirestore(firestorePath);
    const gcsUri = buildGcsUri(storagePath);

    logger.info('Storage path obtenido', {
      requestId,
      storagePath,
      gcsUri,
    });

    // Analizar imagen con Gemini
    const total = await analyzeImageWithGemini(gcsUri, submissionType);

    const duration = Date.now() - startTime;
    logger.info('Solicitud completada exitosamente', {
      requestId,
      duration: `${duration}ms`,
      total,
    });

    // Retornar resultado
    res.status(200).json({
      total,
      requestId,
      processingTime: duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Solicitud fallida', {
      requestId,
      duration: `${duration}ms`,
      error: error.message,
      errorType: error.constructor.name,
    });

    handleError(error, res);
  }
});
