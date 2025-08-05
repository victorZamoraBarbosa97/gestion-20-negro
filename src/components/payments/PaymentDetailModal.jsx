// src/components/payments/PaymentDetailModal.jsx
import React from "react";
import { TrashIcon, DownloadIcon, BaselineCalendarMonth } from "../ui/Icons"; // Corregido el nombre del icono

const PaymentDetailModal = ({
  isOpen,
  payment,
  onClose,
  onDeletePayment,
  onDownloadReceipt,
  onChangeDateClick,
}) => {
  if (!isOpen || !payment) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800">Detalle del Pago</h3>
          <p className="text-sm text-slate-500">
            {payment.date.toLocaleString("es-MX", {
              dateStyle: "full",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="p-6 flex-grow overflow-y-auto max-h-[60vh]">
          <img
            src={payment.receiptUrl}
            alt="Comprobante de pago"
            className="rounded-lg w-full h-auto"
          />
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <p className="text-3xl font-bold text-center text-slate-800">
            {payment.amount.toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}
          </p>
        </div>

        {/* Sección de botones: Todos en una fila, altura ampliada, uniformes */}
        <div className="p-4 bg-slate-50 rounded-b-xl flex flex-row items-stretch justify-center sm:justify-end gap-2 sm:gap-3">
          {/* Botones de acción */}
          <button
            onClick={() => onChangeDateClick(payment)}
            className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm text-purple-600 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold flex-1 min-w-[75px] max-w-[100px] h-auto" // flex-1, min/max-width, h-auto
          >
            <BaselineCalendarMonth className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
            <span className="text-center leading-tight">
              Cambiar Fecha
            </span>{" "}
            {/* Permitir salto de línea */}
          </button>

          <button
            onClick={() =>
              onDownloadReceipt(payment.receiptUrl, payment.storagePath)
            }
            className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg font-semibold flex-1 min-w-[75px] max-w-[100px] h-auto"
          >
            <DownloadIcon className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
            <span className="text-center leading-tight">Descargar</span>
          </button>

          <button
            onClick={() => onDeletePayment(payment)}
            className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm text-red-600 bg-red-100 hover:bg-red-200 rounded-lg font-semibold flex-1 min-w-[75px] max-w-[100px] h-auto"
          >
            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
            <span className="text-center leading-tight">Eliminar</span>
          </button>

          {/* Botón Cerrar - ahora también uniforme */}
          <button
            onClick={onClose}
            className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold flex-1 min-w-[75px] max-w-[100px] h-auto"
          >
            <span className="block text-center leading-tight">Cerrar</span>{" "}
            {/* Usar block para la uniformidad con los otros botones */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;
