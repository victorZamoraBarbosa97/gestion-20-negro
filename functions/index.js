import functions from "@google-cloud/functions-framework";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { VertexAI } from "@google-cloud/vertexai";

// --- CONFIGURACIÓN INICIAL ---
// Reemplaza con tu Project ID y la ubicación de tu proyecto.
const PROJECT_ID = "gestion-20";
const LOCATION = "us-central1";

// Inicializamos los clientes de los servicios de Google Cloud
const keyFilename = "service-account-key.json"; // El nombre de nuestra llave

const firestore = new Firestore({ keyFilename });
const storage = new Storage({ projectId: PROJECT_ID, keyFilename });
const vertex_ai = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
  keyFilename,
});

// --- LÓGICA DE LA FUNCIÓN ---

/**
 * Función auxiliar para convertir un archivo de Cloud Storage a base64.
 * Gemini necesita que la imagen se envíe en este formato.
 * @param {string} gcsUri - La URI del archivo en Cloud Storage (ej. "gs://bucket/file.jpg").
 * @returns {Promise<{mimeType: string, data: string}>} - Objeto con el tipo MIME y los datos en base64.
 */
async function fileToGenerativePart(gcsUri) {
  const [bucketName, filePath] = gcsUri.replace("gs://", "").split(/\/(.+)/);
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  // Descargamos el archivo como un buffer (datos binarios)
  const [buffer] = await file.download();

  // Determinamos el tipo de archivo (MIME type) por su extensión
  let mimeType = "application/octet-stream"; // Tipo por defecto
  if (filePath.endsWith(".png")) mimeType = "image/png";
  if (filePath.endsWith(".jpeg") || filePath.endsWith(".jpg"))
    mimeType = "image/jpeg";

  return {
    inlineData: {
      mimeType,
      data: buffer.toString("base64"),
    },
  };
}

/**
 * Función HTTP que se activa para analizar una imagen de un estado de cuenta.
 * Espera: { "firestorePath": "...", "submissionType": "PAYMENT" | "STATEMENT" }
 */
functions.http("getTotalAmount", async (req, res) => {
  // ... (código de CORS)
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  try {
    // --- 1. VALIDACIÓN DE PARÁMETROS ---
    let { firestorePath, submissionType } = req.body;

    if (
      typeof firestorePath === "object" &&
      firestorePath !== null &&
      firestorePath.firestorePath
    ) {
      submissionType = firestorePath.submissionType;
      firestorePath = firestorePath.firestorePath;
    }
    if (!firestorePath || !submissionType) {
      return res
        .status(400)
        .send(
          'Faltan los parámetros "firestorePath" o "submissionType" en la solicitud.'
        );
    }

    // --- Obtención del documento y la ruta del archivo  ---
    console.log(`Obteniendo documento de Firestore: ${firestorePath}`);
    const docRef = firestore.doc(firestorePath);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res
        .status(404)
        .send("El documento de Firestore no fue encontrado.");
    }

    // Obtenemos el campo 'storagePath' que sí existe en el documento.
    const { storagePath } = docSnap.data();
    if (!storagePath) {
      return res
        .status(400)
        .send('El documento no contiene el campo "storagePath".');
    }

    const gcsUri = `gs://gestion-20.firebasestorage.app/${storagePath}`;
    // console.log(`URI de la imagen construida: ${gcsUri}`);

    let prompt;
    if (submissionType === "STATEMENT") {
      prompt =
        "Eres un asistente experto en análisis financiero. Tu única tarea es analizar la imagen de este estado de cuenta. Extrae el MONTO TOTAL A PAGAR. Devuelve exclusivamente el valor numérico, usando un punto como separador decimal y sin comas para los miles. No incluyas símbolos de moneda ni texto adicional. Ejemplo de respuesta correcta: 1234.56";
    } else {
      // Por defecto, se asume que es un pago
      prompt =
        "Eres un asistente experto en análisis financiero. Tu única tarea es analizar la imagen de este recibo o comprobante de pago. Extrae el MONTO TOTAL PAGADO. Devuelve exclusivamente el valor numérico, usando un punto como separador decimal y sin comas para los miles. No incluyas símbolos de moneda ni texto adicional. Ejemplo de respuesta correcta: 500.00";
    }

    // Preparar la solicitud para la API de Gemini
    const generativeModel = vertex_ai.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Pasamos la URI completa que acabamos de construir.
    const imagePart = await fileToGenerativePart(gcsUri);
    const requestPayload = {
      contents: [{ role: "user", parts: [imagePart, { text: prompt }] }],
    };

    console.log("Enviando solicitud a la API de Gemini...");
    const result = await generativeModel.generateContent(requestPayload);
    const textResponse = result.response.candidates[0].content.parts[0].text;

    console.log(`Respuesta de Gemini: ${textResponse}`);

    res.status(200).json({
      total: textResponse.trim(),
    });
  } catch (error) {
    console.error("Ocurrió un error en la función:", error);
    res.status(500).send("Error interno del servidor.");
  }
});
