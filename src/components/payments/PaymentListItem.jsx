// src/components/payments/PaymentListItem.jsx

import React, { useMemo, useCallback } from "react";
import { ChevronRightIcon } from "../ui/Icons";

const PaymentListItem = ({ payment, onClick }) => {
  // Solo cuando payment.amount cambia
  const formattedAmount = useMemo(() => {
    if (payment.amount === 0) {
      return null; // No formatear si es 0
    }
    return payment.amount.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  }, [payment.amount]);

  //  Solo cuando payment.date cambia
  const formattedDate = useMemo(() => {
    return payment.date.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
    });
  }, [payment.date]);

  const handleClick = useCallback(() => {
    onClick(payment);
  }, [onClick, payment]);

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center"
    >
      <div>
        {payment.amount === 0 ? (
          <p className="font-semibold text-indigo-600">Estado de Cuenta</p>
        ) : (
          <p className="font-bold text-slate-800">{formattedAmount}</p>
        )}
        <p className="text-xs text-slate-500">{formattedDate}</p>
      </div>
      <ChevronRightIcon />
    </button>
  );
};

// ASolo se re-renderiza si payment u onClick cambiaron
export default React.memo(PaymentListItem, (prevProps, nextProps) => {
  // Comparación custom para máxima eficiencia

  // Si onClick cambió (debería ser estable con useCallback), re-renderizar
  if (prevProps.onClick !== nextProps.onClick) {
    return false;
  }

  // Comparar las propiedades relevantes del payment
  const prev = prevProps.payment;
  const next = nextProps.payment;

  // Si el ID cambió, es un payment diferente, re-renderizar
  if (prev.id !== next.id) {
    return false;
  }

  // Si el monto cambió, re-renderizar
  if (prev.amount !== next.amount) {
    return false;
  }

  // Si la fecha cambió, re-renderizar
  // Comparar el timestamp para evitar problemas con objetos Date
  if (prev.date?.getTime() !== next.date?.getTime()) {
    return false;
  }

  // Si el status cambió, re-renderizar (si existe esta propiedad)
  if (prev.status !== next.status) {
    return false;
  }

  // Si llegamos aquí, NO debe re-renderizar
  return true;
});
