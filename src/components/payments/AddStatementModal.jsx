// src/components/statements/AddStatementModal.jsx
import React, { useState, useEffect } from "react";

const AddStatementModal = ({
  isOpen,
  onClose,
  onInitialUpload,
  onConfirmPayment,
  defaultType,
}) => {
  // --- ESTADO INTERNO DEL MODAL ---
  const [modalStep, setModalStep] = useState("initial"); // 'initial', 'review', 'manual'
  const [monthlyTotal, setMonthlyTotal] = useState(""); // Almacena el monto numérico
  const [displayTotal, setDisplayTotal] = useState(""); // Almacena el monto formateado para mostrar
  const [receiptFile, setReceiptFile] = useState(null);
  const [paymentId, setPaymentId] = useState(null); // Guarda el ID del documento entre pasos
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Resetea el estado del modal cada vez que se abre
  useEffect(() => {
    if (isOpen) {
      setModalStep("initial");
      setMonthlyTotal("");
      setDisplayTotal("");
      setReceiptFile(null);
      setPaymentId(null);
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Maneja el cambio en el input de monto, formateándolo
  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, "");
    const parts = rawValue.split(".");
    if (parts.length > 2) return;
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formattedValue =
      parts[1] !== undefined ? `${integerPart}.${parts[1]}` : integerPart;
    setMonthlyTotal(rawValue);
    setDisplayTotal(formattedValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // --- LÓGICA DE PASOS ---
    if (modalStep === "initial") {
      if (!receiptFile) {
        setError("Por favor, selecciona un archivo.");
        setIsSubmitting(false);
        return;
      }
      // Llama a la primera función del hook (onInitialUpload)
      const result = await onInitialUpload({
        receiptFile,
        type: defaultType,
        submissionType: "STATEMENT", // Siempre es STATEMENT aquí
      });

      if (result.success) {
        // ÉXITO DE LA IA: Pasa al paso de revisión
        setPaymentId(result.paymentId);
        setMonthlyTotal(result.aiAmount.toString());
        setDisplayTotal(Number(result.aiAmount).toLocaleString("es-MX"));
        setModalStep("review");
      } else if (result.paymentId) {
        // FALLO DE LA IA: Pasa al paso de entrada manual
        setPaymentId(result.paymentId);
        setModalStep("manual");
      }
    } else if (modalStep === "review" || modalStep === "manual") {
      // Llama a la segunda función del hook para confirmar el monto
      await onConfirmPayment({
        paymentId,
        amount: monthlyTotal, // Usa el monto del estado
        submissionType: "STATEMENT",
      });
      onClose(); // Cierra el modal al finalizar
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-800">
              Estado de Cuenta de{" "}
              {defaultType === "VIA" ? "VIA" : "Pronósticos"}
            </h3>
            <p className="text-sm text-slate-500">
              {modalStep === "initial" &&
                "Sube el archivo para que sea procesado automáticamente."}
              {modalStep === "review" &&
                "La IA detectó este monto. Confirma o edítalo."}
              {modalStep === "manual" &&
                "Ingresa el monto total del estado de cuenta."}
            </p>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {/* --- RENDERIZADO CONDICIONAL DE INPUTS --- */}
            {(modalStep === "review" || modalStep === "manual") && (
              <div>
                <label
                  htmlFor="statement-amount"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Monto Total
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    $
                  </span>
                  <input
                    type="text"
                    id="statement-amount"
                    value={displayTotal}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg"
                    inputMode="decimal"
                    required
                  />
                </div>
              </div>
            )}
            {modalStep === "initial" && (
              <div>
                <label
                  htmlFor="statement-file"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Archivo del Estado de Cuenta
                </label>
                <input
                  type="file"
                  id="statement-file"
                  onChange={(e) => setReceiptFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                  required
                />
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="p-4 bg-slate-50 rounded-b-xl flex justify-end items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:bg-blue-300"
            >
              {isSubmitting
                ? "Procesando..."
                : modalStep === "initial"
                ? "Analizar con IA"
                : "Guardar Monto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStatementModal;
