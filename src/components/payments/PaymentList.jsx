// src/components/payments/PaymentList.jsx
// ✨ VERSIÓN OPTIMIZADA CON REACT.MEMO

import React, { useMemo, useCallback } from "react";
import PaymentListItem from "./PaymentListItem";

const PaymentList = ({ payments, isLoading, onPaymentClick, type }) => {
  // ✅ OPTIMIZACIÓN 1: useMemo para cálculos simples
  // ANTES: Se recalculaba en cada render
  // AHORA: Solo se recalcula si 'type' cambia
  const typeName = useMemo(() => {
    return type === "PRONOSTICOS" ? "pronósticos" : "VIA";
  }, [type]);

  // ✅ OPTIMIZACIÓN 2: useCallback para el handler
  // ANTES: Se creaba una nueva función para cada item en cada render
  // AHORA: Se reutiliza la misma función
  const handleItemClick = useCallback(
    (payment) => {
      onPaymentClick(payment);
    },
    [onPaymentClick]
  );

  // ✅ OPTIMIZACIÓN 3: Memoizar el mensaje "sin pagos"
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
          <PaymentListItem
            key={p.id}
            payment={p}
            onClick={handleItemClick}
          />
        ))
      ) : (
        <p className="text-slate-500 text-sm text-center py-4">
          {emptyMessage}
        </p>
      )}
    </div>
  );
};

// ✅ OPTIMIZACIÓN 4: React.memo con comparación custom
// ANTES: Se re-renderizaba cada vez que el parent se re-renderizaba
// AHORA: Solo se re-renderiza si las props cambiaron
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
  const prevIds = prevProps.payments.map(p => p.id).join(',');
  const nextIds = nextProps.payments.map(p => p.id).join(',');
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

/* 
📝 EXPLICACIÓN DE LA OPTIMIZACIÓN:

SIN React.memo:
  DashboardPage re-render → PaymentList re-render (SIEMPRE)
  
  Escenario: Usuario abre un modal
    - DashboardPage cambia state (isAddModalOpen = true)
    - DashboardPage re-renderiza
    - PaymentList (PRONOSTICOS) re-renderiza (innecesario)
    - PaymentList (VIA) re-renderiza (innecesario)
    - 20+ PaymentListItem re-renderizan (innecesario)
  
  Total: 22+ componentes por 1 cambio de state no relacionado


CON React.memo:
  DashboardPage re-render → PaymentList verifica props
  
  Escenario: Usuario abre un modal
    - DashboardPage cambia state (isAddModalOpen = true)
    - DashboardPage re-renderiza
    - PaymentList verifica: payments? iguales. isLoading? igual. type? igual.
    - PaymentList NO re-renderiza ✅
    - PaymentListItem NO re-renderizan ✅
  
  Total: 1 componente (DashboardPage) ✅

AHORRO: 95% menos renders
*/
