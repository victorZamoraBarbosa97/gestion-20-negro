// src/components/payments/AddPaymentModal.jsx
import { useState, useEffect } from "react";
import ReceiptCapture from "./ReceiptCapture";

const todayAsDateInputValue = () => new Date().toISOString().slice(0, 10);

const AddPaymentModal = ({
  isOpen,
  onClose,
  onInitialUpload,
  onConfirmPayment,
  defaultType,
}) => {
  // --- ESTADO INTERNO DEL MODAL ---
  const [modalStep, setModalStep] = useState("initial"); // 'initial', 'review', 'manual'
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [date, setDate] = useState(todayAsDateInputValue());
  const [receiptFile, setReceiptFile] = useState(null);
  const [paymentId, setPaymentId] = useState(null); // Guarda el ID entre pasos
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Resetea el modal cada vez que se abre
  useEffect(() => {
    if (isOpen) {
      setModalStep("initial");
      setAmount("");
      setDisplayAmount("");
      setDate(todayAsDateInputValue());
      setReceiptFile(null);
      setPaymentId(null);
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
    setIsSubmitting(true);
    setError("");

    // --- LÓGICA DE PASOS ---
    if (modalStep === "initial") {
      if (!receiptFile) {
        setError("Por favor, selecciona un archivo.");
        setIsSubmitting(false);
        return;
      }
      // Llama a la primera función del hook
      const result = await onInitialUpload({
        receiptFile,
        type: defaultType,
        submissionType: "PAYMENT",
      });

      if (result.success) {
        // IA ÉXITO: Pasa al paso de revisión
        setPaymentId(result.paymentId);
        setAmount(result.aiAmount.toString());
        setDisplayAmount(Number(result.aiAmount).toLocaleString("es-MX"));
        if (result.aiDate) setDate(result.aiDate);
        setModalStep("review");
      } else if (result.paymentId) {
        // IA FALLO: Pasa al paso de entrada manual
        setPaymentId(result.paymentId);
        setModalStep("manual");
      }
    } else if (modalStep === "review" || modalStep === "manual") {
      // Llama a la segunda función del hook para confirmar
      await onConfirmPayment({
        paymentId,
        amount,
        date,
        submissionType: "PAYMENT",
      });
      onClose(); // Cierra el modal al finalizar con éxito
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4 max-h-[90vh] overflow-y-auto transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Añadir Pago de Pronósticos
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              {modalStep === "initial" &&
                "Sube un comprobante para analizarlo con IA."}
              {modalStep === "review" &&
                "La IA detectó este monto. Confirma o edítalo."}
              {modalStep === "manual" &&
                "Ingresa el monto del pago manualmente."}
            </p>
          </div>
          <div className="p-6 space-y-4">
            {/* --- RENDERIZADO CONDICIONAL DE INPUTS --- */}
            {(modalStep === "review" || modalStep === "manual") && (
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
                >
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 dark:text-gray-400">
                    $
                  </span>
                  <input
                    type="text"
                    id="amount"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    inputMode="decimal"
                    required
                  />
                </div>
              </div>
            )}
            {(modalStep === "review" || modalStep === "manual") && (
              <div>
                <label
                  htmlFor="payment-date"
                  className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
                >
                  Fecha del comprobante
                </label>
                <input
                  type="date"
                  id="payment-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={todayAsDateInputValue()}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
                  required
                />
              </div>
            )}
            {modalStep === "initial" && (
              <div>
                <ReceiptCapture onFileReady={setReceiptFile} label="Comprobante" />
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-b-xl flex justify-end items-center space-x-3 border-t border-slate-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-700 dark:text-gray-200 bg-slate-200 dark:bg-gray-600 hover:bg-slate-300 dark:hover:bg-gray-500 rounded-lg font-semibold transition-colors"
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

export default AddPaymentModal;
