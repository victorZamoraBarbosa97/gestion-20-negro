// d:\Proyectos\Gestion-20-Negro\frontend\gestion-20-negro\src\components\dashboard\PaymentSection.jsx
import React from "react";
import PaymentList from "../payments/PaymentList";

const PaymentSection = ({
  title,
  subtitle,
  totalAmount,
  statementAmount,
  hasStatement,
  payments,
  isLoading,
  onPaymentClick,
  onAddPayment,
  onViewStatement,
  onAddStatement,
  type, // "PRONOSTICOS" | "VIA"
  colorTheme = "orange", // "orange" | "blue"
}) => {
  // Definición de colores dinámicos basados en el tema
  const colors = {
    orange: {
      text: "text-orange-600 dark:text-orange-400",
      button: "bg-orange-500 hover:bg-orange-600",
    },
    blue: {
      text: "text-blue-600 dark:text-blue-400",
      button: "bg-blue-600 hover:bg-blue-700",
    },
  }[colorTheme];

  const formattedTotal = totalAmount.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  const formattedStatementTotal =
    statementAmount?.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    }) ?? "N/A";

  return (
    <div className="space-y-3">
      {/* Botones de Acción */}
      <div className="flex justify-center items-center gap-3 h-10">
        {isLoading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <>
            {hasStatement ? (
              <button
                onClick={onViewStatement}
                className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-300 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                Ver Estado de Cuenta
              </button>
            ) : (
              <button
                onClick={onAddStatement}
                className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-300 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                Agregar Estado de Cuenta
              </button>
            )}
            <button
              onClick={onAddPayment}
              className={`flex items-center px-3 py-2 text-white font-semibold rounded-lg shadow-md ${colors.button}`}
            >
              Agregar Pago
            </button>
          </>
        )}
      </div>

      {/* Tarjeta de Resumen y Lista */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm p-6 space-y-4 transition-colors">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <h3
              className={`${colors.text} text-xs sm:text-sm font-bold uppercase`}
            >
              TOTAL {title}
            </h3>
            <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mt-1">
              {isLoading ? "..." : formattedTotal}
            </p>
          </div>
          {hasStatement && (
            <div className="sm:text-right">
              <h3
                className={`${colors.text} text-xs sm:text-sm font-bold uppercase`}
              >
                TOTAL {subtitle}
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mt-1">
                {formattedStatementTotal}
              </p>
            </div>
          )}
        </div>

        <PaymentList
          payments={payments}
          isLoading={isLoading}
          onPaymentClick={onPaymentClick}
          type={type}
        />
      </div>
    </div>
  );
};

export default React.memo(PaymentSection);
