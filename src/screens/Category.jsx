import React from "react";
import { ChevronLeft } from "lucide-react";
import { CAT_LABEL } from "../lib/format.js";
import ProductCard from "../components/ProductCard.jsx";
import { useStore } from "../store.jsx";

export default function Category() {
  const { products, selCategory, setSelCategory, setScreen } = useStore();
  const cats = ["women", "men", "kids"];
  const list = products.filter((p) => p.cat === selCategory);
  return (
    <div className="pb-4">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("home")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-xl font-bold text-slate-900">Shop</h2>
      </div>
      <div className="flex gap-2 px-5 mt-4 overflow-x-auto no-scrollbar">
        {cats.map((c) => (
          <button key={c} onClick={() => setSelCategory(c)} className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selCategory === c ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-white text-slate-500 shadow-xs"}`}>
            {CAT_LABEL[c]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-5 mt-4">
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
