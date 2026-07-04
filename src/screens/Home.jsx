import React from "react";
import { Heart, ShoppingCart, Search, Package, Sparkles } from "lucide-react";
import { BRAND } from "../brand.config.js";
import { heroBlue } from "../theme.js";
import { formatINR, CAT_LABEL } from "../lib/format.js";
import ProductCard from "../components/ProductCard.jsx";
import ProductImage from "../components/ProductImage.jsx";
import { useStore } from "../store.jsx";

export default function Home() {
  const { products, query, setQuery, favorites, cartCount, setScreen, setSelCategory, heroIndex, setHeroIndex, openProduct } = useStore();

  const featured = products.filter((p) => p.trending).slice(0, 5);
  const heroP = featured.length ? featured[heroIndex % featured.length] : products[0];
  const trending = products.filter((p) => p.trending);
  const newIn = [...products.filter((p) => p.tag === "new"), ...products.filter((p) => p.tag !== "new")].slice(0, 6);
  const cats = ["women", "men", "kids"];
  const catColor = { women: "from-rose-400 to-pink-500", men: "from-brand-500 to-indigo-500", kids: "from-amber-400 to-orange-500" };
  const results = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="pb-4">
      <div className="lg:hidden px-5 pt-2 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs">Welcome back 👋</p>
          <p className="font-extrabold text-slate-900 text-lg">{BRAND.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScreen("favorites")} className="relative w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center">
            <Heart size={19} className="text-slate-700" />
            {favorites.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{favorites.length}</span>}
          </button>
          <button onClick={() => setScreen("cart")} className="relative w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center">
            <ShoppingCart size={19} className="text-slate-700" />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{cartCount}</span>}
          </button>
        </div>
      </div>

      <div className="lg:hidden px-5 mt-4">
        <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-xs">
          <Search size={18} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dresses, kurtas, jeans…" className="flex-1 ml-3 outline-hidden text-sm bg-transparent" />
        </div>
      </div>

      {query.trim() ? (
        <div className="px-5 mt-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Results for “{query}”</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {results.length === 0 && <p className="text-slate-400 text-sm py-10 text-center">No matches. Try another search.</p>}
        </div>
      ) : (
        <>
          {/* Hero carousel */}
          <div className="px-5 mt-5">
            <button onClick={() => openProduct(heroP)} className="w-full text-left relative rounded-3xl overflow-hidden p-5 h-52 lg:h-80 flex flex-col justify-end" style={heroBlue}>
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

          {/* Category cards */}
          <div className="mt-6 px-5">
            <h3 className="font-bold text-slate-900 text-lg mb-3">Shop by category</h3>
            <div className="grid grid-cols-3 gap-3 lg:gap-5">
              {cats.map((c) => {
                const n = products.filter((p) => p.cat === c).length;
                return (
                  <button key={c} onClick={() => { setSelCategory(c); setScreen("category"); }} className={`rounded-2xl p-3 h-24 lg:h-40 lg:p-5 flex flex-col justify-between bg-linear-to-br ${catColor[c]} shadow-md active:scale-95 transition`}>
                    <Package size={20} className="text-white" />
                    <div className="text-left">
                      <p className="text-white font-bold text-sm leading-none">{CAT_LABEL[c]}</p>
                      <p className="text-white/80 text-[10px] mt-1">{n} items</p>
                    </div>
                  </button>
                );
              })}
            </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {newIn.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
