// src/components/payments/ChangePaymentDateModal.jsx
import React, { useState, useEffect } from "react";

const ChangePaymentDateModal = ({
  isOpen,
  onClose,
  onUpdateDate,
  currentPayment,
}) => {
  const [newDate, setNewDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Carga la fecha actual del pago cuando el modal se abre
  useEffect(() => {
    if (isOpen && currentPayment && currentPayment.date) {
      // Formatea la fecha a 'YYYY-MM-DD' para el input type="date"
      const date = currentPayment.date;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Meses son 0-11
      const day = String(date.getDate()).padStart(2, "0");
      setNewDate(`${year}-${month}-${day}`);
    } else {
      setNewDate(""); // Limpiar si no hay pago o modal cerrado
    }
  }, [isOpen, currentPayment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate) {
      setError("Por favor, selecciona una fecha.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const [year, month, day] = newDate.split("-").map(Number);
      const dateToUpdate = new Date(year, month - 1, day);

      await onUpdateDate(currentPayment.id, dateToUpdate);
      handleClose();
    } catch (err) {
      console.error("Error al actualizar la fecha del pago:", err);
      setError("No se pudo actualizar la fecha. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewDate("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40" // Z-index más alto que otros modales
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-800">
              Cambiar Fecha del Pago
            </h3>
            <p className="text-sm text-slate-500">
              Selecciona la nueva fecha para este pago.
            </p>
          </div>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label
                htmlFor="new-payment-date"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nueva Fecha
              </label>
              <input
                type="date"
                id="new-payment-date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="p-4 bg-slate-50 rounded-b-xl flex justify-end items-center space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:bg-blue-300"
            >
              {isSubmitting ? "Guardando..." : "Guardar Fecha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePaymentDateModal;
