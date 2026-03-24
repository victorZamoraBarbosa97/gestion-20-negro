// src/hooks/useNotifications.js
// Hook para Sistema de Notificaciones
import { useState, useEffect, useMemo } from "react";
import { differenceInDays, startOfWeek } from "date-fns";

const useNotifications = ({
  payments,
  pronosticosStatement,
  viaStatement,
  pronosticosTotal,
  viaTotal,
  currentWeekStartDate,
}) => {
  const [notifications, setNotifications] = useState([]);

  const CONFIG = {
    DIFFERENCE_THRESHOLD: 2000,
    NO_ACTIVITY_DAYS: 3,
    MISSING_STATEMENT_DAYS: 7,
  };

  useEffect(() => {
    const alerts = [];
    const now = new Date();

    // Alerta: Estado de cuenta Pronósticos faltante
    if (!pronosticosStatement) {
      const weekStart = startOfWeek(currentWeekStartDate, { weekStartsOn: 4 });
      const daysSinceWeekStart = differenceInDays(now, weekStart);

      if (daysSinceWeekStart >= CONFIG.MISSING_STATEMENT_DAYS) {
        alerts.push({
          id: "missing-pronosticos-statement",
          type: "critical",
          category: "estado_cuenta",
          title: "Estado de Cuenta Pronósticos Faltante",
          message: `Lleva ${daysSinceWeekStart} días sin subir el estado de cuenta`,
          action: "Subir Estado de Cuenta",
          timestamp: now,
        });
      }
    }

    // Alerta: Diferencia grande Pronósticos
    if (pronosticosStatement?.monthlyTotal) {
      const difference = Math.abs(
        pronosticosTotal - pronosticosStatement.monthlyTotal
      );

      if (difference >= CONFIG.DIFFERENCE_THRESHOLD) {
        const isOver = pronosticosTotal > pronosticosStatement.monthlyTotal;
        alerts.push({
          id: "pronosticos-difference",
          type: "warning",
          category: "diferencia",
          title: "Diferencia Grande en Pronósticos",
          message: `Los pagos están ${
            isOver ? "arriba" : "abajo"
          } del estado de cuenta por $${difference.toLocaleString("es-MX")}`,
          timestamp: now,
        });
      }
    }

    setNotifications(alerts);
  }, [
    payments,
    pronosticosStatement,
    viaStatement,
    pronosticosTotal,
    viaTotal,
    currentWeekStartDate,
  ]);

  const stats = useMemo(() => {
    const criticalCount = notifications.filter(
      (n) => n.type === "critical"
    ).length;
    const warningCount = notifications.filter(
      (n) => n.type === "warning"
    ).length;
    const hasAlerts = criticalCount > 0 || warningCount > 0;

    return {
      criticalCount,
      warningCount,
      hasAlerts,
      totalCount: notifications.length,
    };
  }, [notifications]);

  return {
    notifications,
    ...stats,
  };
};

export default useNotifications;
