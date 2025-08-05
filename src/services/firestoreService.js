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
import { v4 as uuidv4 } from "uuid";

const storage = getStorage();
const paymentsCollectionRef = collection(db, "payments");

/**
 * Escucha en tiempo real los pagos de una semana específica.
 * @param {Date} startDate - El inicio de la semana.
 * @param {Function} callback - Función para actualizar el estado con los nuevos datos.
 * @returns {Function} - Función para cancelar la suscripción al listener.
 */
// Ejemplo (verifica tu implementación real en firestoreService.js)
export const getPaymentsForWeek = (startDate, callback) => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // <-- Esto es crucial: 6 días más desde el Lunes para incluir el Domingo
  endDate.setHours(23, 59, 59, 999); // <-- Asegura que sea hasta el final del Domingo

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
 */
export const addPayment = async ({ amount, receiptFile, creatorUid, type }) => {
  if (!receiptFile || !amount || !creatorUid || !type) {
    throw new Error("Faltan datos para añadir el pago.");
  }

  // 1. Subir el comprobante a Firebase Storage
  const filePath = `receipts/${uuidv4()}-${receiptFile.name}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, receiptFile);

  // 2. Obtener la URL de descarga
  const receiptUrl = await getDownloadURL(storageRef);

  // 3. Guardar el documento en Firestore
  await addDoc(paymentsCollectionRef, {
    amount: Number(amount),
    date: Timestamp.now(),
    receiptUrl,
    storagePath: filePath, // Guardar la ruta para poder eliminarlo después
    creatorUid,
    type, // Guardar el tipo de pago
  });
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

export const updatePaymentDate = async (paymentId, newDate) => {
  if (!paymentId) {
    throw new Error(
      "ID de pago no proporcionado para la actualización de fecha."
    );
  }
  if (!newDate instanceof Date) {
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
