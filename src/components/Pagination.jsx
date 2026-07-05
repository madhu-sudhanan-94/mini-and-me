import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/*
  Pagination — compact numbered pages with prev/next and ellipses,
  e.g.  ‹ 1 … 4 5 6 … 12 ›.  Renders nothing for a single page.
*/
export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const go = (p) => { if (p >= 1 && p <= pageCount && p !== page) onChange(p); };

  const pages = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  const base = "min-w-9 h-9 px-2 rounded-lg text-sm font-semibold flex items-center justify-center";
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page" className={`${base} border border-slate-200 text-slate-600 disabled:opacity-40`}><ChevronLeft size={17} /></button>
      {pages.map((p, i) => p === "…"
        ? <span key={`e${i}`} className="px-1 text-slate-400">…</span>
        : <button key={p} onClick={() => go(p)} className={`${base} ${p === page ? "bg-brand-600 text-white shadow-sm shadow-brand-500/25" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>
      )}
      <button onClick={() => go(page + 1)} disabled={page === pageCount} aria-label="Next page" className={`${base} border border-slate-200 text-slate-600 disabled:opacity-40`}><ChevronRight size={17} /></button>
    </div>
  );
}
