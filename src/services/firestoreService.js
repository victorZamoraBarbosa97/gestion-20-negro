// src/services/firestoreService.js
import { db } from "../firebase/config";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { app } from "../firebase/config"; // Importa la app de Firebase
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { v4 as uuidv4 } from "uuid";

const storage = getStorage();
const paymentsCollectionRef = collection(db, "payments");
const functions = getFunctions(app); // Inicializa las funciones de Firebase

if (location.hostname === "localhost") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

/**
 * Llama a la función de Firebase Cloud para obtener el monto total de la IA.
 * @param {string} firestorePath - La ruta del DOCUMENTO en Firestore (ej. 'invoices/doc123').
 * @returns {Promise<string>} - El monto total calculado por la IA.
 */
export const getAITotal = async ({ firestorePath, submissionType }) => {
  // La URL de tu función desplegada
  const functionUrl = "https://gettotalamount-jih27qo55a-uc.a.run.app";

  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        // Esta cabecera es crucial para que tu función entienda el cuerpo de la petición
        "Content-Type": "application/json",
      },
      // Enviamos los datos exactamente como la función los espera
      body: JSON.stringify({ firestorePath, submissionType }),
    });

    // Si la respuesta no es exitosa (ej. 400, 500), lanza un error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AIAnalysisError(
        errorData.message || `Error del servidor: ${response.status}`,
        response.status
      );
    }

    // Si todo fue bien, convierte la respuesta a JSON y devuelve el total
    const result = await response.json();
    // Validar que el resultado sea un número válido
    const parsedTotal = parseFloat(result.total);
    if (isNaN(parsedTotal) || parsedTotal < 0) {
      throw new AIAnalysisError("La IA devolvió un monto inválido");
    }

    return result.total; // Asumiendo que tu función devuelve { total: "123.45" }
  } catch (error) {
    if (error instanceof AIAnalysisError) throw error;
    // Errores de red
    if (error.name === "TypeError") {
      throw new AIAnalysisError("Error de conexión con el servidor de IA");
    }
    throw new AIAnalysisError("Error inesperado al procesar la imagen");
  }
};
/**
 * Escucha en tiempo real los pagos dentro de un rango de fechas.
 * @param {Date} startDate - El inicio del rango.
 * @param {Date} endDate - El fin del rango.
 * @param {Function} callback - Función para actualizar el estado con los nuevos datos.
 * @returns {Function} - Función para cancelar la suscripción al listener.
 */
export const getPaymentsForDateRange = (startDate, endDate, callback) => {
  if (!startDate || !endDate) {
    // Devuelve un listener vacío si no hay fechas, para evitar errores.
    return () => {};
  }

  const q = query(
    collection(db, "payments"),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(), // Convierte Timestamp a Date
    }));
    callback(payments);
  });
};

/**
 * Añade un nuevo pago a Firestore y sube el comprobante a Storage.
 * @param {Object} paymentData - Datos del pago.
 * @param {number} paymentData.amount - Monto del pago.
 * @param {File} paymentData.receiptFile - Archivo del comprobante.
 * @param {string} paymentData.creatorUid - UID del usuario que crea el pago.
 * @param {string} paymentData.type - Tipo de pago ('PRONOSTICOS' o 'VIA').
 * @param {number|null} [paymentData.monthlyTotal=null] - Monto total calculado por la IA.
 * @returns {Promise<{id: string, storagePath: string, mimeType: string}>} - Información del pago.
 */
export const addPayment = async ({
  amount,
  receiptFile,
  creatorUid,
  type,
  monthlyTotal = null,
}) => {
  if (!receiptFile || !creatorUid || !type) {
    throw new Error("Faltan datos para añadir el pago.");
  }

  // 1. Subir el comprobante a Firebase Storage
  const filePath = `receipts/${uuidv4()}-${receiptFile.name}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, receiptFile);

  // 2. Obtener la URL de descarga
  const receiptUrl = await getDownloadURL(storageRef);
  const mimeType = receiptFile.type;

  // 3. Guardar el documento en Firestore
  const paymentData = {
    amount: Number(amount),
    date: Timestamp.now(),
    receiptUrl,
    storagePath: filePath,
    creatorUid,
    type,
    monthlyTotal: monthlyTotal,
  };

  const docRef = await addDoc(paymentsCollectionRef, paymentData);

  // 4. Devolver la información necesaria
  return { id: docRef.id, storagePath: filePath, mimeType: mimeType };
};

/**
 * Elimina un pago de Firestore y su comprobante de Storage.
 * @param {string} paymentId - ID del documento del pago.
 * @param {string} storagePath - Ruta del archivo en Storage.
 */
export const deletePayment = async (paymentId, storagePath) => {
  if (!paymentId || !storagePath) {
    throw new Error("Faltan datos para eliminar el pago.");
  }

  // 1. Eliminar el documento de Firestore
  await deleteDoc(doc(db, "payments", paymentId));

  // 2. Eliminar el archivo de Storage
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
};

/**
 * Inicia la descarga del archivo del comprobante.
 * @param {string} receiptUrl - URL del comprobante.
 * @param {string} storagePath - Ruta del archivo en Storage para extraer el nombre.
 */
export const downloadReceipt = (receiptUrl, storagePath) => {
  try {
    const a = document.createElement("a");
    a.href = receiptUrl;
    a.target = "_blank"; // Abre en una nueva pestaña, que es un buen fallback.

    // Extrae el nombre del archivo original de la ruta de storage, quitando el UUID.
    const originalFileName = storagePath.split("/").pop().substring(37);
    a.download = originalFileName || "comprobante.jpg";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error al intentar la descarga:", error);
    // Si todo falla, al menos abrir la URL directamente.
    window.open(receiptUrl, "_blank");
  }
};

// actualiza la fecha de un comprobante
export const updatePaymentDate = async (paymentId, newDate) => {
  if (!paymentId) {
    throw new Error(
      "ID de pago no proporcionado para la actualización de fecha."
    );
  }
  if (!(newDate instanceof Date)) {
    throw new Error("La nueva fecha debe ser un objeto Date.");
  }

  const paymentRef = doc(db, "payments", paymentId);
  try {
    await updateDoc(paymentRef, {
      date: newDate, // Firestore convertirá automáticamente el objeto Date a Timestamp
      updatedAt: serverTimestamp(), // Opcional: añade un timestamp de última actualización
    });
    console.log(
      `Fecha de pago ${paymentId} actualizada a ${newDate.toISOString()}`
    );
  } catch (error) {
    console.error("Error al actualizar la fecha del pago:", error);
    throw error;
  }
};

export const updatePaymentData = async (paymentId, dataToUpdate) => {
  const paymentRef = doc(db, "payments", paymentId);
  await updateDoc(paymentRef, dataToUpdate);
};

// Clase de error personalizada
class AIAnalysisError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AIAnalysisError";
    this.statusCode = statusCode;
  }
}
