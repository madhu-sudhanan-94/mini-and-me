import React from "react";
import { Minus, Plus } from "lucide-react";

/*
  QtyStepper — shared quantity control rendered as a clean outlined pill:
    (−   value   +)
  The parent owns the value; this only reports intent. − disables at min,
  + disables at max. size: "sm" (compact rows) | "md" (default).
*/
export default function QtyStepper({ value, onDecrement, onIncrement, min = 1, max = Infinity, size = "md" }) {
  const atMin = value <= min;
  const atMax = value >= max;
  const s = size === "sm"
    ? { h: "h-9", btn: "w-9", num: "w-8 text-sm", icon: 15 }
    : { h: "h-11", btn: "w-11", num: "w-10 text-[15px]", icon: 17 };
  const btn = "h-full flex items-center justify-center text-slate-700 active:scale-90 transition disabled:text-slate-300 disabled:active:scale-100";
  return (
    <div className={`inline-flex items-center ${s.h} rounded-full border border-slate-200 bg-white select-none`}>
      <button type="button" onClick={onDecrement} disabled={atMin} aria-label="Decrease quantity" className={`${s.btn} ${btn} rounded-l-full`}><Minus size={s.icon} /></button>
      <span aria-live="polite" className={`${s.num} text-center font-bold text-slate-900 tabular-nums`}>{value}</span>
      <button type="button" onClick={onIncrement} disabled={atMax} aria-label="Increase quantity" className={`${s.btn} ${btn} rounded-r-full`}><Plus size={s.icon} /></button>
    </div>
  );
}
