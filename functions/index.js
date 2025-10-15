import functions from "@google-cloud/functions-framework";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { VertexAI } from "@google-cloud/vertexai";

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
  default: "application/octet-stream",
};

// ============================================================================
// INICIALIZACIÓN DE CLIENTES
// ============================================================================

const firestore = new Firestore({ keyFilename: CONFIG.KEY_FILENAME });
const storage = new Storage({
  projectId: CONFIG.PROJECT_ID,
  keyFilename: CONFIG.KEY_FILENAME,
});
const vertexAI = new VertexAI({
  project: CONFIG.PROJECT_ID,
  location: CONFIG.LOCATION,
  keyFilename: CONFIG.KEY_FILENAME,
});

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Logger simple para mantener logs consistentes
 */
const logger = {
  info: (message, data = {}) => console.log(`[INFO] ${message}`, data),
  error: (message, error) => console.error(`[ERROR] ${message}`, error),
  warn: (message, data = {}) => console.warn(`[WARN] ${message}`, data),
};

/**
 * Determina el tipo MIME basado en la extensión del archivo
 * @param {string} filePath - Ruta del archivo
 * @returns {string} Tipo MIME
 */
function getMimeType(filePath) {
  const extension = filePath.split(".").pop().toLowerCase();
  return MIME_TYPES[extension] || MIME_TYPES.default;
}

/**
 * Parsea la URI de Google Cloud Storage
 * @param {string} gcsUri - URI en formato gs://bucket/path
 * @returns {{bucketName: string, filePath: string}}
 */
function parseGcsUri(gcsUri) {
  const [bucketName, filePath] = gcsUri.replace("gs://", "").split(/\/(.+)/);
  return { bucketName, filePath };
}

/**
 * Construye la URI completa de Google Cloud Storage
 * @param {string} storagePath - Ruta del archivo en Storage
 * @returns {string} URI completa
 */
function buildGcsUri(storagePath) {
  return `gs://${CONFIG.STORAGE_BUCKET}/${storagePath}`;
}

// ============================================================================
// LÓGICA DE NEGOCIO
// ============================================================================

/**
 * Convierte un archivo de Cloud Storage a formato base64 para Gemini
 * @param {string} gcsUri - URI del archivo (ej. "gs://bucket/file.jpg")
 * @returns {Promise<{inlineData: {mimeType: string, data: string}}>}
 */
async function fileToGenerativePart(gcsUri) {
  const { bucketName, filePath } = parseGcsUri(gcsUri);
  
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  // Descargar archivo como buffer
  const [buffer] = await file.download();

  // Determinar tipo MIME
  const mimeType = getMimeType(filePath);

  return {
    inlineData: {
      mimeType,
      data: buffer.toString("base64"),
    },
  };
}

/**
 * Obtiene el documento de Firestore y extrae la ruta de Storage
 * @param {string} firestorePath - Ruta del documento en Firestore
 * @returns {Promise<string>} Ruta del archivo en Storage
 * @throws {Error} Si el documento no existe o no tiene storagePath
 */
async function getStoragePathFromFirestore(firestorePath) {
  logger.info("Obteniendo documento de Firestore", { firestorePath });
  
  const docRef = firestore.doc(firestorePath);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new Error("El documento de Firestore no fue encontrado");
  }

  const { storagePath } = docSnap.data();
  
  if (!storagePath) {
    throw new Error('El documento no contiene el campo "storagePath"');
  }

  return storagePath;
}

/**
 * Analiza una imagen usando Gemini AI
 * @param {string} gcsUri - URI de la imagen en Cloud Storage
 * @param {string} submissionType - Tipo de documento (STATEMENT o PAYMENT)
 * @returns {Promise<string>} Monto extraído de la imagen
 */
async function analyzeImageWithGemini(gcsUri, submissionType) {
  const prompt = PROMPTS[submissionType] || PROMPTS[SUBMISSION_TYPES.PAYMENT];
  
  const generativeModel = vertexAI.getGenerativeModel({
    model: CONFIG.MODEL,
  });

  const imagePart = await fileToGenerativePart(gcsUri);
  const requestPayload = {
    contents: [
      {
        role: "user",
        parts: [imagePart, { text: prompt }],
      },
    ],
  };

  logger.info("Enviando solicitud a Gemini AI");
  const result = await generativeModel.generateContent(requestPayload);
  const textResponse = result.response.candidates[0].content.parts[0].text;

  logger.info("Respuesta recibida de Gemini", { response: textResponse });
  
  return textResponse.trim();
}

/**
 * Valida y normaliza los parámetros de entrada
 * @param {Object} body - Body de la request
 * @returns {{firestorePath: string, submissionType: string}}
 * @throws {Error} Si faltan parámetros requeridos
 */
function validateAndNormalizeParams(body) {
  let { firestorePath, submissionType } = body;

  // Manejo de parámetros anidados (backward compatibility)
  if (
    typeof firestorePath === "object" &&
    firestorePath !== null &&
    firestorePath.firestorePath
  ) {
    submissionType = firestorePath.submissionType;
    firestorePath = firestorePath.firestorePath;
  }

  if (!firestorePath || !submissionType) {
    throw new Error(
      'Faltan los parámetros "firestorePath" o "submissionType" en la solicitud'
    );
  }

  // Validar que submissionType sea válido
  if (!Object.values(SUBMISSION_TYPES).includes(submissionType)) {
    logger.warn("Tipo de submisión desconocido, usando PAYMENT por defecto", {
      submissionType,
    });
    submissionType = SUBMISSION_TYPES.PAYMENT;
  }

  return { firestorePath, submissionType };
}

/**
 * Configura headers CORS
 * @param {Object} res - Response object
 */
function setCorsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// ============================================================================
// HANDLER DE LA FUNCIÓN HTTP
// ============================================================================

/**
 * Función HTTP para analizar imágenes de estados de cuenta o pagos
 * 
 * @endpoint POST /getTotalAmount
 * @body {Object} request body
 * @body.firestorePath {string} - Ruta del documento en Firestore
 * @body.submissionType {string} - Tipo: "STATEMENT" o "PAYMENT"
 * 
 * @returns {Object} - { total: string }
 * 
 * @example
 * POST /getTotalAmount
 * {
 *   "firestorePath": "submissions/abc123",
 *   "submissionType": "STATEMENT"
 * }
 * 
 * Response: { "total": "1234.56" }
 */
functions.http("getTotalAmount", async (req, res) => {
  // Configurar CORS
  setCorsHeaders(res);

  // Manejar preflight request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    // 1. Validar y normalizar parámetros
    const { firestorePath, submissionType } = validateAndNormalizeParams(
      req.body
    );

    // 2. Obtener ruta del archivo desde Firestore
    const storagePath = await getStoragePathFromFirestore(firestorePath);
    const gcsUri = buildGcsUri(storagePath);

    // 3. Analizar imagen con Gemini
    const total = await analyzeImageWithGemini(gcsUri, submissionType);

    // 4. Retornar resultado
    res.status(200).json({ total });
  } catch (error) {
    logger.error("Error procesando solicitud", error);

    // Determinar código de status apropiado
    const statusCode =
      error.message.includes("no fue encontrado") ? 404 :
      error.message.includes("Faltan los parámetros") ? 400 :
      500;

    res.status(statusCode).json({
      error: error.message || "Error interno del servidor",
    });
  }
});
