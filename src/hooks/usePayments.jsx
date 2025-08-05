// src/hooks/usePayments.js
import { useState, useEffect, useMemo, useContext } from "react";
import {
  getPaymentsForWeek,
  addPayment,
  deletePayment,
  downloadReceipt as serviceDownloadReceipt,
  updatePaymentDate as serviceUpdatePaymentDate,
} from "../services/firestoreService"; // Asegúrate de que esta ruta sea correcta e importa updatePaymentDate
import { AuthContext } from "../context/AuthContext"; // Asume que AuthContext está en esta ruta
import { getWeekNumber } from "../utils/dateHelpers"; // Importa el helper de fecha

const usePayments = (currentWeekStartDate) => {
  const { currentUser } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = getPaymentsForWeek(
      currentWeekStartDate,
      (fetchedPayments) => {
        setPayments(fetchedPayments);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentWeekStartDate]);

  const pronosticosPayments = useMemo(
    () => payments.filter((p) => p.type === "PRONOSTICOS"),
    [payments]
  );
  const viaPayments = useMemo(
    () => payments.filter((p) => p.type === "VIA"),
    [payments]
  );

  const pronosticosTotal = useMemo(
    () => pronosticosPayments.reduce((sum, mov) => sum + mov.amount, 0),
    [pronosticosPayments]
  );
  const viaTotal = useMemo(
    () => viaPayments.reduce((sum, mov) => sum + mov.amount, 0),
    [viaPayments]
  );
  const weekNumber = useMemo(
    () => getWeekNumber(currentWeekStartDate),
    [currentWeekStartDate]
  );

  const handleAddPayment = async ({ amount, receiptFile, type }) => {
    if (!currentUser) throw new Error("Usuario no autenticado.");
    await addPayment({
      amount,
      receiptFile,
      creatorUid: currentUser.uid,
      type,
    });
  };

  const handleDeletePayment = async (paymentId, storagePath) => {
    if (window.confirm(`¿Seguro que quieres eliminar el pago?`)) {
      try {
        await deletePayment(paymentId, storagePath);
        // La lista se actualizará automáticamente gracias al listener de Firestore
      } catch (error) {
        console.error("Error al eliminar el pago:", error);
        alert("No se pudo eliminar el pago.");
      }
    }
  };

  const handleDownloadReceipt = async (receiptUrl, storagePath) => {
    try {
      await serviceDownloadReceipt(receiptUrl, storagePath);
    } catch (error) {
      console.error("Error al descargar el comprobante:", error);
      alert("No se pudo descargar el comprobante.");
    }
  };

  const handleUpdatePaymentDate = async (paymentId, newDate) => {
    try {
      await serviceUpdatePaymentDate(paymentId, newDate);
      // La UI se actualizará automáticamente si getPaymentsForWeek está usando onSnapshot
    } catch (error) {
      console.error("Error al actualizar la fecha del pago en el hook:", error);
      alert("Error al actualizar la fecha del pago.");
      throw error; // Propagar el error si es necesario
    }
  };

  return {
    payments,
    isLoading,
    pronosticosPayments,
    viaPayments,
    pronosticosTotal,
    viaTotal,
    weekNumber,
    handleAddPayment,
    handleDeletePayment,
    handleDownloadReceipt,
    handleUpdatePaymentDate, // Exporta la nueva función
  };
};

export default usePayments;
