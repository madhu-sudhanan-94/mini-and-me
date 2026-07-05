import React from "react";
import { Search, ShoppingCart, User, Heart } from "lucide-react";
import { CAT_LABEL } from "../lib/format.js";
import BrandLogo from "./BrandLogo.jsx";
import { useStore } from "../store.jsx";

/* Desktop-only top navigation bar (hidden on mobile via hidden lg:flex). */
export default function DesktopNav() {
  const { screen, setScreen, selCategory, setSelCategory, query, setQuery, cartCount, favorites } = useStore();
  const link = (active) => `px-3 py-2 rounded-lg text-sm font-semibold transition ${active ? "text-brand-600 bg-brand-50" : "text-slate-600 hover:bg-slate-100"}`;
  return (
    <header className="hidden lg:flex sticky top-[-1px] z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-8 py-3 items-center gap-5">
      <BrandLogo imgClass="h-8" />
      <nav className="flex items-center gap-1">
        <button onClick={() => setScreen("home")} className={link(screen === "home")}>Home</button>
        {["women", "men", "kids"].map((c) => (
          <button key={c} onClick={() => { setSelCategory(c); setScreen("category"); }} className={link(screen === "category" && selCategory === c)}>{CAT_LABEL[c]}</button>
        ))}
      </nav>
      <div className="flex-1 max-w-sm ml-auto">
        <div className="flex items-center bg-slate-100 rounded-full px-4 py-2">
          <Search size={17} className="text-slate-400" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setScreen("home"); }} placeholder="Search dresses, kurtas, jeans…" className="flex-1 ml-2 outline-hidden text-sm bg-transparent" />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => setScreen("favorites")} aria-label="Favourites" className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center">
          <Heart size={20} className={screen === "favorites" ? "text-rose-500" : "text-slate-700"} />
          {favorites.length > 0 && <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">{favorites.length}</span>}
        </button>
        <button onClick={() => setScreen("cart")} aria-label="Cart" className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center">
          <ShoppingCart size={20} className="text-slate-700" />
          {cartCount > 0 && <span className="absolute top-0.5 right-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">{cartCount}</span>}
        </button>
        <button onClick={() => setScreen("account")} aria-label="Account" className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center"><User size={20} className="text-slate-700" /></button>
      </div>
    </header>
  );
}
