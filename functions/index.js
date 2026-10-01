import functions from "@google-cloud/functions-framework";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { GoogleAuth } from "google-auth-library";
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
import { verifyAuthHeader, resolveUserTier } from "./auth.js";

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
  PROJECT_ID: "gestion-20",
  LOCATION: "us-central1",
  KEY_FILENAME: "service-account-key.json",
  STORAGE_BUCKET: "gestion-20.firebasestorage.app",
  MODEL: "gemini-2.5-flash",
};

const SUBMISSION_TYPES = {
  STATEMENT: "STATEMENT",
  PAYMENT: "PAYMENT",
};

const PROMPTS = {
  [SUBMISSION_TYPES.STATEMENT]:
    "Eres un asistente experto en análisis financiero. Analiza la imagen de este estado de cuenta y extrae: (1) el MONTO TOTAL A PAGAR, como texto numérico con punto decimal y sin comas de miles (ej. '1234.56'); (2) la FECHA del estado de cuenta (la fecha de corte o emisión que aparezca impresa), en formato YYYY-MM-DD. Si no puedes determinar alguno de los dos con certeza, usa null en ese campo.",
  [SUBMISSION_TYPES.PAYMENT]:
    "Eres un asistente experto en análisis financiero. Analiza la imagen de este recibo o comprobante de pago y extrae: (1) el MONTO TOTAL PAGADO, como texto numérico con punto decimal y sin comas de miles (ej. '500.00'); (2) la FECHA en que se realizó el pago (la que aparezca impresa en el comprobante), en formato YYYY-MM-DD. Si no puedes determinar alguno de los dos con certeza, usa null en ese campo.",
};

const EXTRACTION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    total: {
      type: "string",
      nullable: true,
      description: "Monto total como texto numérico (ej. '1234.56'), o null si no se puede determinar.",
    },
    date: {
      type: "string",
      nullable: true,
      description: "Fecha en formato YYYY-MM-DD, o null si no se puede determinar.",
    },
  },
  required: ["total", "date"],
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

// ============================================================================
// INICIALIZACIÓN DE CLIENTES
// ============================================================================

const firestore = new Firestore(getClientConfig());
const storage = new Storage(getClientConfig());

// ✨ Llamamos a Vertex AI por REST directo (fetch) en vez del SDK
// @google-cloud/vertexai: esa versión del SDK manda "generation_config"
// (snake_case) en el body, pero la API espera "generationConfig"
// (camelCase) — lo ignora en silencio y por eso responseSchema nunca
// aplicaba. google-auth-library solo nos da el access token.
const googleAuth = new GoogleAuth({
  ...(isProduction ? {} : { keyFilename: CONFIG.KEY_FILENAME }),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

async function getVertexAccessToken() {
  const client = await googleAuth.getClient();
  const { token } = await client.getAccessToken();
  return token;
}

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
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: EXTRACTION_RESPONSE_SCHEMA,
    },
  };

  logger.info("Enviando solicitud a Gemini AI");

  let responseJson;
  try {
    const accessToken = await getVertexAccessToken();
    const endpoint =
      `https://${CONFIG.LOCATION}-aiplatform.googleapis.com/v1/projects/${CONFIG.PROJECT_ID}` +
      `/locations/${CONFIG.LOCATION}/publishers/google/models/${CONFIG.MODEL}:generateContent`;

    const httpResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    responseJson = await httpResponse.json();

    if (!httpResponse.ok) {
      logger.error('Error en Gemini AI', { status: httpResponse.status, responseJson });
      throw new Error('Error al analizar la imagen con IA. Por favor, intenta de nuevo.');
    }
  } catch (error) {
    if (error.message === 'Error al analizar la imagen con IA. Por favor, intenta de nuevo.') {
      throw error;
    }
    logger.error('Error en Gemini AI', error);
    throw new Error('Error al analizar la imagen con IA. Por favor, intenta de nuevo.');
  }

  // ✅ VALIDACIÓN: Verificar que la respuesta tenga la estructura esperada
  if (!responseJson?.candidates?.[0]?.content?.parts?.[0]?.text) {
    logger.error('Respuesta de Gemini con estructura inesperada', { responseJson });
    throw new Error('Respuesta inválida de la IA');
  }

  const textResponse = responseJson.candidates[0].content.parts[0].text;

  logger.info("Respuesta recibida de Gemini", { response: textResponse });

  // Por si el modelo envuelve el JSON en un bloque de código markdown
  // (```json ... ```) a pesar de pedir responseMimeType: application/json.
  const cleanedResponse = textResponse
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleanedResponse);
  } catch (error) {
    logger.error('Gemini devolvió un JSON inválido', { response: textResponse });
    throw new ValidationError(
      'La IA no devolvió una respuesta válida',
      'aiResponse',
      'INVALID_AI_RESPONSE'
    );
  }

  // ✅ VALIDACIÓN: el monto es obligatorio
  const parsedNumber = parseFloat(parsed.total);

  if (isNaN(parsedNumber)) {
    logger.warn('Gemini devolvió un monto no numérico', { response: parsed.total });
    throw new ValidationError(
      'La IA no pudo extraer un monto válido de la imagen',
      'aiResponse',
      'INVALID_AI_RESPONSE'
    );
  }

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

  // ✅ VALIDACIÓN: la fecha es opcional — si no es válida o es absurda,
  // simplemente la descartamos (null) en vez de fallar toda la solicitud;
  // el usuario puede capturarla/corregirla a mano en el paso de confirmación.
  let extractedDate = null;
  if (typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
    const candidate = new Date(`${parsed.date}T12:00:00Z`);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (!isNaN(candidate.getTime()) && candidate >= twoYearsAgo && candidate <= tomorrow) {
      extractedDate = parsed.date;
    } else {
      logger.warn('Gemini devolvió una fecha fuera de rango razonable', { response: parsed.date });
    }
  }

  return { total: String(parsedNumber), date: extractedDate };
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

    // ✅ VALIDACIÓN 3: Identidad (token de Firebase, acepta invitados anónimos)
    // Bloquea llamadas directas a la URL que no pasen por la app (curl/scripts),
    // sin exigir estar en la whitelist: la demo pública sigue siendo pública.
    const decodedToken = await verifyAuthHeader(req.headers.authorization);
    const tier = await resolveUserTier(decodedToken, firestore);

    logger.info('Identidad verificada', {
      requestId,
      uid: decodedToken.uid,
      tier,
    });

    // ✅ VALIDACIÓN 4: Rate limiting por usuario, con límites según su tier
    checkRateLimit(`${decodedToken.uid}-getTotalAmount`, tier);

    // ✅ VALIDACIÓN 5: Body y parámetros
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
    const { total, date } = await analyzeImageWithGemini(gcsUri, submissionType);

    const duration = Date.now() - startTime;
    logger.info('Solicitud completada exitosamente', {
      requestId,
      duration: `${duration}ms`,
      total,
      date,
    });

    // Retornar resultado
    res.status(200).json({
      total,
      date,
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
