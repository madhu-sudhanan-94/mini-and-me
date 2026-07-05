import React, { useState } from "react";
import { X, Heart, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { formatINR, CAT_LABEL } from "../lib/format.js";
import { SIZE_GUIDE } from "../lib/sizeguide.js";
import ProductImage from "../components/ProductImage.jsx";
import PriceTag from "../components/PriceTag.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useStore } from "../store.jsx";

/* Product detail pop-up. Renders nothing unless a product is selected. */
export default function ProductModal() {
  const {
    products, selProduct, closeProduct, toggleFav, isFav,
    imgIndex, setImgIndex, selColor, setSelColor, selSize, setSelSize, addToCart,
  } = useStore();
  const [guide, setGuide] = useState(false);

  const p = selProduct;
  if (!p) return null;
  const imgs = p.images || [];
  const chart = SIZE_GUIDE[p.cat] || SIZE_GUIDE.women;
  const related = products.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 8);
  return (
    <div className="absolute lg:fixed inset-0 z-40 flex flex-col lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={closeProduct} />
      <div className="relative mt-auto lg:mt-0 bg-slate-50 rounded-t-4xl lg:rounded-4xl max-h-[94%] lg:max-h-[88vh] w-full lg:w-[460px] lg:max-w-[92vw] flex flex-col overflow-hidden shadow-2xl" style={{ animation: "vkUp .25s ease" }}>
        {/* Image carousel */}
        <div className="relative h-72 lg:h-80 bg-linear-to-br from-accent-100 to-brand-200 shrink-0">
          <ProductImage key={imgIndex} p={p} color={selColor} index={imgIndex} />
          <button onClick={closeProduct} className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center"><X size={18} /></button>
          <button onClick={() => toggleFav(p.id)} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center active:scale-90 transition">
            <Heart size={18} className={isFav(p.id) ? "text-rose-500" : "text-slate-500"} fill={isFav(p.id) ? "currentColor" : "none"} />
          </button>
          {imgs.length > 1 && (
            <>
              <button onClick={() => setImgIndex((i) => (i - 1 + imgs.length) % imgs.length)} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"><ChevronLeft size={18} /></button>
              <button onClick={() => setImgIndex((i) => (i + 1) % imgs.length)} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"><ChevronRight size={18} /></button>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {imgs.map((_, i) => (
                  <span key={i} onClick={() => setImgIndex(i)} className={`h-1.5 rounded-full cursor-pointer transition-all ${i === imgIndex ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2 no-scrollbar">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">{CAT_LABEL[p.cat]}</p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{p.name}</h2>
          <div className="mt-2"><PriceTag p={p} size="lg" /></div>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">{p.desc}</p>

          <p className="text-sm font-semibold text-slate-800 mt-5 mb-2">Colour</p>
          <div className="flex gap-3">
            {p.colors.map((c) => (
              <button key={c} onClick={() => setSelColor(c)} className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${selColor === c ? "border-brand-500" : "border-transparent"}`} style={{ outline: "1px solid #e2e8f0" }}>
                <span className="w-7 h-7 rounded-full" style={{ background: c }} />
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-5 mb-2">
            <p className="text-sm font-semibold text-slate-800">Size</p>
            <button onClick={() => setGuide((g) => !g)} className="text-xs font-semibold text-brand-600">Size guide</button>
          </div>
          {guide && (
            <div className="mb-3 bg-white rounded-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    {chart.cols.map((c) => <th key={c} className="text-left font-semibold px-3 py-2">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 text-slate-600">
                      {r.map((cell, j) => <td key={j} className="px-3 py-2">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {p.sizes.map((s) => (
              <button key={s} onClick={() => setSelSize(s)} className={`min-w-[48px] px-3 py-2.5 rounded-xl text-sm font-semibold ${selSize === s ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-slate-100 text-slate-500"}`}>{s}</button>
            ))}
          </div>

          {related.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800 mb-2">You may also like</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {related.map((rp) => <ProductCard key={rp.id} p={rp} wide />)}
              </div>
            </div>
          )}
        </div>

        {/* Add to cart */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          <button onClick={() => addToCart(p, selSize, selColor)} className="w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2">
            <ShoppingCart size={19} /> Add to cart · {formatINR(p.price)}
          </button>
        </div>
      </div>
    </div>
  );
}
