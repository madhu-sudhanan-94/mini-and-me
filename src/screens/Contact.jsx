import React, { useState } from "react";
import { ChevronLeft, Mail, Phone, Clock, MapPin, ChevronDown, ArrowRight } from "lucide-react";
import { SUPPORT, FAQS, LEGAL_ORDER, LEGAL_PAGES } from "../content/legal.js";
import { useStore } from "../store.jsx";

export default function Contact() {
  const { setScreen, openLegal } = useStore();
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState("");
  const mailto = `mailto:${SUPPORT.email}?subject=${encodeURIComponent("Support request")}&body=${encodeURIComponent(msg)}`;

  const rows = [
    { icon: Mail, label: SUPPORT.email, href: `mailto:${SUPPORT.email}` },
    { icon: Phone, label: SUPPORT.phone, href: `tel:${SUPPORT.phone.replace(/\s/g, "")}` },
    { icon: Clock, label: SUPPORT.hours },
    { icon: MapPin, label: SUPPORT.address },
  ];

  return (
    <div className="pb-10">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("home")} aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">Help &amp; Contact</h2>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Contact details */}
        <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
          {rows.map((r, i) => {
            const inner = (
              <>
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"><r.icon size={17} className="text-brand-600" /></div>
                <span className="text-sm text-slate-700 min-w-0 break-words">{r.label}</span>
              </>
            );
            return r.href
              ? <a key={i} href={r.href} className="flex items-center gap-3">{inner}</a>
              : <div key={i} className="flex items-center gap-3">{inner}</div>;
          })}
        </div>

        {/* Message box → opens email */}
        <div className="bg-white rounded-2xl shadow-xs p-4">
          <p className="text-sm font-semibold text-slate-800 mb-2">Send us a message</p>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="How can we help?" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 resize-none" />
          <a href={mailto} className={`mt-3 w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-semibold py-3 rounded-xl shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 ${msg.trim() ? "" : "opacity-60 pointer-events-none"}`}>
            Email support <ArrowRight size={18} />
          </a>
        </div>

        {/* FAQ */}
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2 px-1">Frequently asked</p>
          <div className="space-y-2">
            {FAQS.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xs overflow-hidden">
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-2 p-4 text-left">
                  <span className="flex-1 text-sm font-semibold text-slate-800">{f.q}</span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
                </button>
                {open === i && <p className="px-4 pb-4 -mt-1 text-sm text-slate-500 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Policy links */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-1 pt-1">
          {LEGAL_ORDER.map((k) => (
            <button key={k} onClick={() => openLegal(k)} className="text-xs font-semibold text-brand-600">{LEGAL_PAGES[k].title}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
