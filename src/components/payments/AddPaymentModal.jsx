// src/components/payments/AddPaymentModal.jsx
import React, { useState } from "react";
// No se importan iconos aquí, ya que el componente original no los usa directamente en su propio JSX

const AddPaymentModal = ({ isOpen, onClose, onAddPayment, defaultType }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, "");
    const parts = rawValue.split(".");
    if (parts.length > 2) return;
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formattedValue =
      parts[1] !== undefined ? `${integerPart}.${parts[1]}` : integerPart;
    setAmount(rawValue);
    setDisplayAmount(formattedValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !receiptFile) {
      setError("Por favor, completa todos los campos.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onAddPayment({ amount, receiptFile, type: defaultType });
      handleClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo añadir el pago. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setDisplayAmount("");
    setReceiptFile(null);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-800">
              Añadir Pago de {defaultType === "VIA" ? "VIA" : "Pronósticos"}
            </h3>
            <p className="text-sm text-slate-500">
              Completa los datos del depósito.
            </p>
          </div>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Monto
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  $
                </span>
                <input
                  type="text"
                  id="amount"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg"
                  inputMode="decimal"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="receipt"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Comprobante
              </label>
              <input
                type="file"
                id="receipt"
                onChange={(e) => setReceiptFile(e.target.files[0])}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
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
              {isSubmitting ? "Guardando..." : "Guardar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;
