import React from "react";
import { formatINR } from "../lib/format.js";

export default function PriceTag({ p, size = "base" }) {
  const showStrike = p.original && p.original > p.price;
  // Large (product modal): price + strikethrough MRP on the same line.
  if (size === "lg") {
    return (
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-slate-900 text-2xl">{formatINR(p.price)}</span>
        {showStrike && <span className="text-slate-400 line-through text-base">{formatINR(p.original)}</span>}
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
