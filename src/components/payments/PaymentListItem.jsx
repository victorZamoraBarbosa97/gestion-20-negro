// src/components/payments/PaymentListItem.jsx
import React from "react";
import { ChevronRightIcon } from "../ui/Icons";

const PaymentListItem = ({ payment, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center"
    >
      <div>
        {payment.amount === 0 ? (
          <p className="font-semibold text-indigo-600">Estado de Cuenta</p>
        ) : (
          <p className="font-bold text-slate-800">
            {payment.amount.toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}
          </p>
        )}
        <p className="text-xs text-slate-500">
          {payment.date.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
          })}
        </p>
      </div>
      <ChevronRightIcon />
    </button>
  );
};

export default PaymentListItem;
