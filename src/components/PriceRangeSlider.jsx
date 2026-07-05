import React from "react";
import { formatINR } from "../lib/format.js";

/*
  PriceRangeSlider — dual-handle range slider for a min/max price filter.
  Two stacked <input type="range"> (transparent tracks; only the thumbs are
  interactive via .range-thumb in index.css) over a coloured fill.

  Props: min, max (bounds), value = [lo, hi], onChange([lo, hi]).
*/
export default function PriceRangeSlider({ min, max, value, onChange }) {
  const [lo, hi] = value;
  const span = Math.max(1, max - min);
  const pct = (v) => ((Math.min(Math.max(v, min), max) - min) / span) * 100;
  const setLo = (v) => onChange([Math.min(Number(v), hi), hi]);
  const setHi = (v) => onChange([lo, Math.max(Number(v), lo)]);
  const disabled = max <= min;

  return (
    <div>
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1 rounded-full bg-slate-200" />
        <div className="absolute h-1 rounded-full bg-brand-500" style={{ left: pct(lo) + "%", right: 100 - pct(hi) + "%" }} />
        <input type="range" min={min} max={max} value={lo} disabled={disabled} onChange={(e) => setLo(e.target.value)} aria-label="Minimum price" className="range-thumb absolute inset-0 w-full h-5" />
        <input type="range" min={min} max={max} value={hi} disabled={disabled} onChange={(e) => setHi(e.target.value)} aria-label="Maximum price" className="range-thumb absolute inset-0 w-full h-5" />
      </div>
      <div className="flex justify-between text-sm text-slate-600 mt-2">
        <span>{formatINR(lo)}</span>
        <span>{formatINR(hi)}</span>
      </div>
    </div>
  );
}
