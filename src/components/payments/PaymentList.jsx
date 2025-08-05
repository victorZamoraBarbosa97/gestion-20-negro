// src/components/payments/PaymentList.jsx
import React from "react";
import PaymentListItem from "./PaymentListItem";

const PaymentList = ({ payments, isLoading, onPaymentClick, type }) => {
  const typeName = type === "PRONOSTICOS" ? "pronósticos" : "VIA";

  return (
    <div className="space-y-2 pt-2 border-t border-slate-200">
      <h4 className="text-sm font-semibold text-slate-600 pb-1">
        Pagos de la semana:
      </h4>
      {isLoading ? (
        <p className="text-slate-500 text-sm">Cargando pagos...</p>
      ) : payments.length > 0 ? (
        payments.map((p) => (
          <PaymentListItem
            key={p.id}
            payment={p}
            onClick={() => onPaymentClick(p)}
          />
        ))
      ) : (
        <p className="text-slate-500 text-sm text-center py-4">
          No hay pagos de {typeName} esta semana.
        </p>
      )}
    </div>
  );
};

export default PaymentList;
