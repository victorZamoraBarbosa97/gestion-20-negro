// src/utils/dateHelpers.js

export const getStartOfWeek = (currentDate) => {
  const date = new Date(currentDate);
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  // Calculamos cuántos días retroceder para llegar al Lunes.
  // Si hoy es Lunes (1), daysToSubtract es 0.
  // Si hoy es Martes (2), daysToSubtract es 1.
  // ...
  // Si hoy es Domingo (0), daysToSubtract es 6 (para ir al Lunes anterior).
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  date.setDate(date.getDate() - daysToSubtract);
  date.setHours(0, 0, 0, 0); // Asegura que sea el inicio del día (00:00:00.000)
  return date;
};

export const getWeekDateRange = (startDate) => {
  const endDate = new Date(startDate);
  // Para que el rango VISUALIZADO sea de lunes a viernes, sumamos 4 días al lunes (startDate)
  // Lunes (día 0 de nuestro cálculo a partir del lunes) + 4 días = Viernes
  endDate.setDate(startDate.getDate() + 4);

  const formatOptions = { month: "short", day: "numeric" };
  return `${startDate.toLocaleDateString(
    "es-MX",
    formatOptions
  )} - ${endDate.toLocaleDateString("es-MX", formatOptions)}`;
};

export const getWeekNumber = (d) => {
  // Copia la fecha para evitar mutaciones
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Establece el día a Jueves de la misma semana, esto ayuda a evitar problemas de cambio de año con semanas parciales
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Obtiene el primer día del año
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calcula la diferencia en días y luego en semanas
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return weekNo;
};

export const getWeekDays = (startDate) => {
  const days = [];
  const start = new Date(startDate); // Asegurarse de no mutar el startDate original

  // Array de nombres cortos de días de la semana
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(start);
    currentDay.setDate(start.getDate() + i);

    days.push({
      dayName: dayNames[currentDay.getDay()], // Obtener el nombre del día (Dom, Lun, etc.)
      dayOfMonth: currentDay.getDate(), // Obtener el número del día del mes
      fullDate: currentDay, // La fecha completa por si se necesita para algo más
    });
  }
  return days;
};

export const getWeekMonthRange = (startDate) => {
  const startMonth = startDate.getMonth(); // 0 = Ene, 11 = Dic
  const endOfWeek = new Date(startDate);
  endOfWeek.setDate(startDate.getDate() + 6); // Obtener el domingo de la semana para determinar el mes final
  const endMonth = endOfWeek.getMonth();

  const monthFormatOptions = { month: "short" }; // Formato corto del mes (e.g., 'jul')

  const startMonthName = startDate
    .toLocaleDateString("es-MX", monthFormatOptions)
    .toUpperCase();
  const endMonthName = endOfWeek
    .toLocaleDateString("es-MX", monthFormatOptions)
    .toUpperCase();

  if (startMonth === endMonth) {
    return startMonthName; // Si es el mismo mes (ej. JUL)
  } else {
    return `${startMonthName}-${endMonthName}`; // Si abarca dos meses (ej. JUL-AGO)
  }
};
