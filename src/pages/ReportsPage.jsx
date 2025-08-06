// src/pages/ReportsPage.jsx
import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import usePayments from '../hooks/usePayments';
// Importar todas las funciones necesarias de date-fns
import { startOfMonth, endOfMonth, getWeek, format, parseISO, isValid, subMonths, addMonths, startOfWeek, addWeeks, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// Colores para el gráfico, usando las claves exactas que esperamos en los datos
const COLORS = {
  'PRONÓSTICOS': '#EA580C', // orange-600
  'VÍA': '#2563EB',        // blue-600
};

// Opciones para date-fns para que la semana empiece en Jueves (4)
const DATE_FNS_OPTIONS = { locale: es, weekStartsOn: 4 }; // 4 = Jueves

const ReportsPage = () => {
  const [displayMonth, setDisplayMonth] = useState(new Date());
  
  // Calculamos el rango inicial de fechas para los inputs, ajustado a la semana actual (Jueves-Miércoles)
  const initialStartDate = useMemo(() => startOfWeek(new Date(), DATE_FNS_OPTIONS), []); 
  const initialEndDate = useMemo(() => endOfWeek(new Date(), DATE_FNS_OPTIONS), []);     

  const [customStartDate, setCustomStartDate] = useState(format(initialStartDate, 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(initialEndDate, 'yyyy-MM-dd'));

  const finalStartDate = useMemo(() => {
    const parsedDate = parseISO(customStartDate);
    // Aseguramos que la fecha de inicio siempre sea el Jueves de esa semana
    return isValid(parsedDate) ? startOfWeek(parsedDate, DATE_FNS_OPTIONS) : startOfWeek(startOfMonth(displayMonth), DATE_FNS_OPTIONS);
  }, [customStartDate, displayMonth]);

  const finalEndDate = useMemo(() => {
    const parsedDate = parseISO(customEndDate);
    // Aseguramos que la fecha de fin siempre sea el Miércoles de esa semana (fin del día)
    const date = isValid(parsedDate) ? endOfWeek(parsedDate, DATE_FNS_OPTIONS) : endOfWeek(endOfMonth(displayMonth), DATE_FNS_OPTIONS);
    return new Date(date.setHours(23, 59, 59, 999));
  }, [customEndDate, displayMonth]);

  const { payments, isLoading, pronosticosTotal, viaTotal } = usePayments(finalStartDate, finalEndDate);

  const weeklyChartData = useMemo(() => {
    if (!payments) return [];

    const dataMap = new Map();

    // Generar todas las semanas completas (Jueves-Miércoles) dentro del rango de fechas final
    let currentWeekStart = startOfWeek(finalStartDate, DATE_FNS_OPTIONS);
    const intervalEndLimit = endOfWeek(finalEndDate, DATE_FNS_OPTIONS);

    while (currentWeekStart <= intervalEndLimit) {
        const weekNumber = getWeek(currentWeekStart, DATE_FNS_OPTIONS);
        const weekEnd = addWeeks(currentWeekStart, 1);
        weekEnd.setDate(weekEnd.getDate() - 1); // Miércoles de esa semana

        // Usar el Jueves de la semana como clave robusta para el Map
        const mapKey = format(currentWeekStart, 'yyyy-MM-dd'); 
        // Formato de etiqueta de semana con año completo
        const displayLabel = `Semana ${weekNumber} (${format(currentWeekStart, 'dd/MM/yyyy', DATE_FNS_OPTIONS)} - ${format(weekEnd, 'dd/MM/yyyy', DATE_FNS_OPTIONS)})`;
        
        dataMap.set(mapKey, { name: displayLabel, 'PRONÓSTICOS': 0, 'VÍA': 0, sortKey: weekNumber }); 
        currentWeekStart = addWeeks(currentWeekStart, 1);
    }

    // Sumar los pagos a las semanas correspondientes
    payments.forEach(payment => {
        let normalizedType = payment.type?.toUpperCase(); 
        
        if (normalizedType === 'PRONOSTICOS') {
            normalizedType = 'PRONÓSTICOS'; 
        } else if (normalizedType === 'VIA') {
            normalizedType = 'VÍA'; 
        }
        
        if (normalizedType !== 'PRONÓSTICOS' && normalizedType !== 'VÍA') {
            console.warn(`[ReportsPage] Tipo de pago desconocido o no reconocido: ${payment.type}. No se incluirá en el gráfico de barras.`);
            return; 
        }

        const paymentWeekStart = startOfWeek(payment.date, DATE_FNS_OPTIONS);
        // Usar la misma clave robusta para identificar la semana del pago
        const paymentWeekKey = format(paymentWeekStart, 'yyyy-MM-dd');
        
        if (dataMap.has(paymentWeekKey)) {
            dataMap.get(paymentWeekKey)[normalizedType] += Number(payment.amount) || 0;
        } else {
            console.warn(`[ReportsPage] Pago de ${payment.date.toLocaleDateString()} no cae en una semana generada para el rango actual. Clave calculada: ${paymentWeekKey}`);
        }
    });
    
    const sortedData = Array.from(dataMap.values()).sort((a, b) => a.sortKey - b.sortKey);

    return sortedData;
  }, [payments, finalStartDate, finalEndDate]); 

  const pieChartData = useMemo(() => {
    const data = [
      { name: 'PRONÓSTICOS', value: pronosticosTotal, color: COLORS['PRONÓSTICOS'] },
      { name: 'VÍA', value: viaTotal, color: COLORS['VÍA'] }, 
    ];
    return data;
  }, [pronosticosTotal, viaTotal]);

  const handlePrevMonth = () => {
    const newMonth = subMonths(displayMonth, 1);
    setDisplayMonth(newMonth);
    // Ajustar los inputs para el nuevo mes completo (semana a semana) según Jueves-Miércoles
    setCustomStartDate(format(startOfWeek(startOfMonth(newMonth), DATE_FNS_OPTIONS), 'yyyy-MM-dd'));
    setCustomEndDate(format(endOfWeek(endOfMonth(newMonth), DATE_FNS_OPTIONS), 'yyyy-MM-dd'));
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(displayMonth, 1);
    setDisplayMonth(newMonth);
    // Ajustar los inputs para el nuevo mes completo (semana a semana) según Jueves-Miércoles
    setCustomStartDate(format(startOfWeek(startOfMonth(newMonth), DATE_FNS_OPTIONS), 'yyyy-MM-dd'));
    setCustomEndDate(format(endOfWeek(endOfMonth(newMonth), DATE_FNS_OPTIONS), 'yyyy-MM-dd'));
  };

  const handleStartDateChange = (e) => {
    setCustomStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setCustomEndDate(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-slate-100">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 text-slate-800">
      <main className="p-4 sm:p-6 lg:p-8 pt-20">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reportes y Análisis</h1>
          <p className="mt-1 text-slate-600">Visualización de los pagos en rangos de tiempo.</p>
        </header>

        {/* Navegador de Meses */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <button onClick={handlePrevMonth} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">Mes Anterior</button>
          <h2 className="text-xl sm:text-2xl font-semibold text-center capitalize">
            {format(displayMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <button onClick={handleNextMonth} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">Mes Siguiente</button>
        </div>

        {/* Selector de Rango de Fechas Personalizado */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">Filtrar por Rango de Fechas</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <input
              type="date"
              value={customStartDate}
              onChange={handleStartDateChange}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 w-full sm:w-auto"
            />
            <span className="text-gray-600">al</span>
            <input
              type="date"
              value={customEndDate}
              onChange={handleEndDateChange}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 w-full sm:w-auto"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gráfico de Barras */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Pagos por Semana</h2>
            <div style={{ width: '100%', height: 400, minWidth: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#4A5568" interval="preserveStartEnd" />
                  <YAxis stroke="#4A5568" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }} labelStyle={{ color: '#1A202C' }} />
                  <Legend />
                  <Bar dataKey="PRONÓSTICOS" fill={COLORS['PRONÓSTICOS']} />
                  <Bar dataKey="VÍA" fill={COLORS['VÍA']} /> 
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Pastel */}
          <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Distribución Total</h2>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }} formatter={(value) => value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}/>
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px', color: '#4A5568' }} 
                    payload={pieChartData.map(entry => ({ 
                      value: entry.name, 
                      type: 'square', 
                      color: entry.color 
                    }))} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
