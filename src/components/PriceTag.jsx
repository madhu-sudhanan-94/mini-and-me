import React from "react";
import { formatINR } from "../lib/format.js";

export default function PriceTag({ p, size = "base" }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`font-bold text-slate-900 ${size === "lg" ? "text-2xl" : "text-[15px]"}`}>{formatINR(p.price)}</span>
      {p.original && <span className={`text-slate-400 line-through ${size === "lg" ? "text-sm" : "text-[11px]"}`}>{formatINR(p.original)}</span>}
    </div>
  );
}
