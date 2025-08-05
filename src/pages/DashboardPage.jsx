// src/pages/DashboardPage.jsx
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { AuthContext } from "../context/AuthContext";

// Importa los componentes y hooks refactorizados
import Header from "../components/navigation/Header";
import WeekNavigator from "../components/navigation/WeekNavigator";
import PaymentList from "../components/payments/PaymentList";
import AddPaymentModal from "../components/payments/AddPaymentModal";
import PaymentDetailModal from "../components/payments/PaymentDetailModal";
import ChangePaymentDateModal from "../components/payments/ChangePaymentDateModal"; // Importa el nuevo modal

// Importa los helpers de fecha para el estado inicial
import { getStartOfWeek } from "../utils/dateHelpers";

// Importa el custom hook
import usePayments from "../hooks/usePayments";

const DashboardPage = () => {
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(
    getStartOfWeek(new Date())
  );
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChangeDateModalOpen, setIsChangeDateModalOpen] = useState(false); // Nuevo estado para el modal de cambio de fecha
  const [paymentToChangeDate, setPaymentToChangeDate] = useState(null); // Estado para el pago a cambiar de fecha
  const [paymentTypeToAdd, setPaymentTypeToAdd] = useState("PRONOSTICOS");

  // Usar el custom hook para la lógica de pagos
  const {
    isLoading,
    pronosticosPayments,
    viaPayments,
    pronosticosTotal,
    viaTotal,
    handleAddPayment,
    handleDeletePayment,
    handleDownloadReceipt,
    handleUpdatePaymentDate, // Importa la nueva función del hook
  } = usePayments(currentWeekStartDate);

  const handleLogout = () => signOut(auth);
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
    if (
      window.confirm(
        `¿Seguro que quieres eliminar el pago de ${payment.amount.toLocaleString(
          "es-MX",
          { style: "currency", currency: "MXN" }
        )}?`
      )
    ) {
      try {
        await handleDeletePayment(payment.id, payment.storagePath);
        setSelectedPayment(null); // Cierra el modal de detalle después de eliminar
      } catch (error) {
        console.error("Error al eliminar el pago desde Dashboard:", error);
        alert("No se pudo eliminar el pago.");
      }
    }
  };

  // Función para abrir el modal de cambio de fecha
  const handleOpenChangeDateModal = (payment) => {
    setSelectedPayment(null); // Cierra el modal de detalle primero
    setPaymentToChangeDate(payment);
    setIsChangeDateModalOpen(true);
  };

  // Función para manejar la actualización de fecha desde el modal
  const handleUpdateDate = async (paymentId, newDate) => {
    try {
      await handleUpdatePaymentDate(paymentId, newDate);
      // Opcional: Si la nueva fecha cae en una semana diferente, podrías querer navegar a esa semana.
      // Pero dado que getPaymentsForWeek ya tiene un listener, se actualizará automáticamente.
    } catch (error) {
      console.log("🚀 ~ handleUpdateDate ~ error:", error);
    } finally {
      setIsChangeDateModalOpen(false); // Cerrar el modal después de la actualización
      setPaymentToChangeDate(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Header onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <WeekNavigator
          currentWeekStartDate={currentWeekStartDate}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        onChangeDateClick={handleOpenChangeDateModal} // Pasa la nueva función
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
