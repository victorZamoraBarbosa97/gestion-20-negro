import { useState, useMemo, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  getWeek,
  format,
  parseISO,
  isValid,
  subMonths,
  addMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import usePayments from "./usePayments";

// Colores para el gráfico, usando las claves exactas que esperamos en los datos
const COLORS = {
  PRONÓSTICOS: "#EA580C", // orange-600
  VÍA: "#2563EB", // blue-600
};

// Opciones para date-fns para que la semana empiece en Jueves (4)
const DATE_FNS_OPTIONS = { locale: es, weekStartsOn: 4 }; // 4 = Jueves

const useReportsController = () => {
  // --- ESTADOS DE FILTROS ---
  const [displayMonth, setDisplayMonth] = useState(new Date());

  const initialStartDate = useMemo(
    () => startOfWeek(new Date(), DATE_FNS_OPTIONS),
    [],
  );
  const initialEndDate = useMemo(
    () => endOfWeek(new Date(), DATE_FNS_OPTIONS),
    [],
  );

  const [customStartDate, setCustomStartDate] = useState(
    format(initialStartDate, "yyyy-MM-dd"),
  );
  const [customEndDate, setCustomEndDate] = useState(
    format(initialEndDate, "yyyy-MM-dd"),
  );

  // --- CÁLCULO DE FECHAS FINALES ---
  const finalStartDate = useMemo(() => {
    const parsedDate = parseISO(customStartDate);
    return isValid(parsedDate)
      ? startOfWeek(parsedDate, DATE_FNS_OPTIONS)
      : startOfWeek(startOfMonth(displayMonth), DATE_FNS_OPTIONS);
  }, [customStartDate, displayMonth]);

  const finalEndDate = useMemo(() => {
    const parsedDate = parseISO(customEndDate);
    const date = isValid(parsedDate)
      ? endOfWeek(parsedDate, DATE_FNS_OPTIONS)
      : endOfWeek(endOfMonth(displayMonth), DATE_FNS_OPTIONS);
    return new Date(date.setHours(23, 59, 59, 999));
  }, [customEndDate, displayMonth]);

  // --- OBTENCIÓN DE DATOS ---
  const { payments, isLoading, pronosticosTotal, viaTotal } = usePayments(
    finalStartDate,
    finalEndDate,
  );

  // --- PROCESAMIENTO DE DATOS PARA GRÁFICOS (MEMOIZADO) ---
  const weeklyChartData = useMemo(() => {
    if (!payments) return [];

    const dataMap = new Map();

    let currentWeekStart = startOfWeek(finalStartDate, DATE_FNS_OPTIONS);
    const intervalEndLimit = endOfWeek(finalEndDate, DATE_FNS_OPTIONS);

    while (currentWeekStart <= intervalEndLimit) {
      const weekNumber = getWeek(currentWeekStart, DATE_FNS_OPTIONS);
      const weekEnd = addWeeks(currentWeekStart, 1);
      weekEnd.setDate(weekEnd.getDate() - 1);

      const mapKey = format(currentWeekStart, "yyyy-MM-dd");
      const displayLabel = `Semana ${weekNumber} (${format(
        currentWeekStart,
        "dd/MM/yyyy",
        DATE_FNS_OPTIONS,
      )} - ${format(weekEnd, "dd/MM/yyyy", DATE_FNS_OPTIONS)})`;

      dataMap.set(mapKey, {
        name: displayLabel,
        PRONÓSTICOS: 0,
        VÍA: 0,
        sortKey: weekNumber,
      });
      currentWeekStart = addWeeks(currentWeekStart, 1);
    }

    payments.forEach((payment) => {
      let normalizedType = payment.type?.toUpperCase();
      if (normalizedType === "PRONOSTICOS") normalizedType = "PRONÓSTICOS";
      if (normalizedType !== "PRONÓSTICOS" && normalizedType !== "VÍA") return;

      const paymentWeekStart = startOfWeek(payment.date, DATE_FNS_OPTIONS);
      const paymentWeekKey = format(paymentWeekStart, "yyyy-MM-dd");

      if (dataMap.has(paymentWeekKey)) {
        dataMap.get(paymentWeekKey)[normalizedType] +=
          Number(payment.amount) || 0;
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [payments, finalStartDate, finalEndDate]);

  const pieChartData = useMemo(
    () => [
      {
        name: "PRONÓSTICOS",
        value: pronosticosTotal,
        color: COLORS["PRONÓSTICOS"],
      },
      { name: "VÍA", value: viaTotal, color: COLORS["VÍA"] },
    ],
    [pronosticosTotal, viaTotal],
  );

  // --- HANDLERS (MEMOIZADOS CON useCallback) ---
  const handleMonthChange = useCallback(
    (direction) => {
      const newMonth =
        direction === "prev"
          ? subMonths(displayMonth, 1)
          : addMonths(displayMonth, 1);
      setDisplayMonth(newMonth);
      setCustomStartDate(
        format(
          startOfWeek(startOfMonth(newMonth), DATE_FNS_OPTIONS),
          "yyyy-MM-dd",
        ),
      );
      setCustomEndDate(
        format(endOfWeek(endOfMonth(newMonth), DATE_FNS_OPTIONS), "yyyy-MM-dd"),
      );
    },
    [displayMonth],
  );

  const handleStartDateChange = useCallback((e) => {
    setCustomStartDate(e.target.value);
  }, []);

  const handleEndDateChange = useCallback((e) => {
    setCustomEndDate(e.target.value);
  }, []);

  // --- API DEL HOOK ---
  return {
    isLoading,
    chartData: {
      weekly: weeklyChartData,
      pie: pieChartData,
      colors: COLORS,
    },
    filters: {
      displayMonth,
      customStartDate,
      customEndDate,
    },
    handlers: {
      handlePrevMonth: () => handleMonthChange("prev"),
      handleNextMonth: () => handleMonthChange("next"),
      handleStartDateChange,
      handleEndDateChange,
    },
  };
};

export default useReportsController;
