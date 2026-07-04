import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { COUNTRIES, splitPhone, findCountry } from "../lib/countries.js";

/*
  Phone input with a country dial-code picker (flag + code + dropdown).
  `value` is the full stored string e.g. "+918971583502"; emits "" when the
  number part is empty so "at-least-one-contact" checks stay correct.
*/
export default function PhoneField({ value, onChange, placeholder = "Mobile number" }) {
  const [country, setCountry] = useState(() => findCountry(splitPhone(value).dial) || COUNTRIES[0]);
  const [number, setNumber] = useState(() => splitPhone(value).number);
  const [open, setOpen] = useState(false);

  // keep in sync when the value is set externally (edit / prefill)
  useEffect(() => {
    const p = splitPhone(value);
    setNumber(p.number);
    const c = findCountry(p.dial);
    if (c) setCountry(c);
  }, [value]);

  const emit = (dial, num) => onChange(num ? dial + num : "");
  const pick = (c) => { setCountry(c); setOpen(false); emit(c.dial, number); };
  const onNum = (e) => { const n = e.target.value.replace(/\D/g, "").slice(0, 15); setNumber(n); emit(country.dial, n); };

  return (
    <div className="relative">
      <div className="flex items-center border border-slate-200 rounded-xl focus-within:border-brand-500">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Select country code" className="flex items-center gap-1 pl-3 pr-2 py-3 border-r border-slate-200 shrink-0">
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-sm text-slate-600">{country.dial}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
        <input value={number} onChange={onNum} inputMode="numeric" placeholder={placeholder} className="flex-1 py-3 px-3 outline-hidden text-sm bg-transparent min-w-0" />
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 left-0 w-64 max-w-[85vw] max-h-60 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-100 no-scrollbar">
            {COUNTRIES.map((c) => (
              <button type="button" key={c.code} onClick={() => pick(c)} className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 ${c.code === country.code ? "bg-brand-50" : ""}`}>
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 text-slate-700 truncate">{c.name}</span>
                <span className="text-slate-400">{c.dial}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
