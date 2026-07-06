import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { X, Heart, ChevronLeft, ChevronRight, ShoppingCart, Share2, Link as LinkIcon } from "lucide-react";
import { formatINR, CAT_LABEL } from "../lib/format.js";
import { outOfStock, lowStock } from "../lib/catalog.js";
import { SIZE_GUIDE } from "../lib/sizeguide.js";
import { BRAND } from "../brand.config.js";
import Garment from "../components/Garment.jsx";
import PriceTag from "../components/PriceTag.jsx";
import ProductCard from "../components/ProductCard.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useSwipe } from "../lib/useSwipe.js";
import { useStore } from "../store.jsx";

/* Brand share icons (white on brand colour). */
const WhatsAppIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2s-.8.9-.9 1.1c-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z" /><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.3C8.7 21.5 10.3 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3C4 15.4 3.5 13.7 3.5 12 3.5 7.3 7.3 3.5 12 3.5S20.5 7.3 20.5 12 16.7 20 12 20z" /></svg>);
const FacebookIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12z" /></svg>);
const TelegramIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M9.8 15.6l-.4 4.6c.5 0 .8-.2 1.1-.5l2.6-2.5 5.4 3.9c1 .5 1.7.3 2-.9l3.6-16.9c.3-1.4-.5-2-1.5-1.6L1.2 9.4c-1.4.5-1.3 1.3-.2 1.7l5.4 1.7L18 5.5c.6-.4 1.1-.2.7.2z" /></svg>);
const XIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-7-6.2 7H1.6l8.1-9.3L1 2h7l4.9 6.4L18.9 2zm-1.2 18h1.9L7.4 4H5.4l12.3 16z" /></svg>);

