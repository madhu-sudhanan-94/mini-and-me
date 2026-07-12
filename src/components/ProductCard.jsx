import React, { useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import ProductImage from "./ProductImage.jsx";
import PriceTag from "./PriceTag.jsx";
import { outOfStock, lowStock } from "../lib/catalog.js";
import { useSwipe } from "../lib/useSwipe.js";
import { useStore } from "../store.jsx";

export default function ProductCard({ p, wide }) {
    const { openProduct, toggleFav, isFav, openQuickAdd, productRatings } = useStore();
    const rating = productRatings?.[p.id];
    const oos = outOfStock(p);
    const imgs = p.images || [];
    const [imgIdx, setImgIdx] = useState(0);
    const stop = (e) => e.stopPropagation();

    const swipe = useSwipe({
        onLeft: () => setImgIdx((i) => (imgs.length ? (i + 1) % imgs.length : i)),
        onRight: () => setImgIdx((i) => (imgs.length ? (i - 1 + imgs.length) % imgs.length : i)),
    });

    return (
        <div onClick={() => openProduct(p)} className={`text-left bg-white rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition active:scale-[0.98] cursor-pointer ${wide ? "w-40 shrink-0" : ""}`}>
            <div className={`relative bg-linear-to-br from-accent-50 to-brand-100 h-[180px] overflow-hidden select-none ${wide ? "" : "touch-pan-y"}`}>
                <ProductImage key={imgIdx} p={p} color={p.colors[0]} index={imgIdx} />
                {/* swipe layer — only for grid cards; wide (carousel) cards let the row scroll horizontally */}
                {!wide && imgs.length > 1 && <div {...swipe} aria-hidden="true" className="absolute inset-0 z-[1]" />}

                {oos && (
                    <div className="absolute inset-0 z-10 bg-white/55 flex items-center justify-center">
                        <span className="bg-slate-900/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">Out of stock</span>
                    </div>
                )}
                {!oos && p.original && p.tag !== "new" && <span className="absolute z-10 top-1.5 left-1.5 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">SALE</span>}
                {!oos && p.tag === "new" && <span className="absolute z-10 top-1.5 left-1.5 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">NEW</span>}

                {/* favourite */}
                <button
                    onClick={(e) => {
                        stop(e);
                        toggleFav(p.id);
                    }}
                    aria-label={isFav(p.id) ? "Remove from favourites" : "Add to favourites"}
                    className="absolute z-10 top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center active:scale-90 transition"
                >
                    <Heart size={14} className={isFav(p.id) ? "text-rose-500" : "text-slate-400"} fill={isFav(p.id) ? "currentColor" : "none"} />
                </button>

                {/* image dots (centered) */}
                {imgs.length > 1 && (
                    <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 z-10">
                        {imgs.map((_, i) => (
                            <span
                                key={i}
                                onClick={(e) => {
                                    stop(e);
                                    setImgIdx(i);
                                }}
                                className={`h-1.5 rounded-full cursor-pointer transition-all ${i === imgIdx ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                            />
                        ))}
                    </div>
                )}

                {/* add-to-cart quick action → opens the size bottom sheet */}
                {!oos && (
                    <button
                        onClick={(e) => {
                            stop(e);
                            openQuickAdd(p);
                        }}
                        aria-label="Add to cart"
                        className="absolute bottom-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-brand-600 flex items-center justify-center shadow-sm active:scale-90 transition"
                    >
                        <ShoppingCart size={14} />
                    </button>
                )}
            </div>

            <div className="px-2.5 pt-2 pb-2.5">
                <p className="text-[13px] font-semibold text-slate-800 truncate">{p.name}</p>
                {rating && rating.count > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                        <Star size={11} className="text-amber-400" fill="currentColor" />
                        <span className="text-[11px] font-semibold text-slate-600">{rating.avg.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400">({rating.count})</span>
                    </div>
                )}
                <div className="mt-0.5">
                    <PriceTag p={p} />
                </div>
                {lowStock(p) && <p className="text-[10px] font-semibold text-amber-600 mt-0.5">Only {p.stock} left</p>}
            </div>
        </div>
    );
}
