import React from "react";
import { formatINR } from "../lib/format.js";

export default function PriceTag({ p, size = "base" }) {
  const showStrike = p.original && p.original > p.price;
  // Large (product modal): Amazon-style — "-52%  ₹1,449" then "M.R.P.: ₹2,999".
  if (size === "lg") {
    const pct = showStrike ? Math.round((1 - p.price / p.original) * 100) : 0;
    return (
      <div className="leading-tight">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-slate-900 text-3xl">{formatINR(p.price)}</span>
          {showStrike && <span className="text-lg font-normal text-red-600">-{pct}%</span>}
        </div>
        {showStrike && (
          <p className="text-xs text-slate-500 mt-1">M.R.P.: <span className="line-through">{formatINR(p.original)}</span></p>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-bold text-slate-900 text-[15px]">{formatINR(p.price)}</span>
      {showStrike && <span className="text-slate-400 line-through text-[11px]">{formatINR(p.original)}</span>}
    </div>
  );
}
