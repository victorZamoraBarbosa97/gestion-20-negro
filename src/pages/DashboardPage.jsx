// src/pages/DashboardPage.jsx
import { useState, useMemo } from "react";
import { getStartOfWeek } from "../utils/dateHelpers";
import usePayments from "../hooks/usePayments";

// Importa los componentes (Header ya no es necesario aquí)
import WeekNavigator from "../components/navigation/WeekNavigator";
import PaymentList from "../components/payments/PaymentList";
import AddPaymentModal from "../components/payments/AddPaymentModal";
import PaymentDetailModal from "../components/payments/PaymentDetailModal";
import ChangePaymentDateModal from "../components/payments/ChangePaymentDateModal";

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

  const {
    isLoading,
    pronosticosPayments,
    viaPayments,
    pronosticosTotal,
    viaTotal,
    handleAddPayment,
    handleDeletePayment,
    handleDownloadReceipt,
    handleUpdatePaymentDate,
  } = usePayments(currentWeekStartDate, currentWeekEndDate);

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

  return (
    // El div principal ya no necesita min-h-screen o bg-slate-100/font-sans, lo manejará AppLayout
    <div>
      {/* El Header ya no se renderiza aquí directamente */}

      <main className="max-w-7xl mx-auto p-4 md:p-6 pt-20"> {/* Añadido pt-20 para espacio con Header */}
        <WeekNavigator
          currentWeekStartDate={currentWeekStartDate}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Columna de Pronósticos */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-orange-600 text-sm font-bold">
                  TOTAL PRONÓSTICOS
                </h3>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {isLoading
                    ? "..."
                    : pronosticosTotal.toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      })}
                </p>
              </div>
              <button
                onClick={() => handleOpenAddModal("PRONOSTICOS")}
                className="flex items-center px-3 py-2 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600"
              >
                + Añadir
              </button>
            </div>
            <PaymentList
              payments={pronosticosPayments}
              isLoading={isLoading}
              onPaymentClick={setSelectedPayment}
              type="PRONOSTICOS"
            />
          </div>

          {/* Columna de VIA */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-blue-600 text-sm font-bold">TOTAL VIA</h3>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {isLoading
                    ? "..."
                    : viaTotal.toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      })}
                </p>
              </div>
              <button
                onClick={() => handleOpenAddModal("VIA")}
                className="flex items-center px-3 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
              >
                + Añadir
              </button>
            </div>
            <PaymentList
              payments={viaPayments}
              isLoading={isLoading}
              onPaymentClick={setSelectedPayment}
              type="VIA"
            />
          </div>
        </div>
      </main>

      <AddPaymentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPayment={handleAddPayment}
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
    </div>
  );
};

export default DashboardPage;
