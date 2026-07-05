import React from "react";
import { ChevronLeft, Heart } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
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
        <EmptyState icon={Heart} tone="rose" title="No favourites yet" subtitle="Tap the heart on any item to save it here." className="min-h-[68vh]">
          <PrimaryButton variant="solid" full={false} onClick={() => setScreen("home")} className="px-6">Browse items</PrimaryButton>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-5 mt-4">
          {favs.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
