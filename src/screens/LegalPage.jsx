import React from "react";
import { ChevronLeft } from "lucide-react";
import { LEGAL_PAGES, LEGAL_ORDER, LAST_UPDATED } from "../content/legal.js";
import { useStore } from "../store.jsx";

export default function LegalPage() {
  const { legalPage, openLegal, setScreen } = useStore();
  const page = LEGAL_PAGES[legalPage] || LEGAL_PAGES.privacy;
  return (
    <div className="pb-10">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("home")} aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">{page.title}</h2>
      </div>

      <div className="px-5 mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {LEGAL_ORDER.map((k) => (
          <button key={k} onClick={() => openLegal(k)} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${legalPage === k ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-white text-slate-500 shadow-xs"}`}>{LEGAL_PAGES[k].title}</button>
        ))}
      </div>

      <div className="px-6 mt-5 space-y-5">
        {page.sections.map((s, i) => (
          <div key={i}>
            <h3 className="font-bold text-slate-800 text-sm mb-1">{s.h}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{s.body}</p>
          </div>
        ))}
        <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">Last updated: {LAST_UPDATED}</p>
      </div>
    </div>
  );
}
