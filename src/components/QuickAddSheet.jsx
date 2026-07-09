import React, { useState, useEffect } from "react";
import { X, ShoppingCart } from "lucide-react";
import ProductImage from "./ProductImage.jsx";
import PriceTag from "./PriceTag.jsx";
import PrimaryButton from "./PrimaryButton.jsx";
import { outOfStock, sizeOutOfStock, sizeLowStock, stockFor, firstInStockSize, hasSizeStock } from "../lib/catalog.js";
import { useStore } from "../store.jsx";

/*
  Quick-add bottom sheet — opened by the cart icon on a product card. Slides up
  from the bottom with the product image, name, price, a short description and a
  size picker, then Add to cart / Buy now. A centred card on desktop. Global (one
  instance in App), so it renders above the product modal too. History-backed:
  the device Back button just closes it (see store.openQuickAdd/closeQuickAdd).
*/
export default function QuickAddSheet() {
  const { quickAdd, closeQuickAdd, setQuickAdd, addToCart, buyNow } = useStore();
  const p = quickAdd;
  const [size, setSize] = useState(null);            // user's pick; null → first in-stock
  useEffect(() => { setSize(null); }, [p?.id]);       // reset when a different product opens

  if (!p) return null;

  const sel = size || firstInStockSize(p);           // effective selected size
  const oos = outOfStock(p);
  const selSoldOut = sizeOutOfStock(p, sel);
  const rawDesc = (p.desc || "").trim();
  const hasDesc = rawDesc.length > 0 && rawDesc.toLowerCase() !== "added by admin.";

  const add = () => { addToCart(p, sel, p.colors[0]); closeQuickAdd(); };
  const buy = () => { buyNow(p, sel, p.colors[0]); setQuickAdd(null); }; // buyNow rewrites history → just hide

  return (
    <div className="absolute lg:fixed inset-0 z-[60] flex flex-col justify-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={closeQuickAdd} />

      <div className="relative w-full lg:w-[420px] lg:max-w-[92vw] bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl px-5 pt-3 pb-6" style={{ animation: "vkUp .28s ease" }}>
        {/* grab handle (mobile bottom-sheet affordance) */}
        <div className="lg:hidden mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        <button onClick={closeQuickAdd} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition"><X size={16} className="text-slate-500" /></button>

        {/* product summary */}
        <div className="flex gap-3.5">
          <div className="relative w-20 h-24 rounded-2xl overflow-hidden bg-linear-to-br from-accent-50 to-brand-100 shrink-0">
            <ProductImage p={p} color={p.colors[0]} index={0} />
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <p className="text-[15px] font-bold text-slate-900 leading-snug">{p.name}</p>
            <div className="mt-1"><PriceTag p={p} /></div>
            {hasDesc && <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">{p.desc}</p>}
          </div>
        </div>

        {/* size picker */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800">Select size</p>
            {!oos && !selSoldOut && sizeLowStock(p, sel) && (
              <span className="text-[11px] font-semibold text-amber-600">Only {stockFor(p, sel)} left{hasSizeStock(p) ? ` in ${sel}` : ""}</span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {p.sizes.map((s) => {
              const soldOut = sizeOutOfStock(p, s);
              return (
                <button
                  key={s}
                  onClick={() => !soldOut && setSize(s)}
                  disabled={soldOut}
                  aria-label={soldOut ? `Size ${s} — out of stock` : `Size ${s}`}
                  className={`min-w-[46px] px-3 py-2 rounded-xl text-sm font-semibold transition ${soldOut ? "bg-slate-100 text-slate-300 line-through cursor-not-allowed" : sel === s ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-slate-100 text-slate-500"}`}
                >{s}</button>
              );
            })}
          </div>
        </div>

        {/* actions */}
        <div className="mt-5">
          {oos ? (
            <button disabled className="w-full bg-slate-200 text-slate-400 font-bold py-3.5 rounded-xl cursor-not-allowed">Out of stock</button>
          ) : selSoldOut ? (
            <button disabled className="w-full bg-slate-200 text-slate-400 font-bold py-3.5 rounded-xl cursor-not-allowed">Size {sel} out of stock</button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={add} className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-brand-700 bg-brand-50 border border-brand-200 active:scale-[0.97] transition">
                <ShoppingCart size={18} /> Add to cart
              </button>
              <PrimaryButton variant="gradient" size="xl" full={false} onClick={buy} className="flex-1 border border-transparent">Buy now</PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
