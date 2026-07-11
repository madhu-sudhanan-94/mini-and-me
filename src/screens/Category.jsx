import React, { useState, useLayoutEffect, useEffect, useMemo } from "react";
import { PackageOpen, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import ScreenHeader from "../components/ScreenHeader.jsx";
import { CAT_LABEL } from "../lib/format.js";
import { SORTS, sortProducts, COLOR_FAMILIES, productFamilies } from "../lib/catalog.js";
import ProductCard from "../components/ProductCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import Pagination from "../components/Pagination.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useStore } from "../store.jsx";

const PAGE = 20;
const PRICE_BOUNDS = [0, 10000]; // fixed price range for the slider

export default function Category() {
  const { products, selCategory, setSelCategory } = useStore();
  const cats = ["all", "kids", "women", "men", "toys"];
  // selCategory can also be a "collection" — "new" or "trending" — opened from
  // the Home "See all" links. Those hide the category tabs and set the title.
  const isCollection = selCategory === "new" || selCategory === "trending";
  const title = selCategory === "new" ? "New in" : selCategory === "trending" ? "Trending" : "Shop by category";

  const inCat = useMemo(() => products.filter((p) =>
    selCategory === "all" ? true
      : selCategory === "new" ? p.tag === "new"
      : selCategory === "trending" ? !!p.trending
      : p.cat === selCategory
  ), [products, selCategory]);
  const shapes = useMemo(() => ["all", ...Array.from(new Set(inCat.map((p) => p.shape)))], [inCat]);
  const families = useMemo(
    () => COLOR_FAMILIES.map((f) => f.key).filter((k) => inCat.some((p) => productFamilies(p).has(k))),
    [inCat]
  );
  const bounds = PRICE_BOUNDS;

  const [shape, setShape] = useState("all");
  const [sort, setSort] = useState("featured");
  const [price, setPrice] = useState(PRICE_BOUNDS);
  const [colors, setColors] = useState(new Set());
  const [page, setPage] = useState(1);
  const [sheet, setSheet] = useState(false);

  // reset filters when the category changes — layout effect so it runs before
  // paint (no stale-filter flash on switch)
  useLayoutEffect(() => { setShape("all"); setColors(new Set()); setPrice(PRICE_BOUNDS); setPage(1); }, [selCategory]);
  // back to page 1 whenever the result set changes
  useEffect(() => { setPage(1); }, [shape, sort, price, colors]);

  const toggleColor = (key) => setColors((prev) => {
    const n = new Set(prev);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  });
  const resetFilters = () => { setShape("all"); setColors(new Set()); setPrice(PRICE_BOUNDS); };
  const activeFilters = (shape !== "all" ? 1 : 0) + colors.size + (price[0] > bounds[0] || price[1] < bounds[1] ? 1 : 0);

  let list = inCat
    .filter((p) => shape === "all" || p.shape === shape)
    .filter((p) => p.price >= price[0] && p.price <= price[1])
    .filter((p) => colors.size === 0 || [...productFamilies(p)].some((k) => colors.has(k)));
  list = sortProducts(list, sort);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE));
  const safePage = Math.min(page, pageCount); // clamp so a narrowed result never shows a blank page
  const shown = list.slice((safePage - 1) * PAGE, safePage * PAGE);

  const panelProps = { shapes, shape, setShape, bounds, price, setPrice, families, colors, toggleColor, onReset: resetFilters };
  const sortSelect = (extra = "") => (
    <div className={`relative shrink-0 ${extra}`}>
      <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
      <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className="border border-slate-200 rounded-full py-1.5 pl-8 pr-8 text-xs font-semibold text-slate-600 outline-hidden bg-white select-chevron">
        {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="pb-4 lg:pb-10">
      <ScreenHeader title={title} back="home" className="lg:px-6" />

      {/* shopping controls — scroll with the content (not pinned) */}
      <div className="pb-1 lg:pb-0">
        {/* category tabs (hidden for the New in / Trending collections) */}
        {!isCollection && (
          <div className="flex gap-2 px-5 lg:px-6 pt-4 overflow-x-auto no-scrollbar">
            {cats.map((c) => (
              <button key={c} onClick={() => setSelCategory(c)} className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selCategory === c ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-white text-slate-500 shadow-xs"}`}>
                {CAT_LABEL[c]}
              </button>
            ))}
          </div>
        )}

        {/* mobile: filters + count + sort */}
        <div className="lg:hidden flex items-center gap-2 px-5 mt-3">
          <button onClick={() => setSheet(true)} className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-600 active:scale-95 transition shrink-0">
            <SlidersHorizontal size={14} /> Filters
            {activeFilters > 0 && <span className="ml-0.5 bg-brand-600 text-white rounded-full text-[10px] font-bold px-1.5 py-px">{activeFilters}</span>}
          </button>
          {sortSelect()}
          <p className="flex-1 text-sm text-slate-500 text-right pr-1">{list.length} item{list.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="lg:flex lg:gap-6 lg:px-6 lg:mt-5">
        {/* desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-100 p-5 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-slate-900">Filters</p>
              {activeFilters > 0 && <button onClick={resetFilters} className="text-xs font-semibold text-brand-600">Clear ({activeFilters})</button>}
            </div>
            <FilterPanel {...panelProps} />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* desktop sort toolbar */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{list.length} item{list.length !== 1 ? "s" : ""}</p>
            {sortSelect()}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4 px-5 lg:px-0 mt-3 lg:mt-0">
            {shown.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          {list.length === 0 && <EmptyState icon={PackageOpen} title="No items match" subtitle={isCollection ? "Try clearing a filter." : "Try clearing a filter or picking another category."} className="py-16" />}

          <div className="px-5 lg:px-0"><Pagination page={safePage} pageCount={pageCount} onChange={(p) => { setPage(p); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); }} /></div>
        </div>
      </div>

      {/* mobile filters bottom sheet */}
      {sheet && (
        <div className="lg:hidden fixed sm:max-lg:absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheet(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[85%] overflow-y-auto no-scrollbar p-5 pb-8" style={{ animation: "vkUp .25s ease" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
              <button onClick={() => setSheet(false)} aria-label="Close" className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"><X size={18} className="text-slate-500" /></button>
            </div>
            <FilterPanel {...panelProps} />
            <PrimaryButton size="lg" onClick={() => setSheet(false)} className="mt-6">Show {list.length} result{list.length !== 1 ? "s" : ""}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
