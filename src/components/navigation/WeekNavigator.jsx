// src/components/navigation/WeekNavigator.jsx
import { ChevronLeftIcon, ChevronRightIcon } from "../ui/Icons";
// Importa getWeekMonthRange junto con los demás helpers de fecha
import {
  getWeekNumber,
  getWeekDays,
  getWeekMonthRange,
} from "../../utils/dateHelpers";

const WeekNavigator = ({ currentWeekStartDate, onPrevWeek, onNextWeek }) => {
  const weekNumber = getWeekNumber(currentWeekStartDate);
  const weekDays = getWeekDays(currentWeekStartDate);
  const weekMonthRange = getWeekMonthRange(currentWeekStartDate); // Obtener el rango de meses

  return (
    <div className="flex justify-center items-center mb-8 px-4 sm:px-0">
      <div className="flex items-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1.5 sm:p-2.5 transform hover:scale-[1.01] transition-all duration-300 ease-in-out border border-gray-200 dark:border-gray-700">
        <button
          onClick={onPrevWeek}
          className="p-2 sm:p-2.5 rounded-full text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 hover:text-slate-900 dark:hover:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white 
                     transition duration-200 ease-in-out active:scale-95"
          aria-label="Semana Anterior"
        >
          <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <div className="text-center mx-3 sm:mx-6 flex-grow min-w-[180px] sm:min-w-[250px]">
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-gray-400 block">
            Semana {weekNumber}
          </span>
          {/* Nuevo: Nombre del mes(es) */}
          <span className="text-sm sm:text-base font-bold text-slate-700 dark:text-gray-200 block mt-0.5">
            {weekMonthRange}
          </span>
          {/* Visualización de Lunes a Domingo con días del mes */}
          <div className="flex justify-center space-x-1 sm:space-x-1.5 mt-2">
            {" "}
            {/* Aumentar mt para más espacio */}
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                <span className="text-xs font-medium text-slate-700 dark:text-gray-300 leading-none">
                  {day.dayName}
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-none">
                  {day.dayOfMonth}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onNextWeek}
          className="p-2 sm:p-2.5 rounded-full text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 hover:text-slate-900 dark:hover:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white 
                     transition duration-200 ease-in-out active:scale-95"
          aria-label="Semana Siguiente"
        >
          <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>
    </div>
  );
};

export default WeekNavigator;
