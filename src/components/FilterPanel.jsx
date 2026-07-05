import React from "react";
import { COLOR_FAMILIES, familyLabel } from "../lib/catalog.js";
import PriceRangeSlider from "./PriceRangeSlider.jsx";

const FAMILY_HEX = Object.fromEntries(COLOR_FAMILIES.map((f) => [f.key, f.hex]));

/*
  FilterPanel — the shop's filters (type / price / colour). Used both as the
  desktop sidebar and inside the mobile "Filters" bottom sheet. All state is
  owned by the Category screen and passed in.
*/
export default function FilterPanel({
  showType = true, shapes, shape, setShape,
  bounds, price, setPrice, families, colors, toggleColor, onReset,
}) {
  return (
    <div className="space-y-6">
      {showType && shapes.length > 1 && (
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2.5">Type</p>
          <div className="flex flex-wrap gap-2">
            {shapes.map((s) => (
              <button key={s} onClick={() => setShape(s)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize ${shape === s ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200"}`}>
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-slate-800 mb-3">Price</p>
        <PriceRangeSlider min={bounds[0]} max={bounds[1]} value={price} onChange={setPrice} />
      </div>

      {families.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2.5">Colour</p>
          <div className="flex flex-wrap gap-2.5">
            {families.map((key) => {
              const on = colors.has(key);
              return (
                <button key={key} onClick={() => toggleColor(key)} aria-label={familyLabel(key)} title={familyLabel(key)} className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 transition ${on ? "ring-brand-500" : "ring-transparent hover:ring-slate-200"}`}>
                  <span className="w-6 h-6 rounded-full border border-black/10" style={{ background: FAMILY_HEX[key] }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={onReset} className="text-sm font-semibold text-brand-600">Reset all filters</button>
    </div>
  );
}
