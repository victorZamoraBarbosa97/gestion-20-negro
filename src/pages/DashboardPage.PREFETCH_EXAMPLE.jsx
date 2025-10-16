// src/pages/DashboardPage.PREFETCH_EXAMPLE.jsx
// 📝 ESTE ES UN ARCHIVO DE EJEMPLO
// Muestra cómo agregar prefetch a DashboardPage
// NO ES NECESARIO IMPLEMENTARLO, es solo para referencia

// ✨ VERSIÓN CON PREFETCH DE REPORTSPAGE
import { useState, useMemo, useCallback } from "react";
import { getStartOfWeek } from "../utils/dateHelpers";
import usePayments from "../hooks/usePayments";
import usePrefetchRoute from "../hooks/usePrefetchRoute"; // ← NUEVO IMPORT

// Importa los componentes
import WeekNavigator from "../components/navigation/WeekNavigator";
import PaymentList from "../components/payments/PaymentList";
import AddPaymentModal from "../components/payments/AddPaymentModal";
import PaymentDetailModal from "../components/payments/PaymentDetailModal";
import ChangePaymentDateModal from "../components/payments/ChangePaymentDateModal";
import AddStatementModal from "../components/payments/AddStatementModal";

const DashboardPage = () => {
  // 🚀 PREFETCH: Precargar ReportsPage después de 2 segundos
  // Esto hace que la navegación a Reports sea instantánea
  usePrefetchRoute(() => import("../pages/ReportsPage"), {
    delay: 2000, // Esperar 2 segundos
    onIdle: true, // Solo cuando el navegador está idle
  });

  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(
    getStartOfWeek(new Date())
  );

  const currentWeekEndDate = useMemo(() => {
    const endDate = new Date(currentWeekStartDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  }, [currentWeekStartDate]);

  // ... resto del código igual que el DashboardPage original

  return (
    <div>
      <main className="max-w-7xl mx-auto p-4 md:p-6 pt-20">
        {/* ... contenido del dashboard ... */}
      </main>
    </div>
  );
};

export default DashboardPage;
