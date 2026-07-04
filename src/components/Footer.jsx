import React from "react";
import { BRAND } from "../brand.config.js";
import { LEGAL_ORDER, LEGAL_PAGES } from "../content/legal.js";
import { useStore } from "../store.jsx";

/* Footer with policy/support links — shown on the browse screens. */
export default function Footer() {
  const { openLegal, setScreen } = useStore();
  return (
    <footer className="mt-8 border-t border-slate-100 bg-white px-6 py-6 lg:px-8">
      <div className="lg:max-w-6xl lg:mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <p className="font-extrabold text-slate-900">{BRAND.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{BRAND.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          {LEGAL_ORDER.map((k) => (
            <button key={k} onClick={() => openLegal(k)} className="hover:text-brand-600">{LEGAL_PAGES[k].title}</button>
          ))}
          <button onClick={() => setScreen("contact")} className="hover:text-brand-600">Contact</button>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-4 lg:max-w-6xl lg:mx-auto">© {BRAND.name}. All rights reserved.</p>
    </footer>
  );
}
