import React from "react";
import { Heart } from "lucide-react";
import ScreenHeader from "../components/ScreenHeader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useStore } from "../store.jsx";

export default function Favorites() {
  const { products, favorites, setScreen } = useStore();
  const favs = products.filter((p) => favorites.includes(p.id));
  return (
    <div className="pb-4">
      <ScreenHeader title="Favourites" back="home" />
      {favs.length === 0 ? (
        <EmptyState icon={Heart} tone="rose" title="No favourites yet" subtitle="Tap the heart on any item to save it here." className="min-h-[55vh]">
          <PrimaryButton variant="solid" full={false} onClick={() => setScreen("home")} className="px-6">Browse items</PrimaryButton>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 mt-4">
          {favs.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
