import React, { useState, useEffect } from "react";
import { X, ShoppingCart, Maximize2 } from "lucide-react";
import ProductImage from "./ProductImage.jsx";
import Garment from "./Garment.jsx";
import PriceTag from "./PriceTag.jsx";
import PrimaryButton from "./PrimaryButton.jsx";
import QtyStepper from "./QtyStepper.jsx";
import { outOfStock, sizeOutOfStock, sizeLowStock, stockFor, firstInStockSize, hasSizeStock } from "../lib/catalog.js";
import { formatINR } from "../lib/format.js";
import { useSwipe } from "../lib/useSwipe.js";
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
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);           // full-screen image viewer
  const [imgIdx, setImgIdx] = useState(0);
  const zoomSwipe = useSwipe({
    onLeft: () => setImgIdx((i) => { const n = (quickAdd?.images || []).length; return n ? (i + 1) % n : i; }),
    onRight: () => setImgIdx((i) => { const n = (quickAdd?.images || []).length; return n ? (i - 1 + n) % n : i; }),
  });
  useEffect(() => { setSize(null); setQty(1); setZoom(false); setImgIdx(0); }, [p?.id]); // reset when a different product opens

  if (!p) return null;

  const imgs = p.images || [];
  const zimg = imgs[imgIdx];
  const sel = size || firstInStockSize(p);           // effective selected size
  const oos = outOfStock(p);
  const selSoldOut = sizeOutOfStock(p, sel);
  const rawDesc = (p.desc || "").trim();
  const hasDesc = rawDesc.length > 0 && rawDesc.toLowerCase() !== "added by admin.";
  const onSale = p.original && p.original > p.price;
  const pctOff = onSale ? Math.round((1 - p.price / p.original) * 100) : 0;
  const isFreeSize = p.sizes.length === 1 && String(p.sizes[0]).toLowerCase() === "free";

  const maxQty = (() => { const s = stockFor(p, sel); return typeof s === "number" ? Math.max(1, s) : 99; })();
  const add = () => { addToCart(p, sel, p.colors[0], qty); closeQuickAdd(); };
  const buy = () => { buyNow(p, sel, p.colors[0], qty); setQuickAdd(null); }; // buyNow rewrites history → just hide

  return (
    <div className="fixed sm:max-lg:absolute inset-0 z-[60] flex flex-col justify-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={closeQuickAdd} />

      <div className="relative w-full lg:w-[420px] lg:max-w-[92vw] bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl px-5 pt-3 pb-6" style={{ animation: "vkUp .25s ease" }}>
        {/* grab handle (mobile bottom-sheet affordance) */}
        <div className="lg:hidden mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        <button onClick={closeQuickAdd} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition"><X size={16} className="text-slate-500" /></button>

        {/* product summary */}
        <div className="flex gap-4">
          <button onClick={() => imgs.length && setZoom(true)} aria-label="View image" className="relative w-24 h-28 rounded-xl overflow-hidden bg-linear-to-br from-accent-50 to-brand-100 shrink-0 ring-1 ring-slate-100 cursor-zoom-in active:scale-95 transition">
            <ProductImage p={p} color={p.colors[0]} index={0} />
            {imgs.length > 0 && <span aria-hidden className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-xs"><Maximize2 size={11} className="text-slate-600" /></span>}
          </button>
          <div className="min-w-0 flex-1 pr-6">
            <p className="text-base font-bold text-slate-900 leading-snug">{p.name}</p>
            <div className="mt-1.5"><PriceTag p={p} /></div>
            {onSale && <p className="mt-1 text-[11px] font-semibold text-green-600">You save {formatINR(p.original - p.price)}</p>}
            {hasDesc && <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">{p.desc}</p>}
          </div>
        </div>

        {/* size picker (hidden for one-size / "Free" products) */}
        {!isFreeSize && (
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
                  onClick={() => { if (!soldOut) { setSize(s); setQty(1); } }}
                  disabled={soldOut}
                  aria-label={soldOut ? `Size ${s} — out of stock` : `Size ${s}`}
                  className={`min-w-[48px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${soldOut ? "bg-slate-100 text-slate-300 line-through cursor-not-allowed" : sel === s ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 active:scale-95"}`}
                >{s}</button>
              );
            })}
          </div>
        </div>
        )}

        {/* quantity */}
        {!oos && !selSoldOut && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Quantity</p>
            <QtyStepper value={qty} onDecrement={() => setQty((q) => Math.max(1, q - 1))} onIncrement={() => setQty((q) => Math.min(q + 1, maxQty))} max={maxQty} />
          </div>
        )}

        {/* actions */}
        <div className="mt-5">
          {oos ? (
            <button disabled className="w-full bg-slate-100 text-slate-400 font-semibold py-3.5 rounded-xl cursor-not-allowed">Out of stock</button>
          ) : selSoldOut ? (
            <button disabled className="w-full bg-slate-100 text-slate-400 font-semibold py-3.5 rounded-xl cursor-not-allowed">Size {sel} out of stock</button>
          ) : (
            <div className="flex items-center gap-3">
              <PrimaryButton variant="soft" size="xl" full={false} onClick={add} className="flex-1">
                <ShoppingCart size={18} /> Add to cart
              </PrimaryButton>
              <PrimaryButton variant="gradient" size="xl" full={false} onClick={buy} className="flex-1 border border-transparent">Buy now</PrimaryButton>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen image viewer — tap the thumbnail to open */}
      {zoom && (
        <div className="absolute inset-0 z-[70] flex flex-col bg-black/60 backdrop-blur-md" onClick={() => setZoom(false)}>
          <button onClick={(e) => { e.stopPropagation(); setZoom(false); }} aria-label="Close" className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 backdrop-blur text-white flex items-center justify-center active:scale-90 transition"><X size={20} /></button>
          <div {...(imgs.length > 1 ? zoomSwipe : {})} className="flex-1 flex items-center justify-center overflow-hidden touch-pan-y p-4">
            {zimg ? (
              <img src={zimg} alt={p.name} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full object-contain rounded-xl shadow-2xl shadow-black/30" />
            ) : (
              <Garment shape={p.shape} color={p.colors[0]} className="h-[60%]" />
            )}
          </div>
          {imgs.length > 1 && (
            <div className="absolute inset-x-0 bottom-7 flex justify-center gap-2">
              {imgs.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }} aria-label={`Image ${i + 1}`} className={`h-2 rounded-full transition-all ${i === imgIdx ? "w-6 bg-white" : "w-2 bg-white/50"}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
