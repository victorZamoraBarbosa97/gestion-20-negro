// src/pages/ReportsPage.jsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import useReportsController from "../hooks/useReportsController"; // Importar el nuevo hook
import { useTheme } from "../context/ThemeContext";

const ReportsPage = () => {
  // Toda la lógica ahora reside en el hook
  const { isLoading, chartData, filters, handlers } = useReportsController();
  const { theme } = useTheme();

  // Definición de colores dinámica basada en el tema
  const chartColors = {
    PRONÓSTICOS: theme === "dark" ? "#fb923c" : "#ea580c", // Orange 400 (Dark) vs 600 (Light)
    VÍA: theme === "dark" ? "#60a5fa" : "#2563eb", // Blue 400 (Dark) vs 600 (Light)
  };

  // Estilos para ejes y rejillas
  const chartStyles = {
    axis: theme === "dark" ? "#94a3b8" : "#4A5568", // Slate 400 vs Slate 700
    grid: theme === "dark" ? "#334155" : "#E2E8F0", // Slate 700 vs Slate 200
    tooltipBg: theme === "dark" ? "#1e293b" : "#FFFFFF", // Dark Surface vs White
    tooltipBorder: theme === "dark" ? "#334155" : "#E2E8F0", // Slate 700 vs Slate 200
    tooltipText: theme === "dark" ? "#f3f4f6" : "#1A202C", // Gray 100 vs Gray 900
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-slate-100 dark:bg-dark-main transition-colors duration-300">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-100 dark:bg-dark-main text-slate-800 dark:text-gray-100">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-20">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reportes y Análisis
          </h1>
          <p className="mt-1 text-slate-600 dark:text-gray-400">
            Visualización de los pagos en rangos de tiempo.
          </p>
        </header>

        {/* Navegador de Meses */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <button
            onClick={handlers.handlePrevMonth}
            className="px-4 py-2 bg-gray-200 dark:bg-dark-surface border border-gray-300 dark:border-dark-border text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-700 transition shadow-sm"
          >
            Mes Anterior
          </button>
          <h2 className="text-xl sm:text-2xl font-semibold text-center capitalize text-slate-800 dark:text-white min-w-[200px]">
            {format(filters.displayMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <button
            onClick={handlers.handleNextMonth}
            className="px-4 py-2 bg-gray-200 dark:bg-dark-surface border border-gray-300 dark:border-dark-border text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-700 transition shadow-sm"
          >
            Mes Siguiente
          </button>
        </div>

        {/* Selector de Rango de Fechas Personalizado */}
        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-lg mb-8 transition-colors border border-gray-100 dark:border-dark-border">
          <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">
            Filtrar por Rango de Fechas
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <input
              type="date"
              value={filters.customStartDate}
              onChange={handlers.handleStartDateChange}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white w-full sm:w-auto [color-scheme:light] dark:[color-scheme:dark]"
            />
            <span className="text-gray-600 dark:text-gray-400">al</span>
            <input
              type="date"
              value={filters.customEndDate}
              onChange={handlers.handleEndDateChange}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white w-full sm:w-auto [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gráfico de Barras */}
          <div className="lg:col-span-2 bg-white dark:bg-dark-surface p-6 rounded-lg shadow-lg overflow-x-auto transition-colors border border-gray-100 dark:border-dark-border">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">
              Pagos por Semana
            </h2>
            <div style={{ width: "100%", height: 400, minWidth: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.weekly}
                  margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartStyles.grid}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={chartStyles.axis}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke={chartStyles.axis}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartStyles.tooltipBg,
                      borderColor: chartStyles.tooltipBorder,
                      color: chartStyles.tooltipText,
                    }}
                    labelStyle={{ color: chartStyles.tooltipText }}
                  />
                  <Legend />
                  <Bar
                    dataKey="PRONÓSTICOS"
                    fill={chartColors["PRONÓSTICOS"]}
                  />
                  <Bar dataKey="VÍA" fill={chartColors["VÍA"]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Pastel */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-lg overflow-x-auto transition-colors border border-gray-100 dark:border-dark-border">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">
              Distribución Total
            </h2>
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.pie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    dataKey="value"
                  >
                    {chartData.pie.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[entry.name]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartStyles.tooltipBg,
                      borderColor: chartStyles.tooltipBorder,
                      color: chartStyles.tooltipText,
                    }}
                    itemStyle={{ color: chartStyles.tooltipText }}
                    formatter={(value) =>
                      value.toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      })
                    }
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    payload={chartData.pie.map((entry) => ({
                      value: entry.name,
                      type: "square",
                      color: chartColors[entry.name],
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
