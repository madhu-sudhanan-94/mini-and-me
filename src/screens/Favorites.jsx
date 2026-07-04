import React from "react";
import { ChevronLeft, Heart } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import { useStore } from "../store.jsx";

export default function Favorites() {
  const { products, favorites, setScreen } = useStore();
  const favs = products.filter((p) => favorites.includes(p.id));
  return (
    <div className="pb-4">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("home")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">Favourites</h2>
      </div>
      {favs.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-8 mt-24">
          <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-4"><Heart size={32} className="text-rose-400" /></div>
          <p className="font-bold text-slate-800 text-lg">No favourites yet</p>
          <p className="text-slate-400 text-sm mt-1">Tap the heart on any item to save it here.</p>
          <button onClick={() => setScreen("home")} className="mt-5 bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl">Browse items</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-5 mt-4">
          {favs.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
