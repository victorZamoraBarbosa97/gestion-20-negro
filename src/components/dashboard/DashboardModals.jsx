// d:\Proyectos\Gestion-20-Negro\frontend\gestion-20-negro\src\components\dashboard\DashboardModals.jsx
import React from "react";
import AddPaymentModal from "../payments/AddPaymentModal";
import PaymentDetailModal from "../payments/PaymentDetailModal";
import ChangePaymentDateModal from "../payments/ChangePaymentDateModal";
import AddStatementModal from "../payments/AddStatementModal";

const DashboardModals = ({
  // Estados de visibilidad
  isAddModalOpen,
  isChangeDateModalOpen,
  isStatementModalOpen,
  selectedPayment,

  // Datos específicos
  paymentTypeToAdd,
  paymentToChangeDate,
  statementType,

  // Handlers (Callbacks)
  onCloseAddModal,
  onCloseDetailModal,
  onCloseChangeDateModal,
  onCloseStatementModal,

  onInitialUpload,
  onConfirmPayment,
  onDeletePayment,
  onDownloadReceipt,
  onChangeDateClick, // Abre el modal de cambiar fecha
  onUpdateDate, // Ejecuta la actualización
}) => {
  return (
    <>
      {isAddModalOpen && (
        <AddPaymentModal
          isOpen={isAddModalOpen}
          onClose={onCloseAddModal}
          onInitialUpload={onInitialUpload}
          onConfirmPayment={onConfirmPayment}
          defaultType={paymentTypeToAdd}
        />
      )}

      {selectedPayment && (
        <PaymentDetailModal
          isOpen={!!selectedPayment}
          payment={selectedPayment}
          onClose={onCloseDetailModal}
          onDeletePayment={onDeletePayment}
          onDownloadReceipt={onDownloadReceipt}
          onChangeDateClick={onChangeDateClick}
        />
      )}

      {isChangeDateModalOpen && (
        <ChangePaymentDateModal
          isOpen={isChangeDateModalOpen}
          onClose={onCloseChangeDateModal}
          onUpdateDate={onUpdateDate}
          currentPayment={paymentToChangeDate}
        />
      )}

      {isStatementModalOpen && (
        <AddStatementModal
          isOpen={isStatementModalOpen}
          onClose={onCloseStatementModal}
          onInitialUpload={onInitialUpload}
          onConfirmPayment={onConfirmPayment}
          defaultType={statementType}
        />
      )}
    </>
  );
};

export default React.memo(DashboardModals);
