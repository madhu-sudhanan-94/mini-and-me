import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { CAT_LABEL } from "../lib/format.js";
import ProductCard from "../components/ProductCard.jsx";
import { useStore } from "../store.jsx";

const SORTS = [
  { key: "featured", label: "Featured" },
  { key: "price-low", label: "Price: Low to High" },
  { key: "price-high", label: "Price: High to Low" },
  { key: "newest", label: "Newest" },
];
const PAGE = 12;

export default function Category() {
  const { products, selCategory, setSelCategory, setScreen } = useStore();
  const cats = ["women", "men", "kids"];
  const [shape, setShape] = useState("all");
  const [sort, setSort] = useState("featured");
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => { setShape("all"); setVisible(PAGE); }, [selCategory]);
  useEffect(() => { setVisible(PAGE); }, [shape, sort]);

  const inCat = products.filter((p) => p.cat === selCategory);
  const shapes = ["all", ...Array.from(new Set(inCat.map((p) => p.shape)))];
  let list = shape === "all" ? inCat : inCat.filter((p) => p.shape === shape);
  list = [...list].sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "newest") return (b.tag === "new" ? 1 : 0) - (a.tag === "new" ? 1 : 0) || b.id - a.id;
    return (b.trending ? 1 : 0) - (a.trending ? 1 : 0); // featured
  });
  const shown = list.slice(0, visible);

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

      <div className="flex items-center gap-2 px-5 mt-3">
        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
          {shapes.map((s) => (
            <button key={s} onClick={() => setShape(s)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize ${shape === s ? "bg-slate-900 text-white" : "bg-white text-slate-500 shadow-xs"}`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className="shrink-0 border border-slate-200 rounded-full py-1.5 px-3 text-xs font-semibold text-slate-600 outline-hidden bg-white">
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      <p className="px-5 mt-3 text-xs text-slate-400">{list.length} item{list.length !== 1 ? "s" : ""}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-5 mt-2">
        {shown.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {list.length === 0 && <p className="text-slate-400 text-sm py-10 text-center">No items here yet.</p>}
      {visible < list.length && (
        <div className="px-5 mt-5">
          <button onClick={() => setVisible((v) => v + PAGE)} className="w-full border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl">Load more ({list.length - visible} left)</button>
        </div>
      )}
    </div>
  );
}
