import React from "react";
import { Check } from "lucide-react";
import { useStore } from "../store.jsx";

export default function Success() {
  const { lastOrder, setScreen } = useStore();
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-24 h-24 rounded-full bg-linear-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-6">
          <Check size={44} className="text-white" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Order placed!</h2>
        <p className="text-slate-500 text-sm mt-2">Thanks{lastOrder ? ", " + lastOrder.name : ""}. We'll send updates to <span className="font-semibold text-slate-700">{lastOrder?.contact}</span>.</p>
        <div className="bg-slate-50 rounded-2xl px-6 py-4 mt-6 w-full">
          <p className="text-xs text-slate-400">Order ID</p>
          <p className="font-bold text-slate-800 text-lg">{lastOrder?.id}</p>
        </div>
        <button onClick={() => setScreen("home")} className="mt-6 w-full bg-brand-600 text-white font-semibold py-3.5 rounded-xl">Continue shopping</button>
      </div>
    </div>
  );
}
