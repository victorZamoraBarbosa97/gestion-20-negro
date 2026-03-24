// src/pages/DashboardPage.jsx
import useDashboardController from "../hooks/useDashboardController";
import NotificationBanner from "../components/navigation/NotificationBanner";
import WeekNavigator from "../components/navigation/WeekNavigator";
import { PaymentSection, DashboardModals } from "../components/dashboard";

const DashboardPage = () => {
  // Extraemos toda la lógica del hook controlador
  const {
    currentWeekStartDate,
    notifications,
    isLoading,
    pronosticosPayments,
    viaPayments,
    pronosticosTotal,
    viaTotal,
    pronosticosStatement,
    viaStatement,
    hasPronosticosStatement,
    hasViaStatement,
    modalsState,
    businessActions,
    uiHandlers,
  } = useDashboardController();

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-100 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto p-4 md:p-6 pt-20 text-slate-800 dark:text-gray-100">
        <NotificationBanner notifications={notifications} />

        <div className="flex flex-col md:flex-row justify-center items-center mb-6 gap-4">
          <WeekNavigator
            currentWeekStartDate={currentWeekStartDate}
            onPrevWeek={uiHandlers.handlePrevWeek}
            onNextWeek={uiHandlers.handleNextWeek}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          {/* --- SECCIÓN PRONÓSTICOS --- */}
          <PaymentSection
            title="PRONÓSTICOS"
            subtitle="ESTADO DE CUENTA"
            totalAmount={pronosticosTotal}
            statementAmount={pronosticosStatement?.monthlyTotal}
            hasStatement={hasPronosticosStatement}
            payments={pronosticosPayments}
            isLoading={isLoading}
            onPaymentClick={uiHandlers.setSelectedPayment}
            onAddPayment={uiHandlers.openPronosticosAdd}
            onViewStatement={uiHandlers.viewPronosticosStatement}
            onAddStatement={uiHandlers.openPronosticosStatementAdd}
            type="PRONOSTICOS"
            colorTheme="orange"
          />

          {/* --- SECCIÓN VIA --- */}
          <PaymentSection
            title="BIMBONET"
            subtitle="ESTADO DE CUENTA"
            totalAmount={viaTotal}
            statementAmount={viaStatement?.monthlyTotal}
            hasStatement={hasViaStatement}
            payments={viaPayments}
            isLoading={isLoading}
            onPaymentClick={uiHandlers.setSelectedPayment}
            onAddPayment={uiHandlers.openViaAdd}
            onViewStatement={uiHandlers.viewViaStatement}
            onAddStatement={uiHandlers.openViaStatementAdd}
            type="VIA"
            colorTheme="blue"
          />
        </div>
      </main>

      <DashboardModals
        // Estados (spread del objeto modalsState)
        {...modalsState}
        // Handlers
        onCloseAddModal={uiHandlers.handleCloseAddModal}
        onCloseDetailModal={uiHandlers.handleCloseDetailModal}
        onCloseChangeDateModal={uiHandlers.handleCloseChangeDateModal}
        onCloseStatementModal={uiHandlers.handleCloseStatementModal}
        onDeletePayment={uiHandlers.handleDeletePaymentClick}
        onChangeDateClick={uiHandlers.handleOpenChangeDateModal}
        onUpdateDate={uiHandlers.handleUpdateDate}
        // Business Actions
        onInitialUpload={businessActions.handleInitialUpload}
        onConfirmPayment={businessActions.handleConfirmPayment}
        onDownloadReceipt={businessActions.handleDownloadReceipt}
      />
    </div>
  );
};

export default DashboardPage;
