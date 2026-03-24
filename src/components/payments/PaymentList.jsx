// src/components/payments/PaymentList.jsx
// ✨ VERSIÓN OPTIMIZADA CON REACT.MEMO

import React, { useMemo, useCallback } from "react";
import PaymentListItem from "./PaymentListItem";

const PaymentList = ({ payments, isLoading, onPaymentClick, type }) => {
  // Solo se recalcula si 'type' cambia
  const typeName = useMemo(() => {
    return type === "PRONOSTICOS" ? "pronósticos" : "VIA";
  }, [type]);

  const handleItemClick = useCallback(
    (payment) => {
      onPaymentClick(payment);
    },
    [onPaymentClick],
  );

  // Memoizar el mensaje "sin pagos"
  const emptyMessage = useMemo(() => {
    return `No hay pagos de ${typeName} esta semana.`;
  }, [typeName]);

  return (
    <div className="space-y-2 pt-2 border-t border-slate-200">
      <h4 className="text-sm font-semibold text-slate-600 pb-1">
        Pagos de la semana:
      </h4>
      {isLoading ? (
        <p className="text-slate-500 text-sm">Cargando pagos...</p>
      ) : payments.length > 0 ? (
        payments.map((p) => (
          <PaymentListItem key={p.id} payment={p} onClick={handleItemClick} />
        ))
      ) : (
        <p className="text-slate-500 text-sm text-center py-4">
          {emptyMessage}
        </p>
      )}
    </div>
  );
};

// Solo se re-renderiza si las props cambiaron
export default React.memo(PaymentList, (prevProps, nextProps) => {
  // Comparación personalizada para optimización máxima
  // Retorna true si NO debe re-renderizar, false si SÍ debe re-renderizar

  // Si loading state cambió, debe re-renderizar
  if (prevProps.isLoading !== nextProps.isLoading) {
    return false;
  }

  // Si type cambió, debe re-renderizar
  if (prevProps.type !== nextProps.type) {
    return false;
  }

  // Si el número de payments cambió, debe re-renderizar
  if (prevProps.payments.length !== nextProps.payments.length) {
    return false;
  }

  // Comparación superficial de IDs de payments
  // Si algún ID cambió, debe re-renderizar
  const prevIds = prevProps.payments.map((p) => p.id).join(",");
  const nextIds = nextProps.payments.map((p) => p.id).join(",");
  if (prevIds !== nextIds) {
    return false;
  }

  // Comparar si algún payment cambió (monto, fecha, etc.)
  for (let i = 0; i < prevProps.payments.length; i++) {
    const prev = prevProps.payments[i];
    const next = nextProps.payments[i];

    if (
      prev.amount !== next.amount ||
      prev.paymentDate !== next.paymentDate ||
      prev.status !== next.status
    ) {
      return false;
    }
  }

  // Si llegamos aquí, NO debe re-renderizar
  return true;
});
