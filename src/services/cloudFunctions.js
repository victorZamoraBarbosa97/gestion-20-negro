/**
 * Servicio para interactuar con Google Cloud Functions
 * Único punto de entrada para llamar a getTotalAmount (análisis con Gemini)
 */
import { logger } from "../utils/logger";
import { AppError, handleHTTPError } from "../utils/errorHandler";
import { auth } from "../firebase/config";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Analiza una imagen de estado de cuenta o pago usando Gemini AI
 *
 * @param {string} firestorePath - Ruta del documento en Firestore
 * @param {'STATEMENT' | 'PAYMENT'} submissionType - Tipo de documento
 * @returns {Promise<{total: string, date: string | null}>} Monto detectado
 *   (string numérico) y fecha detectada en formato YYYY-MM-DD, o null si la
 *   IA no pudo determinarla.
 * @throws {AppError} Si la petición falla o la IA devuelve un monto inválido
 */
export async function getTotalAmount(firestorePath, submissionType) {
  const startTime = performance.now();

  try {
    if (!auth.currentUser) {
      throw new AppError(
        "Debes iniciar sesión (o entrar como invitado) para usar el análisis con IA.",
        "UNAUTHENTICATED",
        401,
      );
    }

    logger.info("Iniciando análisis de documento", {
      firestorePath,
      submissionType,
    });

    // El backend exige un ID token de Firebase (acepta invitados anónimos)
    // para bloquear llamadas directas a la URL fuera de esta app.
    const idToken = await auth.currentUser.getIdToken();

    const response = await fetch(`${API_BASE_URL}/getTotalAmount`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        firestorePath,
        submissionType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || handleHTTPError(response);

      logger.error(
        "Error en respuesta de Cloud Function",
        new Error(errorMessage),
        {
          status: response.status,
          statusText: response.statusText,
          errorData,
        },
      );

      throw new AppError(errorMessage, "CLOUD_FUNCTION_ERROR", response.status);
    }

    const data = await response.json();

    // Validar que el monto devuelto por la IA sea un número válido
    const parsedTotal = parseFloat(data.total);
    if (isNaN(parsedTotal) || parsedTotal < 0) {
      throw new AppError(
        "La IA devolvió un monto inválido",
        "INVALID_AI_RESPONSE",
        502,
      );
    }

    // La fecha es opcional: si la IA no la detectó o vino en un formato
    // raro, simplemente la ignoramos (el usuario la captura a mano).
    const detectedDate =
      typeof data.date === "string" && !isNaN(new Date(data.date).getTime())
        ? data.date
        : null;

    const duration = performance.now() - startTime;
    logger.info("Análisis completado exitosamente", {
      total: data.total,
      date: detectedDate,
      duration: `${duration}ms`,
    });

    return { total: data.total, date: detectedDate };
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error("Error llamando a getTotalAmount", error, {
      firestorePath,
      submissionType,
      duration: `${duration}ms`,
    });

    // Si ya es un AppError, solo re-lanzarlo
    if (error instanceof AppError) {
      throw error;
    }

    // Si es un error de red
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new AppError(
        "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
        "NETWORK_ERROR",
        0,
      );
    }

    // Error genérico
    throw new AppError(
      "Error al procesar el documento. Por favor, intenta de nuevo.",
      "UNKNOWN_ERROR",
      500,
    );
  }
}

export default { getTotalAmount };
