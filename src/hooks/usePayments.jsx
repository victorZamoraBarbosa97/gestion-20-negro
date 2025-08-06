// src/hooks/usePayments.js
import { useState, useEffect, useMemo, useContext } from "react";
import {
  getPaymentsForDateRange, // Cambiado de getPaymentsForWeek
  addPayment,
  deletePayment,
  downloadReceipt as serviceDownloadReceipt,
  updatePaymentDate as serviceUpdatePaymentDate,
} from "../services/firestoreService";
import { AuthContext } from "../context/AuthContext";
import toast from 'react-hot-toast';

// El hook ahora acepta un rango de fechas explícito
const usePayments = (startDate, endDate) => {
  const { currentUser } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Si no se proveen las fechas, no hacer nada.
    if (!startDate || !endDate) {
      setPayments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = getPaymentsForDateRange( // Usando la nueva función
      startDate,
      endDate,
      (fetchedPayments) => {
        setPayments(fetchedPayments);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [startDate, endDate]); // El efecto ahora depende del rango de fechas

  // El resto de la lógica de cálculo sigue siendo válida
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
  
  // Las funciones de acción no necesitan cambios
  const handleAddPayment = async ({ amount, receiptFile, type }) => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para añadir un pago.");
      return;
    }
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
    handleAddPayment,
    handleDeletePayment,
    handleDownloadReceipt,
    handleUpdatePaymentDate,
  };
};

export default usePayments;
