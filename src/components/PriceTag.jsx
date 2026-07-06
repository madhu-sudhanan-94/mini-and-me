import React from "react";
import { formatINR } from "../lib/format.js";

export default function PriceTag({ p, size = "base" }) {
  // Large (product modal): strikethrough MRP on top, price below.
  if (size === "lg") {
    return (
      <div className="flex flex-col items-start leading-tight">
        {p.original && <span className="text-slate-400 line-through text-sm">{formatINR(p.original)}</span>}
        <span className="font-bold text-slate-900 text-2xl">{formatINR(p.price)}</span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-bold text-slate-900 text-[15px]">{formatINR(p.price)}</span>
      {p.original && <span className="text-slate-400 line-through text-[11px]">{formatINR(p.original)}</span>}
    </div>
  );
}
