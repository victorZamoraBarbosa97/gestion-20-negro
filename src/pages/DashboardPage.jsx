// src/pages/DashboardPage.jsx
import { useState, useMemo } from "react";
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

  // Todas las funciones 'handle' están correctas.
  const handlePrevWeek = () =>
    setCurrentWeekStartDate(
      (prev) => new Date(new Date(prev).setDate(prev.getDate() - 7))
    );
  const handleNextWeek = () =>
    setCurrentWeekStartDate(
      (prev) => new Date(new Date(prev).setDate(prev.getDate() + 7))
    );

  const handleOpenAddModal = (type) => {
    setPaymentTypeToAdd(type);
    setIsAddModalOpen(true);
  };

  const handleDeletePaymentClick = async (payment) => {
    await handleDeletePayment(payment.id, payment.storagePath);
    setSelectedPayment(null);
  };

  const handleOpenChangeDateModal = (payment) => {
    setSelectedPayment(null);
    setPaymentToChangeDate(payment);
    setIsChangeDateModalOpen(true);
  };

  const handleUpdateDate = async (paymentId, newDate) => {
    await handleUpdatePaymentDate(paymentId, newDate);
    setIsChangeDateModalOpen(false);
    setPaymentToChangeDate(null);
  };

  const handleOpenStatementModal = (type) => {
    setStatementType(type);
    setIsStatementModalOpen(true);
  };

  const handleViewStatementClick = (statement) => {
    if (statement) {
      setSelectedPayment(statement);
    }
  };

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
                      onClick={() =>
                        handleViewStatementClick(pronosticosStatement)
                      }
                      className="px-3 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg shadow-sm border border-slate-300 hover:bg-slate-50"
                    >
                      Ver Estado de Cuenta
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenStatementModal("PRONOSTICOS")}
                      className="px-3 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg shadow-sm border border-slate-300 hover:bg-slate-50"
                    >
                      Agregar Estado de Cuenta
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenAddModal("PRONOSTICOS")}
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
                    {isLoading
                      ? "..."
                      : pronosticosTotal.toLocaleString("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        })}
                  </p>
                </div>
                {hasPronosticosStatement && (
                  <div className="sm:text-right">
                    <h3 className="text-orange-600 text-xs sm:text-sm font-bold">
                      TOTAL ESTADO DE CUENTA
                    </h3>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
                      {pronosticosStatement.monthlyTotal?.toLocaleString(
                        "es-MX",
                        {
                          style: "currency",
                          currency: "MXN",
                        }
                      ) ?? "N/A"}
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
                      onClick={() => handleViewStatementClick(viaStatement)}
                      className="px-3 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg shadow-sm border border-slate-300 hover:bg-slate-50"
                    >
                      Ver Estado de Cuenta
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenStatementModal("VIA")}
                      className="px-3 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg shadow-sm border border-slate-300 hover:bg-slate-50"
                    >
                      Agregar Estado de Cuenta
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenAddModal("VIA")}
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
                    {isLoading
                      ? "..."
                      : viaTotal.toLocaleString("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        })}
                  </p>
                </div>
                {hasViaStatement && (
                  <div className="sm:text-right">
                    <h3 className="text-blue-600 text-xs sm:text-sm font-bold">
                      TOTAL ESTADO DE CUENTA
                    </h3>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
                      {viaStatement.monthlyTotal?.toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      }) ?? "N/A"}
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

      {/* Tus modales van aquí y no necesitan cambios */}
      <AddPaymentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onInitialUpload={handleInitialUpload}
        onConfirmPayment={handleConfirmPayment}
        defaultType={paymentTypeToAdd}
      />
      <PaymentDetailModal
        isOpen={!!selectedPayment}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onDeletePayment={handleDeletePaymentClick}
        onDownloadReceipt={handleDownloadReceipt}
        onChangeDateClick={handleOpenChangeDateModal}
      />
      <ChangePaymentDateModal
        isOpen={isChangeDateModalOpen}
        onClose={() => setIsChangeDateModalOpen(false)}
        onUpdateDate={handleUpdateDate}
        currentPayment={paymentToChangeDate}
      />
      <AddStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        onInitialUpload={handleInitialUpload}
        onConfirmPayment={handleConfirmPayment}
        defaultType={statementType}
      />
    </div>
  );
};

export default DashboardPage;
