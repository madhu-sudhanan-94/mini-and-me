import React, { useState, useMemo } from "react";
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
import { searchProducts } from "../lib/catalog.js";
import { useStore } from "../store.jsx";

const ALL_PAGE = 12;

export default function Home() {
  const { products, query, setQuery, favorites, cartCount, setScreen, setSelCategory, heroIndex, setHeroIndex, openProduct, profile } = useStore();
  const firstName = (profile?.full_name || "").trim().split(/\s+/)[0] || "";

  const featured = products.filter((p) => p.trending).slice(0, 5);
  const heroP = featured.length ? featured[heroIndex % featured.length] : products[0];
  // Trending: the trending-tagged products first (shuffled for freshness),
  // then any other products to fill up to a max of 20.
  const trending = useMemo(() => {
    const t = products.filter((p) => p.trending);
    for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; }
    return t.slice(0, 20);
  }, [products]);
  // New in: ONLY products tagged "new" (max 20).
  const newIn = products.filter((p) => p.tag === "new").slice(0, 20);
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
  const results = searchProducts(products, query);
  const heroLen = featured.length;
  const goHero = (dir) => { if (heroLen) setHeroIndex((((heroIndex % heroLen) + dir) % heroLen + heroLen) % heroLen); };
  const heroSwipe = useSwipe({ onLeft: () => goHero(1), onRight: () => goHero(-1) });
  return (
    <div className="pb-4">
      <div className="min-h-[66px] lg:hidden sticky top-[-1px] z-20 bg-slate-50/95 backdrop-blur-sm px-5 pt-3 pb-2 flex items-center justify-between">
        <div>
          {firstName && <p className="-mt-1 text-slate-400 text-xs mb-0.5">Hi, {firstName} 👋</p>}
          <BrandLogo imgClass={`${firstName ? "h-8" : "h-9"} ml-[-5px]`} />
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
        <div className="flex items-center bg-white rounded-2xl pl-4 pr-3 py-3 shadow-xs">
          <Search size={18} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dresses, kurtas, jeans…" className="flex-1 ml-3 outline-hidden text-sm bg-transparent" />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="ml-2 w-5 h-5 rounded-full active:scale-90 flex items-center justify-center shrink-0 transition">
              <X size={16} className="text-slate-500" />
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
            <button {...heroSwipe} onClick={() => openProduct(heroP)} className="w-full text-left relative rounded-3xl overflow-hidden p-5 h-52 lg:h-80 flex flex-col justify-end touch-pan-y" style={heroBlue}>
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
              <button onClick={() => { setSelCategory("all"); setScreen("category"); }} className="text-brand-600 text-sm font-semibold">See all</button>
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

          {/* Offers — glass cards: gloss sheen + light-source glow + color bloom + AA scrim */}
          <div className="px-5 mt-6 grid grid-cols-2 gap-3">
            {/* Festive Edit — warm glass */}
            <button
              onClick={() => { setSelCategory("women"); setScreen("category"); }}
              className="group relative isolate flex h-[120px] flex-col justify-between overflow-hidden rounded-3xl p-4 text-left bg-linear-to-tr from-fuchsia-600 via-pink-500 to-orange-400 shadow-[0_16px_34px_-12px_rgba(219,39,119,0.6),inset_0_0_0_1px_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-12px_rgba(219,39,119,0.7),inset_0_0_0_1px_rgba(255,255,255,0.22)] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-white/30 via-white/10 to-transparent" />
              <span aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/35 blur-2xl" />
              <span aria-hidden className="pointer-events-none absolute -left-9 -bottom-10 h-28 w-28 rounded-full bg-rose-300/35 blur-3xl" />
              <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/25 via-black/5 to-transparent" />
              <span className="relative z-10 inline-flex items-center gap-1 self-start whitespace-nowrap rounded-full bg-white/15 px-2 py-1 ring-1 ring-inset ring-white/25 backdrop-blur-md">
                <Sparkles size={10} className="text-white" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white">Festive Edit</span>
              </span>
              <div className="relative z-10">
                <p className="promo-textshine text-[17px] font-extrabold leading-tight tracking-tight">Up to 40% off</p>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="whitespace-nowrap text-[11px] font-medium text-white/90">Shop the sale</span>
                  <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20 ring-1 ring-inset ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowRight size={13} className="text-white" />
                  </span>
                </div>
              </div>
            </button>

            {/* Just In — brand-blue glass */}
            <button
              onClick={() => { setSelCategory("kids"); setScreen("category"); }}
              className="group relative isolate flex h-[120px] flex-col justify-between overflow-hidden rounded-3xl p-4 text-left bg-linear-to-tr from-brand-700 via-brand-600 to-accent-500 shadow-[0_16px_34px_-12px_rgba(37,99,235,0.6),inset_0_0_0_1px_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-12px_rgba(37,99,235,0.7),inset_0_0_0_1px_rgba(255,255,255,0.22)] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-white/28 via-white/10 to-transparent" />
              <span aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
              <span aria-hidden className="pointer-events-none absolute -left-9 -bottom-10 h-28 w-28 rounded-full bg-accent-400/35 blur-3xl" />
              <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/25 via-black/5 to-transparent" />
              <span className="relative z-10 inline-flex items-center gap-1 self-start whitespace-nowrap rounded-full bg-white/15 px-2 py-1 ring-1 ring-inset ring-white/25 backdrop-blur-md">
                <Sparkles size={10} className="text-white" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white">Just In</span>
              </span>
              <div className="relative z-10">
                <p className="promo-textshine text-[17px] font-extrabold leading-tight tracking-tight">New Arrivals</p>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="whitespace-nowrap text-[11px] font-medium text-white/90">Explore now</span>
                  <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20 ring-1 ring-inset ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowRight size={13} className="text-white" />
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Trending */}
          {trending.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between px-5">
                <h3 className="font-bold text-slate-900 text-lg">Trending now</h3>
                <button onClick={() => { setSelCategory("trending"); setScreen("category"); }} className="text-brand-600 text-sm font-semibold">See all</button>
              </div>
              <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
                {trending.map((p) => <ProductCard key={p.id} p={p} wide />)}
              </div>
            </div>
          )}

          {/* Promo banner — glass style matching the offer cards above */}
          <div className="px-5 mt-5">
            <button
              type="button"
              onClick={() => { setSelCategory("women"); setScreen("category"); }}
              className="group relative isolate w-full overflow-hidden rounded-3xl p-4 flex items-center gap-3 text-left text-white bg-linear-to-tr from-violet-600 via-fuchsia-500 to-pink-400 shadow-[0_16px_34px_-12px_rgba(139,92,246,0.6),inset_0_0_0_1px_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-12px_rgba(139,92,246,0.7),inset_0_0_0_1px_rgba(255,255,255,0.22)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              {/* glossy top sheen */}
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/25 via-white/10 to-transparent" />
              {/* top-right light source */}
              <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
              {/* opposite-corner color bloom for depth */}
              <span aria-hidden className="pointer-events-none absolute -left-10 -bottom-12 h-32 w-32 rounded-full bg-fuchsia-300/35 blur-3xl" />

              <div className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur-md">
                <Sparkles size={22} className="text-white" aria-hidden />
              </div>
              <div className="relative z-10 min-w-0 flex-1">
                <p className="promo-textshine font-bold tracking-tight">Festive Sale is live</p>
                <p className="text-white/85 text-xs mt-0.5">
                  Up to <span className="font-semibold text-white">40%</span> off across the store
                </p>
              </div>
              <span className="relative z-10 shrink-0 inline-flex items-center gap-2 text-white text-sm font-semibold">
                <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 ring-1 ring-inset ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight size={16} className="text-white" />
                </span>
              </span>
            </button>
          </div>

          {/* New in — only products tagged "new" */}
          {newIn.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between px-5">
                <h3 className="font-bold text-slate-900 text-lg">New in</h3>
                <button onClick={() => { setSelCategory("new"); setScreen("category"); }} className="text-brand-600 text-sm font-semibold">See all</button>
              </div>
              <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
                {newIn.map((p) => <ProductCard key={p.id} p={p} wide />)}
              </div>
            </div>
          )}

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
