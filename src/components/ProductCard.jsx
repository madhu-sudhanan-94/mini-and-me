import React, { useState } from "react";
import { Heart, ShoppingCart, Share2, X } from "lucide-react";
import ProductImage from "./ProductImage.jsx";
import PriceTag from "./PriceTag.jsx";
import { outOfStock, lowStock } from "../lib/catalog.js";
import { useSwipe } from "../lib/useSwipe.js";
import { useStore } from "../store.jsx";

export default function ProductCard({ p, wide }) {
  const { openProduct, toggleFav, isFav, addToCart, shareProduct, setScreen } = useStore();
  const oos = outOfStock(p);
  const imgs = p.images || [];
  const [imgIdx, setImgIdx] = useState(0);
  const [quick, setQuick] = useState(false);            // quick-add size picker
  const [size, setSize] = useState(p.sizes?.[0] || null);
  const stop = (e) => e.stopPropagation();

  const swipe = useSwipe({
    onLeft: () => setImgIdx((i) => (imgs.length ? (i + 1) % imgs.length : i)),
    onRight: () => setImgIdx((i) => (imgs.length ? (i - 1 + imgs.length) % imgs.length : i)),
  });

  const add = (e) => { stop(e); addToCart(p, size || p.sizes?.[0], p.colors[0]); setQuick(false); };
  const buy = (e) => { stop(e); addToCart(p, size || p.sizes?.[0], p.colors[0]); setQuick(false); setScreen("checkout"); };

  return (
    <div
      onClick={() => openProduct(p)}
      className={`text-left bg-white rounded-2xl p-2.5 shadow-xs hover:shadow-md transition active:scale-[0.98] cursor-pointer ${wide ? "w-40 shrink-0" : ""}`}
    >
      <div {...(imgs.length > 1 ? swipe : {})} className="relative rounded-xl bg-linear-to-br from-accent-50 to-brand-100 h-[180px] overflow-hidden touch-pan-y select-none">
        <ProductImage key={imgIdx} p={p} color={p.colors[0]} index={imgIdx} />

        {oos && <div className="absolute inset-0 z-10 bg-white/55 flex items-center justify-center"><span className="bg-slate-900/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">Out of stock</span></div>}
        {!oos && p.original && <span className="absolute z-10 top-1.5 left-1.5 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">SALE</span>}
        {!oos && p.tag === "new" && <span className="absolute z-10 top-1.5 left-1.5 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">NEW</span>}

        {/* favourite */}
        <button onClick={(e) => { stop(e); toggleFav(p.id); }} aria-label={isFav(p.id) ? "Remove from favourites" : "Add to favourites"} className="absolute z-10 top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center active:scale-90 transition">
          <Heart size={14} className={isFav(p.id) ? "text-rose-500" : "text-slate-400"} fill={isFav(p.id) ? "currentColor" : "none"} />
        </button>

        {/* image dots */}
        {imgs.length > 1 && !quick && (
          <div className="absolute bottom-1.5 left-1.5 flex gap-1 z-10">
            {imgs.map((_, i) => (
              <span key={i} onClick={(e) => { stop(e); setImgIdx(i); }} className={`h-1.5 rounded-full cursor-pointer transition-all ${i === imgIdx ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        )}

        {/* quick actions: share + add-to-cart */}
        {!oos && !quick && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1.5 z-10">
            <button onClick={(e) => { stop(e); shareProduct(p); }} aria-label="Share" className="w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-slate-600 active:scale-90 transition"><Share2 size={13} /></button>
            <button onClick={(e) => { stop(e); setQuick(true); }} aria-label="Add to cart" className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/30 active:scale-90 transition"><ShoppingCart size={15} /></button>
          </div>
        )}

        {/* quick-add size picker */}
        {quick && (
          <div className="absolute inset-0 z-20 bg-black/55 flex flex-col justify-end p-2" onClick={(e) => { stop(e); setQuick(false); }}>
            <div className="bg-white rounded-xl p-2.5" onClick={stop}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-bold text-slate-700">Select size</p>
                <button onClick={(e) => { stop(e); setQuick(false); }} aria-label="Close" className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center"><X size={12} className="text-slate-500" /></button>
              </div>
              <div className="flex gap-1 flex-wrap mb-2">
                {p.sizes.map((s) => (
                  <button key={s} onClick={(e) => { stop(e); setSize(s); }} className={`min-w-[28px] px-2 py-1 rounded-md text-[11px] font-semibold ${size === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}>{s}</button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <button onClick={add} className="flex-1 bg-brand-600 text-white text-[11px] font-bold py-1.5 rounded-lg active:scale-95 transition">Add to cart</button>
                <button onClick={buy} className="flex-1 border border-brand-500 text-brand-600 text-[11px] font-bold py-1.5 rounded-lg active:scale-95 transition">Buy now</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-[13px] font-semibold text-slate-800 truncate">{p.name}</p>
      <div className="mt-0.5"><PriceTag p={p} /></div>
      {lowStock(p) && <p className="text-[10px] font-semibold text-amber-600 mt-0.5">Only {p.stock} left</p>}
    </div>
  );
}
