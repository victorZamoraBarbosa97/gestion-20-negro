// src/pages/DashboardPage.jsx
// ✨ VERSIÓN OPTIMIZADA CON MEMOIZACIÓN

import { useState, useMemo, useCallback } from "react";
import { getStartOfWeek } from "../utils/dateHelpers";
import usePayments from "../hooks/usePayments";

// Importa los componentes
import WeekNavigator from "../components/navigation/WeekNavigator";
import PaymentList from "../components/payments/PaymentList";
import AddPaymentModal from "../components/payments/AddPaymentModal";
import PaymentDetailModal from "../components/payments/PaymentDetailModal";
import ChangePaymentDateModal from "../components/payments/ChangePaymentDateModal";
import AddStatementModal from "../components/payments/AddStatementModal";

const DashboardPage = () => {
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(
    getStartOfWeek(new Date())
  );

  // ✅ OPTIMIZACIÓN 1: useMemo para cálculos derivados
  const currentWeekEndDate = useMemo(() => {
    const endDate = new Date(currentWeekStartDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  }, [currentWeekStartDate]);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChangeDateModalOpen, setIsChangeDateModalOpen] = useState(false);
  const [paymentToChangeDate, setPaymentToChangeDate] = useState(null);
  const [paymentTypeToAdd, setPaymentTypeToAdd] = useState("PRONOSTICOS");
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementType, setStatementType] = useState("PRONOSTICOS");

  const {
    isLoading,
    pronosticosPayments,
    viaPayments,
    pronosticosTotal,
    viaTotal,
    handleDeletePayment,
    handleDownloadReceipt,
    handleUpdatePaymentDate,
    hasPronosticosStatement,
    hasViaStatement,
    pronosticosStatement,
    viaStatement,
    handleInitialUpload,
    handleConfirmPayment,
  } = usePayments(currentWeekStartDate, currentWeekEndDate);

  // ✅ OPTIMIZACIÓN 2: useCallback para handlers de navegación
  // ANTES: Estas funciones se recreaban en cada render
  // AHORA: Se memorizan y solo se recrean si las dependencias cambian
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

  // ✅ OPTIMIZACIÓN 3: useCallback para handlers de modales
  const handleOpenAddModal = useCallback((type) => {
    setPaymentTypeToAdd(type);
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  const handleDeletePaymentClick = useCallback(
    async (payment) => {
      await handleDeletePayment(payment.id, payment.storagePath);
      setSelectedPayment(null);
    },
    [handleDeletePayment]
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
      await handleUpdatePaymentDate(paymentId, newDate);
      setIsChangeDateModalOpen(false);
      setPaymentToChangeDate(null);
    },
    [handleUpdatePaymentDate]
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

  // ✅ OPTIMIZACIÓN 4: Callbacks específicos para cada tipo
  // Evita crear funciones inline en el JSX
  const handleOpenPronosticosAddModal = useCallback(() => {
    handleOpenAddModal("PRONOSTICOS");
  }, [handleOpenAddModal]);

  const handleOpenViaAddModal = useCallback(() => {
    handleOpenAddModal("VIA");
  }, [handleOpenAddModal]);

  const handleOpenPronosticosStatementModal = useCallback(() => {
    handleOpenStatementModal("PRONOSTICOS");
  }, [handleOpenStatementModal]);

  const handleOpenViaStatementModal = useCallback(() => {
    handleOpenStatementModal("VIA");
  }, [handleOpenStatementModal]);

  const handleViewPronosticosStatement = useCallback(() => {
    handleViewStatementClick(pronosticosStatement);
  }, [handleViewStatementClick, pronosticosStatement]);

  const handleViewViaStatement = useCallback(() => {
    handleViewStatementClick(viaStatement);
  }, [handleViewStatementClick, viaStatement]);

  // ✅ OPTIMIZACIÓN 5: useMemo para formateo de moneda
  // ANTES: se ejecutaba 4 veces en cada render
  // AHORA: solo se recalcula cuando los valores cambian
  const formattedPronosticosTotal = useMemo(
    () =>
      pronosticosTotal.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
      }),
    [pronosticosTotal]
  );

  const formattedViaTotal = useMemo(
    () =>
      viaTotal.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
      }),
    [viaTotal]
  );

  const formattedPronosticosStatementTotal = useMemo(
    () =>
      pronosticosStatement?.monthlyTotal?.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
      }) ?? "N/A",
    [pronosticosStatement]
  );

  const formattedViaStatementTotal = useMemo(
    () =>
      viaStatement?.monthlyTotal?.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
      }) ?? "N/A",
    [viaStatement]
  );

  return (
    <div>
      <main className="max-w-7xl mx-auto p-4 md:p-6 pt-20">
        <div className="mb-6">
          <WeekNavigator
            currentWeekStartDate={currentWeekStartDate}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          {/* --- SECCIÓN PRONÓSTICOS --- */}
          <div className="space-y-3">
            <div className="flex justify-center items-center gap-3 h-10">
              {isLoading ? (
                <p className="text-sm text-slate-500">Cargando...</p>
              ) : (
                <>
                  {hasPronosticosStatement ? (
                    <button
                      onClick={handleViewPronosticosStatement}
                      className="px-3 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg shadow-sm border border-slate-300 hover:bg-slate-50"
                    >
                      Ver Estado de Cuenta
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenPronosticosStatementModal}
                      className="px-3 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg shadow-sm border border-slate-300 hover:bg-slate-50"
                    >
                      Agregar Estado de Cuenta
                    </button>
                  )}
                  <button
                    onClick={handleOpenPronosticosAddModal}
                    className="flex items-center px-3 py-2 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600"
                  >
                    Agregar Pago
                  </button>
                </>
              )}
            </div>

            {/* Tarjeta de Pronósticos */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                <div>
                  <h3 className="text-orange-600 text-xs sm:text-sm font-bold">
                    TOTAL PRONÓSTICOS
                  </h3>
                  <p className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
                    {isLoading ? "..." : formattedPronosticosTotal}
                  </p>
                </div>
                {hasPronosticosStatement && (
                  <div className="sm:text-right">
                    <h3 className="text-orange-600 text-xs sm:text-sm font-bold">
                      TOTAL ESTADO DE CUENTA
                    </h3>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
                      {formattedPronosticosStatementTotal}
                    </p>
                  </div>
                )}
              </div>
              <PaymentList
                payments={pronosticosPayments}
                isLoading={isLoading}
                onPaymentClick={setSelectedPayment}
                type="PRONOSTICOS"
              />
            </div>
          </div>

          {/* --- SECCIÓN VIA --- */}
          <div className="space-y-3">
            <div className="flex justify-center items-center gap-3 h-10">
              {isLoading ? (
                <p className="text-sm text-slate-500">Cargando...</p>
              ) : (
                <>
                  {hasViaStatement ? (
                    <button
                      onClick={handleViewViaStatement}
                      className="px-3 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg shadow-sm border border-slate-300 hover:bg-slate-50"
                    >
                      Ver Estado de Cuenta
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenViaStatementModal}
                      className="px-3 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg shadow-sm border border-slate-300 hover:bg-slate-50"
                    >
                      Agregar Estado de Cuenta
                    </button>
                  )}
                  <button
                    onClick={handleOpenViaAddModal}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
                  >
                    Agregar Pago
                  </button>
                </>
              )}
            </div>

            {/* Tarjeta de VIA */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                <div>
                  <h3 className="text-blue-600 text-xs sm:text-sm font-bold">
                    TOTAL VIA
                  </h3>
                  <p className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
                    {isLoading ? "..." : formattedViaTotal}
                  </p>
                </div>
                {hasViaStatement && (
                  <div className="sm:text-right">
                    <h3 className="text-blue-600 text-xs sm:text-sm font-bold">
                      TOTAL ESTADO DE CUENTA
                    </h3>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
                      {formattedViaStatementTotal}
                    </p>
                  </div>
                )}
              </div>
              <PaymentList
                payments={viaPayments}
                isLoading={isLoading}
                onPaymentClick={setSelectedPayment}
                type="VIA"
              />
            </div>
          </div>
        </div>
      </main>

      {/* ✅ OPTIMIZACIÓN 6: Renderizado condicional de modales */}
      {/* ANTES: Todos los modales siempre en el DOM */}
      {/* AHORA: Solo se montan cuando están abiertos */}
      {isAddModalOpen && (
        <AddPaymentModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onInitialUpload={handleInitialUpload}
          onConfirmPayment={handleConfirmPayment}
          defaultType={paymentTypeToAdd}
        />
      )}
      
      {selectedPayment && (
        <PaymentDetailModal
          isOpen={!!selectedPayment}
          payment={selectedPayment}
          onClose={handleCloseDetailModal}
          onDeletePayment={handleDeletePaymentClick}
          onDownloadReceipt={handleDownloadReceipt}
          onChangeDateClick={handleOpenChangeDateModal}
        />
      )}
      
      {isChangeDateModalOpen && (
        <ChangePaymentDateModal
          isOpen={isChangeDateModalOpen}
          onClose={handleCloseChangeDateModal}
          onUpdateDate={handleUpdateDate}
          currentPayment={paymentToChangeDate}
        />
      )}
      
      {isStatementModalOpen && (
        <AddStatementModal
          isOpen={isStatementModalOpen}
          onClose={handleCloseStatementModal}
          onInitialUpload={handleInitialUpload}
          onConfirmPayment={handleConfirmPayment}
          defaultType={statementType}
        />
      )}
    </div>
  );
};

export default DashboardPage;
