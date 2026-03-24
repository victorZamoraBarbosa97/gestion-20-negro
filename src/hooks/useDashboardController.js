import { useState, useMemo, useCallback } from "react";
import { getStartOfWeek } from "../utils/dateHelpers";
import usePayments from "./usePayments";
import useNotifications from "./useNotifications";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const useDashboardController = () => {
  // --- ESTADOS GLOBALES ---
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(
    getStartOfWeek(new Date()),
  );

  // Acceso al usuario para verificar permisos
  const { currentUser } = useAuth();

  // Calcular fin de semana
  const currentWeekEndDate = useMemo(() => {
    const endDate = new Date(currentWeekStartDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  }, [currentWeekStartDate]);

  // --- ESTADOS DE UI (MODALES) ---
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChangeDateModalOpen, setIsChangeDateModalOpen] = useState(false);
  const [paymentToChangeDate, setPaymentToChangeDate] = useState(null);
  const [paymentTypeToAdd, setPaymentTypeToAdd] = useState("PRONOSTICOS");
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementType, setStatementType] = useState("PRONOSTICOS");

  // --- HOOKS DE NEGOCIO ---
  const paymentsData = usePayments(currentWeekStartDate, currentWeekEndDate);
  const {
    isLoading,
    pronosticosPayments,
    viaPayments,
    pronosticosTotal,
    viaTotal,
    handleDeletePayment,
    handleUpdatePaymentDate,
    handleConfirmPayment,
    handleInitialUpload,
    handleDownloadReceipt,
    hasPronosticosStatement,
    hasViaStatement,
    pronosticosStatement,
    viaStatement,
    payments, // Todos los pagos planos para notificaciones
  } = paymentsData;

  const { notifications } = useNotifications({
    payments,
    pronosticosStatement,
    viaStatement,
    pronosticosTotal,
    viaTotal,
    currentWeekStartDate,
  });

  // --- HANDLERS: NAVEGACIÓN ---
  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  }, []);

  // --- HANDLERS: GESTIÓN DE MODALES ---
  const handleOpenAddModal = useCallback((type) => {
    setPaymentTypeToAdd(type);
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  // Helper para manejar errores de permisos
  const handleActionError = useCallback((error, actionName) => {
    console.error(`Error en ${actionName}:`, error);

    // Detectar errores de permisos tanto de Firestore como de Storage
    if (
      error.code === "permission-denied" ||
      error.code === "storage/unauthorized" ||
      error.message?.includes("permission")
    ) {
      toast.error("🔒 Acción restringida en modo invitado.", {
        icon: "🚫",
        duration: 4000,
      });
    } else {
      toast.error("Ocurrió un error al procesar la acción.");
    }
  }, []);

  // Wrappers seguros para acciones de negocio
  const handleDeletePaymentClick = useCallback(
    async (payment) => {
      try {
        // Promesa de borrado
        await handleDeletePayment(payment.id, payment.storagePath);
        setSelectedPayment(null);
        toast.success("Pago eliminado correctamente");
      } catch (error) {
        handleActionError(error, "eliminar pago");
      }
    },
    [handleDeletePayment, handleActionError],
  );

  const handleOpenChangeDateModal = useCallback((payment) => {
    setSelectedPayment(null);
    setPaymentToChangeDate(payment);
    setIsChangeDateModalOpen(true);
  }, []);

  const handleCloseChangeDateModal = useCallback(() => {
    setIsChangeDateModalOpen(false);
    setPaymentToChangeDate(null);
  }, []);

  const handleUpdateDate = useCallback(
    async (paymentId, newDate) => {
      try {
        await handleUpdatePaymentDate(paymentId, newDate);
        setIsChangeDateModalOpen(false);
        setPaymentToChangeDate(null);
        toast.success("Fecha actualizada correctamente");
      } catch (error) {
        handleActionError(error, "actualizar fecha");
      }
    },
    [handleUpdatePaymentDate, handleActionError],
  );

  const handleOpenStatementModal = useCallback((type) => {
    setStatementType(type);
    setIsStatementModalOpen(true);
  }, []);

  const handleCloseStatementModal = useCallback(() => {
    setIsStatementModalOpen(false);
  }, []);

  const handleViewStatementClick = useCallback((statement) => {
    if (statement) {
      setSelectedPayment(statement);
    }
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setSelectedPayment(null);
  }, []);

  // Wrappers para las acciones que vienen de usePayments (ej. Crear Pago)
  const safeHandleConfirmPayment = useCallback(
    async (params) => {
      try {
        await handleConfirmPayment(params);
        setIsAddModalOpen(false); // Cerrar modal si éxito
        setIsStatementModalOpen(false);
      } catch (error) {
        handleActionError(error, "confirmar pago");
      }
    },
    [handleConfirmPayment, handleActionError],
  );

  const safeHandleInitialUpload = useCallback(
    async (params) => {
      try {
        return await handleInitialUpload(params);
      } catch (error) {
        handleActionError(error, "subir comprobante");
        return { success: false }; // Retornar estado fallido
      }
    },
    [handleInitialUpload, handleActionError],
  );

  const safeHandleDownloadReceipt = useCallback(
    (url, path) => {
      if (currentUser?.isAnonymous) {
        toast.error("🔒 Acción restringida en modo invitado.", {
          icon: "🚫",
          duration: 4000,
        });
        return;
      }
      handleDownloadReceipt(url, path);
    },
    [currentUser, handleDownloadReceipt],
  );

  // --- RETURN API ---
  return {
    // Estado Global
    currentWeekStartDate,
    notifications,
    isLoading,

    // Datos
    pronosticosPayments,
    viaPayments,
    pronosticosTotal,
    viaTotal,
    pronosticosStatement,
    viaStatement,
    hasPronosticosStatement,
    hasViaStatement,

    // Estado Modales
    modalsState: {
      isAddModalOpen,
      isChangeDateModalOpen,
      isStatementModalOpen,
      selectedPayment,
      paymentTypeToAdd,
      paymentToChangeDate,
      statementType,
    },

    // Acciones de Negocio (passthrough desde usePayments)
    businessActions: {
      handleInitialUpload: safeHandleInitialUpload,
      handleConfirmPayment: safeHandleConfirmPayment,
      handleDownloadReceipt: safeHandleDownloadReceipt,
    },

    // Handlers de UI
    uiHandlers: {
      handlePrevWeek,
      handleNextWeek,
      handleCloseAddModal,
      handleDeletePaymentClick,
      handleOpenChangeDateModal,
      handleCloseChangeDateModal,
      handleUpdateDate,
      handleCloseStatementModal,
      handleCloseDetailModal,
      setSelectedPayment,

      // Helpers específicos pre-configurados
      openPronosticosAdd: () => handleOpenAddModal("PRONOSTICOS"),
      openViaAdd: () => handleOpenAddModal("VIA"),
      openPronosticosStatementAdd: () =>
        handleOpenStatementModal("PRONOSTICOS"),
      openViaStatementAdd: () => handleOpenStatementModal("VIA"),
      viewPronosticosStatement: () =>
        handleViewStatementClick(pronosticosStatement),
      viewViaStatement: () => handleViewStatementClick(viaStatement),
    },
  };
};

export default useDashboardController;
