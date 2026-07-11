import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { X, Heart, ShoppingCart, Share2, Link as LinkIcon, Maximize2 } from "lucide-react";
import { formatINR, CAT_LABEL } from "../lib/format.js";
import { outOfStock, colorFamily, familyLabel, stockFor, sizeOutOfStock, sizeLowStock, hasSizeStock } from "../lib/catalog.js";
import { SIZE_GUIDE } from "../lib/sizeguide.js";
import { BRAND } from "../brand.config.js";
import Garment from "../components/Garment.jsx";
import PriceTag from "../components/PriceTag.jsx";
import ProductCard from "../components/ProductCard.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import ReviewsSection from "../components/ReviewsSection.jsx";
import QtyStepper from "../components/QtyStepper.jsx";
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
    imgIndex, setImgIndex, selColor, setSelColor, selSize, setSelSize, addToCart, buyNow,
  } = useStore();
  const [guide, setGuide] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const [qty, setQty] = useState(1);
  const descRef = useRef(null);

  // Swipe between images (declared before the early-return to satisfy rules of hooks).
  const imgSwipe = useSwipe({
    onLeft: () => setImgIndex((i) => { const n = (selProduct?.images || []).length; return n ? (i + 1) % n : i; }),
    onRight: () => setImgIndex((i) => { const n = (selProduct?.images || []).length; return n ? (i - 1 + n) % n : i; }),
  });

  const p = selProduct;
  // reset transient view state when the product / image changes
  useEffect(() => { setImgFailed(false); }, [imgIndex, p?.id]);
  useEffect(() => { setDescExpanded(false); setShareOpen(false); setLightbox(false); setQty(1); }, [p?.id]);
  useEffect(() => { setQty(1); }, [selSize]); // reset quantity when the size changes
  // Esc closes the full-screen image viewer first (if open)
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); setLightbox(false); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [lightbox]);
  // does the (clamped) description overflow 2 lines? → show "See more"
  useLayoutEffect(() => {
    const el = descRef.current;
    if (el) setDescOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [p?.id, p?.desc]);

  if (!p) return null;
  const oos = outOfStock(p);
  const selSoldOut = sizeOutOfStock(p, selSize);
  const qMax = (() => { const s = stockFor(p, selSize); return typeof s === "number" ? Math.max(1, s) : 99; })();
  const isFreeSize = p.sizes.length === 1 && String(p.sizes[0]).toLowerCase() === "free";
  const imgs = p.images || [];
  const src = imgs[imgIndex];
  const chart = SIZE_GUIDE[p.cat] || SIZE_GUIDE.women;
  // Similar items — same category first; only fall back to trending if the
  // category is too thin. hasDesc hides the block for empty / placeholder text.
  const catLabel = CAT_LABEL[p.cat] || p.cat;
  const sameCat = products.filter((x) => x.cat === p.cat && x.id !== p.id);
  const fillers = products.filter((x) => x.id !== p.id && x.cat !== p.cat && x.trending);
  const usingFallback = sameCat.length < 4;
  const related = (usingFallback ? [...sameCat, ...fillers] : sameCat).slice(0, 8);
  const rawDesc = (p.desc || "").trim();
  const hasDesc = rawDesc.length > 0 && rawDesc.toLowerCase() !== "added by admin.";
  const detailRows = [
    ["Category", CAT_LABEL[p.cat] || p.cat],
    ["Type", p.shape ? p.shape.charAt(0).toUpperCase() + p.shape.slice(1) : "—"],
    ["Colours", Array.from(new Set((p.colors || []).map((c) => familyLabel(colorFamily(c))))).join(", ") || "—"],
    ["Sizes", isFreeSize ? "Free size" : ((p.sizes || []).join(" · ") || "—")],
  ];

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
    <div className="fixed sm:max-lg:absolute inset-0 z-40 flex flex-col lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={closeProduct} />
      <div className="relative h-full w-full lg:h-auto lg:w-[460px] lg:max-w-[92vw] bg-slate-50 lg:rounded-4xl max-h-full lg:max-h-[88vh] flex flex-col overflow-hidden shadow-2xl" style={{ animation: "vkUp .25s ease" }}>
        {/* Header scrolls away with the content (not pinned). */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="relative z-30 flex items-center gap-1 px-2.5 py-2.5 bg-white/95 backdrop-blur border-b border-slate-100">
          <button onClick={closeProduct} aria-label="Close" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center active:scale-90 transition shrink-0"><X size={20} className="text-slate-700" /></button>
          <p className="flex-1 min-w-0 truncate text-[15px] font-bold text-slate-900 px-1">{p.name}</p>
          <button onClick={openShare} aria-label="Share" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center active:scale-90 transition shrink-0"><Share2 size={18} className="text-slate-700" /></button>
          <button onClick={() => toggleFav(p.id)} aria-label={isFav(p.id) ? "Remove from favourites" : "Add to favourites"} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center active:scale-90 transition shrink-0"><Heart size={19} className={isFav(p.id) ? "text-rose-500" : "text-slate-700"} fill={isFav(p.id) ? "currentColor" : "none"} /></button>
        </div>

          {/* Image — tap to open the full-screen viewer */}
          <div
            {...(imgs.length > 1 ? imgSwipe : {})}
            className="relative h-72 sm:h-80 bg-linear-to-br from-accent-100 to-brand-200 overflow-hidden touch-pan-y"
          >
            {src && !imgFailed ? (
              <img
                src={src} alt={p.name} onError={() => setImgFailed(true)}
                onClick={() => imgs.length && setLightbox(true)}
                className="w-full h-full object-contain cursor-zoom-in"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"><Garment shape={p.shape} color={selColor || p.colors[0]} className="h-[80%]" /></div>
            )}
            {/* Dot indicators */}
            {imgs.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
                {imgs.map((_, i) => (
                  <button key={i} onClick={() => setImgIndex(i)} aria-label={`Image ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
                ))}
              </div>
            )}
            {/* Full-screen button */}
            {src && !imgFailed && (
              <button onClick={() => setLightbox(true)} aria-label="View full screen" className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-xs active:scale-90 transition">
                <Maximize2 size={15} className="text-slate-600" />
              </button>
            )}
          </div>

          {/* Details */}
          <div className="px-6 pt-4 pb-2">
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">{p.name}</h2>
          {oos ? <p className="text-xs font-semibold text-red-500 mt-2">Currently out of stock</p>
            : selSoldOut ? <p className="text-xs font-semibold text-red-500 mt-2">Size {selSize} is out of stock</p>
            : sizeLowStock(p, selSize) ? <p className="text-xs font-semibold text-amber-600 mt-2">Hurry — only {stockFor(p, selSize)} left{hasSizeStock(p) ? ` in size ${selSize}` : ""}</p> : null}

          {/* description — 2 lines + See more (hidden when empty / placeholder) */}
          {hasDesc && (
            <div className="mt-1">
              <p ref={descRef} className={`text-slate-500 text-sm leading-relaxed ${descExpanded ? "" : "line-clamp-2"}`}>{p.desc}</p>
              {(descOverflows || descExpanded) && (
                <button onClick={() => setDescExpanded((v) => !v)} className="text-xs font-semibold text-brand-600 mt-1">{descExpanded ? "See less" : "See more"}</button>
              )}
            </div>
          )}

          {/* Price (below the description) */}
          <div className="mt-3"><PriceTag p={p} size="lg" /></div>

          {p.colors.length > 1 && (
            <>
              <p className="text-sm font-semibold text-slate-800 mt-5 mb-2">Colour</p>
              <div className="flex gap-3">
                {p.colors.map((c) => (
                  <button key={c} onClick={() => setSelColor(c)} className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${selColor === c ? "border-brand-500" : "border-transparent"}`} style={{ outline: "1px solid #e2e8f0" }}>
                    <span className="w-7 h-7 rounded-full" style={{ background: c }} />
                  </button>
                ))}
              </div>
            </>
          )}

          {!isFreeSize && (
          <>
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
            {p.sizes.map((s) => {
              const soldOut = sizeOutOfStock(p, s);
              return (
                <button key={s} onClick={() => !soldOut && setSelSize(s)} disabled={soldOut} aria-label={soldOut ? `Size ${s} — out of stock` : `Size ${s}`} className={`min-w-[48px] px-3 py-2.5 rounded-xl text-sm font-semibold transition ${soldOut ? "bg-slate-100 text-slate-300 line-through cursor-not-allowed" : selSize === s ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-slate-100 text-slate-500"}`}>{s}</button>
              );
            })}
          </div>
          </>
          )}

          {/* quantity */}
          {!oos && !selSoldOut && (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Quantity</p>
              <QtyStepper value={qty} onDecrement={() => setQty((q) => Math.max(1, q - 1))} onIncrement={() => setQty((q) => Math.min(q + 1, qMax))} max={qMax} />
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800 mb-2">{usingFallback ? "You may also like" : `Similar in ${catLabel}`}</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-3 -mx-6 px-6">
                {related.map((rp) => <ProductCard key={rp.id} p={rp} wide />)}
              </div>
            </div>
          )}

          {/* Product details */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-800 mb-2">Product details</p>
            <dl className="bg-white rounded-xl border border-slate-100 overflow-hidden text-sm">
              {detailRows.map(([k, v], i) => (
                <div key={k} className={`flex justify-between gap-4 px-3 py-2.5 ${i > 0 ? "border-t border-slate-100" : ""}`}>
                  <dt className="text-slate-500 shrink-0">{k}</dt>
                  <dd className="text-slate-800 font-medium text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Ratings & reviews */}
          <ReviewsSection productId={p.id} />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          {oos ? (
            <button disabled className="w-full bg-slate-200 text-slate-400 font-bold py-4 rounded-xl cursor-not-allowed">Out of stock</button>
          ) : selSoldOut ? (
            <button disabled className="w-full bg-slate-200 text-slate-400 font-bold py-4 rounded-xl cursor-not-allowed">Size {selSize} out of stock</button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => addToCart(p, selSize, selColor, qty)} className="flex-1 inline-flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-brand-700 bg-brand-50 border border-brand-200 active:scale-[0.97] transition">
                <ShoppingCart size={19} /> Add to cart
              </button>
              <PrimaryButton variant="gradient" size="xl" full={false} onClick={() => buyNow(p, selSize, selColor, qty)} className="flex-1 border border-transparent">
                Buy now
              </PrimaryButton>
            </div>
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

      {/* Full-screen image viewer — swipe to change, dots, tap backdrop / Esc to close */}
      {lightbox && (
        <div className="absolute inset-0 z-50 flex flex-col offer-fade bg-black/50 backdrop-blur-md">
          <button onClick={() => setLightbox(false)} aria-label="Close" className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-white flex items-center justify-center transition active:scale-90"><X size={20} /></button>
          <div
            {...(imgs.length > 1 ? imgSwipe : {})}
            onClick={() => setLightbox(false)}
            className="relative z-10 flex-1 flex items-center justify-center overflow-hidden touch-pan-y p-4"
          >
            {src && !imgFailed ? (
              <img src={src} alt={p.name} onError={() => setImgFailed(true)} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl shadow-black/25" />
            ) : (
              <Garment shape={p.shape} color={selColor || p.colors[0]} className="h-[70%]" />
            )}
          </div>
          {imgs.length > 1 && (
            <div className="absolute inset-x-0 bottom-7 z-20 flex justify-center gap-2">
              {imgs.map((_, i) => (
                <button key={i} onClick={() => setImgIndex(i)} aria-label={`Image ${i + 1}`} className={`h-2 rounded-full transition-all shadow-sm shadow-black/30 ${i === imgIndex ? "w-6 bg-white" : "w-2 bg-white/60"}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
