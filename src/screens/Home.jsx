import React, { useState } from "react";
import { Heart, ShoppingCart, Search, Sparkles, ArrowRight, User, SearchX, X } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import { heroBlue } from "../theme.js";
import BrandLogo from "../components/BrandLogo.jsx";
import { formatINR, CAT_LABEL } from "../lib/format.js";
import ProductCard from "../components/ProductCard.jsx";
import ProductImage from "../components/ProductImage.jsx";
import Garment from "../components/Garment.jsx";
import { useSwipe } from "../lib/useSwipe.js";
import Pagination from "../components/Pagination.jsx";
import { useStore } from "../store.jsx";

const ALL_PAGE = 12;

export default function Home() {
  const { products, query, setQuery, favorites, cartCount, setScreen, setSelCategory, heroIndex, setHeroIndex, openProduct, profile } = useStore();
  const firstName = (profile?.full_name || "").trim().split(/\s+/)[0] || "";

  const featured = products.filter((p) => p.trending).slice(0, 5);
  const heroP = featured.length ? featured[heroIndex % featured.length] : products[0];
  const trending = products.filter((p) => p.trending);
  const newIn = [...products.filter((p) => p.tag === "new"), ...products.filter((p) => p.tag !== "new")].slice(0, 6);
  const [allPage, setAllPage] = useState(1);
  const allPageCount = Math.max(1, Math.ceil(products.length / ALL_PAGE));
  const allSafe = Math.min(allPage, allPageCount);
  const allShown = products.slice((allSafe - 1) * ALL_PAGE, allSafe * ALL_PAGE);
  const cats = ["kids", "women", "men"];
  const catColor = { women: "from-rose-400 to-pink-500", men: "from-brand-500 to-indigo-500", kids: "from-amber-400 to-orange-500" };
  const catShape = { women: "dress", men: "shirt", kids: "overall" };
  const catImg = {};
  for (const c of cats) {
    const withImg = products.find((p) => p.cat === c && p.images && p.images[0]);
    if (withImg) catImg[c] = withImg.images[0];
  }
  const results = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const heroLen = featured.length;
  const goHero = (dir) => { if (heroLen) setHeroIndex((((heroIndex % heroLen) + dir) % heroLen + heroLen) % heroLen); };
  const heroSwipe = useSwipe({ onLeft: () => goHero(1), onRight: () => goHero(-1) });
  return (
    <div className="pb-4">
      <div className="lg:hidden sticky top-[-1px] z-20 bg-slate-50/95 backdrop-blur-sm px-5 pt-3 pb-2 flex items-center justify-between">
        <div>
          {firstName && <p className="text-slate-400 text-xs mb-0.5">Hi, {firstName} 👋</p>}
          <BrandLogo imgClass="h-6" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScreen("favorites")} aria-label="Favourites" className="relative w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center">
            <Heart size={19} className="text-slate-700" />
            {favorites.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{favorites.length}</span>}
          </button>
          <button onClick={() => setScreen("cart")} aria-label="Cart" className="relative w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center">
            <ShoppingCart size={19} className="text-slate-700" />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{cartCount}</span>}
          </button>
          <button onClick={() => setScreen("account")} aria-label="Account" className="w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={19} className="text-slate-700" />}
          </button>
        </div>
      </div>

      <div className="lg:hidden px-5 mt-4">
        <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-xs">
          <Search size={18} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dresses, kurtas, jeans…" className="flex-1 ml-3 outline-hidden text-sm bg-transparent" />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="ml-2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 flex items-center justify-center shrink-0 transition">
              <X size={14} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {query.trim() ? (
        <div className="px-5 mt-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Results for “{query}”</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {results.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {results.length === 0 && <EmptyState icon={SearchX} title="No matches" subtitle="Try another search term." className="py-16" />}
        </div>
      ) : (
        <>
          {/* Hero carousel */}
          <div className="px-5 mt-5">
            <button {...heroSwipe} onClick={() => openProduct(heroP)} className="w-full text-left relative rounded-3xl overflow-hidden p-5 h-52 lg:h-80 flex flex-col justify-end touch-pan-y select-none" style={heroBlue}>
              <ProductImage p={heroP} color="#ffffff" />
              <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
              <span className="absolute top-4 left-4 z-10 bg-white/25 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">✨ Featured</span>
              <h3 className="text-white text-2xl font-extrabold relative z-10 leading-tight max-w-[70%] drop-shadow-sm">{heroP.name}</h3>
              <div className="flex items-baseline gap-2 mt-1 relative z-10">
                <span className="text-white text-xl font-bold drop-shadow-sm">{formatINR(heroP.price)}</span>
                {heroP.original && <span className="text-brand-100 line-through text-sm">{formatINR(heroP.original)}</span>}
              </div>
            </button>
            {featured.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {featured.map((_, i) => (
                  <span key={i} onClick={() => setHeroIndex(i)} className={`h-1.5 rounded-full cursor-pointer transition-all ${i === heroIndex % featured.length ? "w-5 bg-brand-600" : "w-1.5 bg-slate-300"}`} />
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="mt-6 px-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Shop by category</h3>
              <button onClick={() => { setSelCategory("kids"); setScreen("category"); }} className="text-brand-600 text-sm font-semibold">See all</button>
            </div>
            <div className="flex justify-around lg:justify-start lg:gap-12">
              {cats.map((c) => (
                <button key={c} onClick={() => { setSelCategory(c); setScreen("category"); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-full overflow-hidden shadow-md ring-1 ring-black/5 group-hover:shadow-lg group-active:scale-95 transition">
                    {catImg[c] ? (
                      <img src={catImg[c]} alt={CAT_LABEL[c]} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-linear-to-br ${catColor[c]}`}>
                        <Garment shape={catShape[c]} color="#ffffff" className="h-[58%]" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs lg:text-sm font-semibold text-slate-700">{CAT_LABEL[c]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Offers */}
          <div className="px-5 mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => { setSelCategory("women"); setScreen("category"); }} className="relative overflow-hidden rounded-2xl p-4 h-28 flex flex-col justify-between text-left bg-linear-to-br from-fuchsia-500 to-pink-500 shadow-md active:scale-95 transition">
              <span className="text-white/90 text-[11px] font-semibold uppercase tracking-wide">Festive Edit</span>
              <div>
                <p className="text-white font-extrabold text-lg leading-tight">Up to 40% off</p>
                <p className="text-white/85 text-[11px] flex items-center gap-1">Shop the sale <ArrowRight size={12} /></p>
              </div>
            </button>
            <button onClick={() => { setSelCategory("kids"); setScreen("category"); }} className="relative overflow-hidden rounded-2xl p-4 h-28 flex flex-col justify-between text-left bg-linear-to-br from-brand-600 to-accent-500 shadow-md active:scale-95 transition">
              <span className="text-white/90 text-[11px] font-semibold uppercase tracking-wide">Just In</span>
              <div>
                <p className="text-white font-extrabold text-lg leading-tight">New Arrivals</p>
                <p className="text-white/85 text-[11px] flex items-center gap-1">Explore now <ArrowRight size={12} /></p>
              </div>
            </button>
          </div>

          {/* Trending */}
          <div className="mt-6">
            <div className="px-5 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Trending now</h3>
              <button onClick={() => { setSelCategory("women"); setScreen("category"); }} className="text-brand-600 text-sm font-semibold">See all</button>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
              {trending.map((p) => <ProductCard key={p.id} p={p} wide />)}
            </div>
          </div>

          {/* Promo banner */}
          <div className="px-5 mt-5">
            <div className="rounded-2xl p-4 flex items-center gap-3 bg-linear-to-r from-violet-500 to-fuchsia-500 shadow-md">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Sparkles size={22} className="text-white" /></div>
              <div>
                <p className="text-white font-bold">Festive Sale is live</p>
                <p className="text-white/85 text-xs">Up to 40% off across the store</p>
              </div>
            </div>
          </div>

          {/* New in */}
          <div className="mt-6 px-5">
            <h3 className="font-bold text-slate-900 text-lg mb-3">New in</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {newIn.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>

          {/* All items */}
          <div className="mt-8 px-5">
            <h3 className="font-bold text-slate-900 text-lg mb-3">All items</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {allShown.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
            <Pagination page={allSafe} pageCount={allPageCount} onChange={setAllPage} />
          </div>
        </>
      )}
    </div>
  );
}
