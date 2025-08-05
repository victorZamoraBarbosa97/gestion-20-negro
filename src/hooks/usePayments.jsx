// src/hooks/usePayments.js
import { useState, useEffect, useMemo, useContext } from "react";
import {
  getPaymentsForWeek,
  addPayment,
  deletePayment,
  downloadReceipt as serviceDownloadReceipt,
  updatePaymentDate as serviceUpdatePaymentDate,
} from "../services/firestoreService";
import { AuthContext } from "../context/AuthContext";
import { getWeekNumber } from "../utils/dateHelpers";
import toast from 'react-hot-toast'; // 1. Importar toast

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
    if (!currentUser) {
      toast.error("Debes iniciar sesión para añadir un pago.");
      return;
    }
    // Usar toast.promise para manejar estados de carga, éxito y error
    await toast.promise(
      addPayment({
        amount,
        receiptFile,
        creatorUid: currentUser.uid,
        type,
      }),
      {
        loading: 'Añadiendo pago...',
        success: <b>Pago añadido con éxito</b>,
        error: <b>No se pudo añadir el pago.</b>,
      }
    );
  };

  const handleDeletePayment = async (paymentId, storagePath) => {
    if (window.confirm(`¿Seguro que quieres eliminar el pago?`)) {
      await toast.promise(
        deletePayment(paymentId, storagePath),
        {
          loading: 'Eliminando pago...',
          success: <b>Pago eliminado</b>,
          error: <b>Error al eliminar el pago.</b>,
        }
      );
    }
  };

  const handleDownloadReceipt = async (receiptUrl, storagePath) => {
    await toast.promise(
      serviceDownloadReceipt(receiptUrl, storagePath),
      {
        loading: 'Descargando...',
        success: <b>Descarga iniciada.</b>,
        error: <b>No se pudo descargar el comprobante.</b>,
      }
    );
  };

  const handleUpdatePaymentDate = async (paymentId, newDate) => {
    await toast.promise(
      serviceUpdatePaymentDate(paymentId, newDate),
      {
        loading: 'Actualizando fecha...',
        success: <b>Fecha actualizada correctamente</b>,
        error: <b>Error al actualizar la fecha.</b>,
      }
    );
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
    handleUpdatePaymentDate,
  };
};

export default usePayments;
