import React, { useState } from "react";
import { Mail, Phone, Clock, MapPin, ChevronDown, ArrowRight, MessageCircle, HelpCircle } from "lucide-react";
import ScreenHeader from "../components/ScreenHeader.jsx";
import { SUPPORT, FAQS, LEGAL_ORDER, LEGAL_PAGES } from "../content/legal.js";
import { useStore } from "../store.jsx";

const TINT = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
};

export default function Contact() {
  const { openLegal } = useStore();
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState("");
  const mailto = `mailto:${SUPPORT.email}?subject=${encodeURIComponent("Support request")}&body=${encodeURIComponent(msg)}`;

  const rows = [
    { icon: Mail, tint: "brand", label: "Email us", value: SUPPORT.email, href: `mailto:${SUPPORT.email}` },
    { icon: Phone, tint: "emerald", label: "Call us", value: SUPPORT.phone, href: `tel:${SUPPORT.phone.replace(/\s/g, "")}` },
    { icon: Clock, tint: "amber", label: "Hours", value: SUPPORT.hours },
    { icon: MapPin, tint: "rose", label: "Address", value: SUPPORT.address },
  ];

  return (
    <div className="pb-10">
      <ScreenHeader title="Help & support" back="home" />

      <div className="px-5 mt-4 space-y-5">
        {/* Contact details */}
        <div className="bg-white rounded-2xl shadow-card divide-y divide-slate-100 overflow-hidden">
          {rows.map((r, i) => {
            const inner = (
              <>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TINT[r.tint]}`}><r.icon size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400">{r.label}</p>
                  <p className="text-sm font-semibold text-slate-800 break-words">{r.value}</p>
                </div>
              </>
            );
            return r.href
              ? <a key={i} href={r.href} className="flex items-center gap-3.5 p-4 hover:bg-slate-50 transition">{inner}</a>
              : <div key={i} className="flex items-center gap-3.5 p-4">{inner}</div>;
          })}
        </div>

        {/* Message box → opens email */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <p className="text-sm font-semibold text-slate-800 mb-2.5 flex items-center gap-2">Send us a message</p>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="How can we help?" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 resize-none" />
          <a href={mailto} className={`mt-3 w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-semibold py-3 rounded-xl shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 active:scale-[0.99] transition ${msg.trim() ? "" : "opacity-60 pointer-events-none"}`}>
            Email support <ArrowRight size={18} />
          </a>
        </div>

        {/* FAQ */}
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2.5 px-1 flex items-center gap-2">Frequently asked</p>
          <div className="bg-white rounded-2xl shadow-card divide-y divide-slate-100 overflow-hidden">
            {FAQS.map((f, i) => (
              <div key={i}>
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-2 p-4 text-left hover:bg-slate-50 transition">
                  <span className="flex-1 text-sm font-semibold text-slate-800">{f.q}</span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform shrink-0 ${open === i ? "rotate-180" : ""}`} />
                </button>
                {open === i && <p className="px-4 pb-4 -mt-1 text-sm text-slate-500 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Policy links */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-1">
          {LEGAL_ORDER.map((k) => (
            <button key={k} onClick={() => openLegal(k)} className="text-xs font-semibold text-brand-600">{LEGAL_PAGES[k].title}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