/* Product detail — full-screen on mobile, centred card on desktop. */
export default function ProductModal() {
  const {
    products, selProduct, closeProduct, toggleFav, isFav, showToast,
    imgIndex, setImgIndex, selColor, setSelColor, selSize, setSelSize, addToCart,
  } = useStore();
  const [guide, setGuide] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef(null);

  // Swipe between images (declared before the early-return to satisfy rules of hooks).
  const imgSwipe = useSwipe({
    onLeft: () => setImgIndex((i) => { const n = (selProduct?.images || []).length; return n ? (i + 1) % n : i; }),
    onRight: () => setImgIndex((i) => { const n = (selProduct?.images || []).length; return n ? (i - 1 + n) % n : i; }),
  });

  const p = selProduct;
  // reset transient view state when the product / image changes
  useEffect(() => { setZoomed(false); setImgFailed(false); }, [imgIndex, p?.id]);
  useEffect(() => { setDescExpanded(false); setShareOpen(false); }, [p?.id]);
  // does the (clamped) description overflow 2 lines? → show "See more"
  useLayoutEffect(() => {
    const el = descRef.current;
    if (el) setDescOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [p?.id, p?.desc]);

  if (!p) return null;
  const oos = outOfStock(p);
  const low = lowStock(p);
  const imgs = p.images || [];
  const src = imgs[imgIndex];
  const chart = SIZE_GUIDE[p.cat] || SIZE_GUIDE.women;
  const related = products.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 8);

  const shareUrl = (typeof window !== "undefined") ? (window.location.origin + window.location.pathname + "?p=" + p.id) : "";
  const shareText = `Check out ${p.name} — ${formatINR(p.price)} on ${BRAND.name}`;
  const openShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: p.name, text: shareText, url: shareUrl }); return; }
      catch (e) { if (e && e.name === "AbortError") return; } // fall through to the sheet
    }
    setShareOpen(true);
  };
  const openWin = (url) => { if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer"); setShareOpen(false); };
  const shareTargets = [
    { name: "WhatsApp", bg: "#25D366", icon: <WhatsAppIcon />, action: () => openWin("https://wa.me/?text=" + encodeURIComponent(shareText + " " + shareUrl)) },
    { name: "Facebook", bg: "#1877F2", icon: <FacebookIcon />, action: () => openWin("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareUrl)) },
    { name: "Telegram", bg: "#229ED9", icon: <TelegramIcon />, action: () => openWin("https://t.me/share/url?url=" + encodeURIComponent(shareUrl) + "&text=" + encodeURIComponent(shareText)) },
    { name: "X", bg: "#000000", icon: <XIcon />, action: () => openWin("https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareText) + "&url=" + encodeURIComponent(shareUrl)) },
    { name: "Copy link", bg: "#e2e8f0", icon: <LinkIcon size={20} className="text-slate-600" />, action: async () => { try { await navigator.clipboard.writeText(shareUrl); showToast("Product link copied"); } catch { showToast("Couldn't copy the link"); } setShareOpen(false); } },
  ];

  return (
    <div className="absolute lg:fixed inset-0 z-40 flex flex-col lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={closeProduct} />
      <div className="relative h-full w-full lg:h-auto lg:w-[460px] lg:max-w-[92vw] bg-slate-50 lg:rounded-4xl max-h-full lg:max-h-[88vh] flex flex-col overflow-hidden shadow-2xl" style={{ animation: "vkUp .25s ease" }}>
        {/* Floating controls (stay put even when the image is zoom-scrolled) */}
        <button onClick={closeProduct} aria-label="Close" className="absolute top-3 left-3 z-20 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-xs"><X size={18} /></button>
        <button onClick={() => toggleFav(p.id)} aria-label={isFav(p.id) ? "Remove from favourites" : "Add to favourites"} className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-xs active:scale-90 transition">
          <Heart size={18} className={isFav(p.id) ? "text-rose-500" : "text-slate-500"} fill={isFav(p.id) ? "currentColor" : "none"} />
        </button>

        {/* Image — tap to zoom (scroll to pan when zoomed) */}
        <div
          {...(!zoomed && imgs.length > 1 ? imgSwipe : {})}
          className={`relative shrink-0 h-72 sm:h-80 bg-linear-to-br from-accent-100 to-brand-200 ${zoomed ? "overflow-auto no-scrollbar" : "overflow-hidden touch-pan-y select-none"}`}
        >
          {src && !imgFailed ? (
            <img
              src={src} alt={p.name} onError={() => setImgFailed(true)}
              onClick={() => imgs.length && setZoomed((z) => !z)}
              className={zoomed ? "h-auto w-[190%] max-w-none cursor-zoom-out" : "w-full h-full object-cover cursor-zoom-in"}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center"><Garment shape={p.shape} color={selColor || p.colors[0]} className="h-[80%]" /></div>
          )}
          {!zoomed && imgs.length > 1 && (
            <>
              <button onClick={() => setImgIndex((i) => (i - 1 + imgs.length) % imgs.length)} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"><ChevronLeft size={18} /></button>
              <button onClick={() => setImgIndex((i) => (i + 1) % imgs.length)} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"><ChevronRight size={18} /></button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {imgs.length > 1 && (
          <div className="shrink-0 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar px-4 py-2.5">
            {imgs.map((thumb, i) => (
              <button key={i} onClick={() => setImgIndex(i)} aria-label={`Image ${i + 1}`} className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 ring-2 transition ${i === imgIndex ? "ring-brand-500" : "ring-slate-200"}`}>
                <img src={thumb} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Details (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2 no-scrollbar">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">{CAT_LABEL[p.cat]}</p>
          {/* name left · price right */}
          <div className="flex items-start justify-between gap-3 mt-1">
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{p.name}</h2>
            <div className="shrink-0 text-right"><PriceTag p={p} size="lg" /></div>
          </div>
          {oos ? <p className="text-xs font-semibold text-red-500 mt-2">Currently out of stock</p>
            : low ? <p className="text-xs font-semibold text-amber-600 mt-2">Hurry — only {p.stock} left</p> : null}

          {/* description — 2 lines + See more */}
          {p.desc && (
            <div className="mt-3">
              <p ref={descRef} className={`text-slate-500 text-sm leading-relaxed ${descExpanded ? "" : "line-clamp-2"}`}>{p.desc}</p>
              {(descOverflows || descExpanded) && (
                <button onClick={() => setDescExpanded((v) => !v)} className="text-xs font-semibold text-brand-600 mt-1">{descExpanded ? "See less" : "See more"}</button>
              )}
            </div>
          )}

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

        {/* Share + Add to cart */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex items-center gap-3">
          <button onClick={openShare} aria-label="Share" className="w-14 h-14 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition">
            <Share2 size={20} />
          </button>
          {oos ? (
            <button disabled className="flex-1 bg-slate-200 text-slate-400 font-bold py-4 rounded-xl cursor-not-allowed">Out of stock</button>
          ) : (
            <PrimaryButton variant="gradient" size="xl" full={false} onClick={() => addToCart(p, selSize, selColor)} className="flex-1">
              <ShoppingCart size={19} /> Add to cart · {formatINR(p.price)}
            </PrimaryButton>
          )}
        </div>

        {/* Share sheet (fallback when the OS share sheet isn't available) */}
        {shareOpen && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={() => setShareOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white rounded-t-3xl p-5 pb-7" onClick={(e) => e.stopPropagation()} style={{ animation: "vkUp .25s ease" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-slate-800">Share this product</p>
                <button onClick={() => setShareOpen(false)} aria-label="Close" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X size={16} className="text-slate-500" /></button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {shareTargets.map((t) => (
                  <button key={t.name} onClick={t.action} className="flex flex-col items-center gap-1.5 active:scale-95 transition">
                    <span className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center" style={{ background: t.bg }}>{t.icon}</span>
                    <span className="text-[10px] text-slate-500 text-center leading-tight">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
