// src/hooks/usePayments.js
import { useState, useEffect, useMemo, useContext, useCallback } from "react";
import {
  getPaymentsForDateRange,
  addPayment,
  deletePayment,
  downloadReceipt as serviceDownloadReceipt,
  updatePaymentDate as serviceUpdatePaymentDate,
  getAITotal,
  updatePaymentData,
} from "../services/firestoreService";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

// El hook ahora acepta un rango de fechas explícito
const usePayments = (startDate, endDate) => {
  const { currentUser } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!startDate || !endDate) {
      setPayments([]);
      setIsLoading(false);
      return () => {};
    }

    setIsLoading(true);

    const unsubscribe = getPaymentsForDateRange(
      startDate,
      endDate,
      (fetchedPayments) => {
        // 1. Actualizamos el estado con TODOS los documentos recibidos
        setPayments(fetchedPayments);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [startDate, endDate]); // El efecto ahora depende del rango de fechas

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
  }, [fetchData]);

  // filtrar pronos payments excluir = 0
  const pronosticosPayments = useMemo(
    () => payments.filter((p) => p.type === "PRONOSTICOS" && p.amount > 0),
    [payments]
  );
  // filtrar via payments excluir = 0
  const viaPayments = useMemo(
    () => payments.filter((p) => p.type === "VIA" && p.amount > 0),
    [payments]
  );

  // total de los pagos por semana
  const pronosticosTotal = useMemo(
    () => pronosticosPayments.reduce((sum, mov) => sum + mov.amount, 0),
    [pronosticosPayments]
  );

  // total de los pagos por semana
  const viaTotal = useMemo(
    () => viaPayments.reduce((sum, mov) => sum + mov.amount, 0),
    [viaPayments]
  );

  // get estado de cuenta
  const pronosticosStatement = useMemo(
    () =>
      payments.find((p) => p.type === "PRONOSTICOS" && p.amount === 0) || null,
    [payments]
  );
  // get estado de ceunta
  const viaStatement = useMemo(
    () => payments.find((p) => p.type === "VIA" && p.amount === 0) || null,
    [payments]
  );

  const hasPronosticosStatement = !!pronosticosStatement;
  const hasViaStatement = !!viaStatement;

  // 1. FUNCIÓN PARA INICIAR EL PROCESO Y LLAMAR A LA IA
  const handleInitialUpload = async ({ receiptFile, type, submissionType }) => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión.");
      return { success: false, error: "Not authenticated" };
    }
    if (!receiptFile) {
      toast.error("Por favor, selecciona un archivo.");
      return { success: false, error: "No file selected" };
    }

    const toastId = toast.loading("Subiendo archivo...");

    try {
      // Primero, crea el documento en Firestore con un monto temporal de 0
      const { id } = await addPayment({
        amount: 0,
        receiptFile,
        creatorUid: currentUser.uid,
        type,
        submissionType,
      });

      // Luego, llama a la IA para que analice el archivo
      toast.loading("Analizando con IA...", { id: toastId });
      const aiTotalString = await getAITotal({
        firestorePath: `payments/${id}`,
        submissionType,
      });

      toast.dismiss(toastId); // Cierra el toast de "cargando"

      if (aiTotalString) {
        const aiAmountNumber = parseFloat(aiTotalString);

        // ÉXITO DE LA IA: Devuelve el resultado y el ID del documento
        return { success: true, aiAmount: aiAmountNumber, paymentId: id };
      } else {
        // FALLO DE LA IA: Informa al usuario y devuelve el ID para la entrada manual
        toast.error(
          "La IA no pudo leer el monto. Por favor, ingrésalo manualmente."
        );
        return { success: false, paymentId: id };
      }
    } catch (err) {
      toast.error("Ocurrió un error en el proceso.");
      console.error("Error en el flujo de IA:", err);
      return { success: false, error: err.message };
    }
  };

  // 2. FUNCIÓN PARA CONFIRMAR/GUARDAR EL MONTO FINAL
  const handleConfirmPayment = async ({
    paymentId,
    amount,
    submissionType,
  }) => {
    if (
      !paymentId ||
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      toast.error("El monto no puede estar vacío.");
      return;
    }

    // Prepara el objeto de datos para actualizar, dependiendo si es PAGO o ESTADO DE CUENTA
    const dataToUpdate =
      submissionType === "STATEMENT"
        ? { monthlyTotal: Number(amount) }
        : { amount: Number(amount) };

    // Usa un toast.promise para la actualización final
    await toast.promise(updatePaymentData(paymentId, dataToUpdate), {
      loading: "Guardando monto final...",
      success: <b>¡Operación completada!</b>,
      error: <b>Error al guardar el monto.</b>,
    });
  };
  const handleDeletePayment = async (paymentId, storagePath) => {
    if (window.confirm(`¿Seguro que quieres eliminar el pago?`)) {
      await toast.promise(deletePayment(paymentId, storagePath), {
        loading: "Eliminando pago...",
        success: <b>Pago eliminado</b>,
        error: <b>Error al eliminar el pago.</b>,
      });
    }
  };

  const handleDownloadReceipt = async (receiptUrl, storagePath) => {
    await toast.promise(serviceDownloadReceipt(receiptUrl, storagePath), {
      loading: "Descargando...",
      success: <b>Descarga iniciada.</b>,
      error: <b>No se pudo descargar el comprobante.</b>,
    });
  };

  const handleUpdatePaymentDate = async (paymentId, newDate) => {
    await toast.promise(serviceUpdatePaymentDate(paymentId, newDate), {
      loading: "Actualizando fecha...",
      success: <b>Fecha actualizada correctamente</b>,
      error: <b>Error al actualizar la fecha.</b>,
    });
  };

  return {
    isLoading,
    pronosticosPayments,
    viaPayments,
    pronosticosTotal,
    viaTotal,
    handleInitialUpload,
    handleConfirmPayment,
    handleDeletePayment,
    handleDownloadReceipt,
    handleUpdatePaymentDate,
    hasPronosticosStatement,
    hasViaStatement,
    refetchPayments: fetchData,
    pronosticosStatement,
    viaStatement,
    payments,
  };
};

export default usePayments;
