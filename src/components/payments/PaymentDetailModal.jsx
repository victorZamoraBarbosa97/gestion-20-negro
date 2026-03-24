// src/components/payments/PaymentDetailModal.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { TrashIcon, DownloadIcon, BaselineCalendarMonth } from "../ui/Icons";

const PaymentDetailModal = ({
  isOpen,
  payment,
  onClose,
  onDeletePayment,
  onDownloadReceipt,
  onChangeDateClick,
}) => {
  const { currentUser } = useAuth();
  const isGuest = currentUser?.isAnonymous;

  if (!isOpen || !payment) return null;

  // --- INICIO DE LA LÓGICA CONDICIONAL ---

  // Determina si es un estado de cuenta para usar los campos y textos correctos.
  const isStatement = payment.amount === 0;

  // Elige el monto a mostrar. Si es un pago, usa 'amount'; si es un statement, usa 'monthlyTotal'.
  // Se añade '|| 0' como fallback por si el campo no existiera.
  const amountToShow = isStatement
    ? payment.monthlyTotal || 0
    : payment.amount || 0;

  // Elige el título del modal.
  const modalTitle = isStatement
    ? "Detalle del Estado de Cuenta"
    : "Detalle del Pago";

  // --- FIN DE LA LÓGICA CONDICIONAL ---

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-auto flex flex-col transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-gray-700">
          {/* Título dinámico */}
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            {modalTitle}
          </h3>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            {/* El campo de fecha puede variar, usamos optional chaining por seguridad */}
            {payment.date?.toLocaleString("es-MX", {
              dateStyle: "full",
              timeStyle: "short",
            }) ?? "Fecha no disponible"}
          </p>
        </div>
        <div className="p-6 flex-grow overflow-y-auto max-h-[60vh]">
          {isGuest ? (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <span className="text-4xl mb-2">🔒</span>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Vista de Invitado
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Imagen oculta por privacidad
              </p>
            </div>
          ) : (
            <img
              src={payment.receiptUrl}
              alt="Comprobante"
              className="rounded-lg w-full h-auto"
            />
          )}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-gray-900/50 border-t border-slate-200 dark:border-gray-700">
          <p className="text-3xl font-bold text-center text-slate-800 dark:text-white">
            {/* Monto dinámico */}
            {amountToShow.toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}
          </p>
        </div>

        {/* Sección de botones */}
        <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-b-xl flex flex-row items-stretch justify-center sm:justify-end gap-2 sm:gap-3">
          {/* El botón de cambiar fecha no debería aparecer para un estado de cuenta */}
          {!isStatement && (
            <button
              onClick={() => onChangeDateClick(payment)}
              className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-lg font-semibold flex-1 min-w-[75px] max-w-[100px] h-auto transition-colors"
            >
              <BaselineCalendarMonth className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
              <span className="text-center leading-tight">Cambiar Fecha</span>
            </button>
          )}

          <button
            onClick={() =>
              onDownloadReceipt(payment.receiptUrl, payment.storagePath)
            }
            className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg font-semibold flex-1 min-w-[75px] max-w-[100px] h-auto transition-colors"
          >
            <DownloadIcon className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
            <span className="text-center leading-tight">Descargar</span>
          </button>

          <button
            onClick={() => onDeletePayment(payment)}
            className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-semibold flex-1 min-w-[75px] max-w-[100px] h-auto transition-colors"
          >
            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
            <span className="text-center leading-tight">Eliminar</span>
          </button>

          <button
            onClick={onClose}
            className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm text-slate-700 dark:text-gray-300 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 rounded-lg font-semibold flex-1 min-w-[75px] max-w-[100px] h-auto transition-colors"
          >
            <span className="block text-center leading-tight">Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;
