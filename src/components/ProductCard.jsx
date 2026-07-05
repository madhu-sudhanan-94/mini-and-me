import React from "react";
import { Heart } from "lucide-react";
import ProductImage from "./ProductImage.jsx";
import PriceTag from "./PriceTag.jsx";
import { outOfStock, lowStock } from "../lib/catalog.js";
import { useStore } from "../store.jsx";

export default function ProductCard({ p, wide }) {
  const { openProduct, toggleFav, isFav } = useStore();
  const oos = outOfStock(p);
  return (
    <div
      onClick={() => openProduct(p)}
      className={`text-left bg-white rounded-2xl p-2.5 shadow-xs hover:shadow-md transition active:scale-[0.98] cursor-pointer ${wide ? "w-40 shrink-0" : ""}`}
    >
      <div className="relative rounded-xl bg-linear-to-br from-accent-50 to-brand-100 h-[180px] overflow-hidden">
        <ProductImage p={p} color={p.colors[0]} />
        {oos && <div className="absolute inset-0 z-10 bg-white/55 flex items-center justify-center"><span className="bg-slate-900/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">Out of stock</span></div>}
        {!oos && p.original && <span className="absolute z-10 top-1.5 left-1.5 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">SALE</span>}
        {!oos && p.tag === "new" && <span className="absolute z-10 top-1.5 left-1.5 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">NEW</span>}
        <button onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }} aria-label={isFav(p.id) ? "Remove from favourites" : "Add to favourites"} className="absolute z-10 top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center active:scale-90 transition">
          <Heart size={14} className={isFav(p.id) ? "text-rose-500" : "text-slate-400"} fill={isFav(p.id) ? "currentColor" : "none"} />
        </button>
      </div>
      <p className="mt-2 text-[13px] font-semibold text-slate-800 truncate">{p.name}</p>
      <div className="mt-0.5"><PriceTag p={p} /></div>
      {lowStock(p) && <p className="text-[10px] font-semibold text-amber-600 mt-0.5">Only {p.stock} left</p>}
    </div>
  );
}
