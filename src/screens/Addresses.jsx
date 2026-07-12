import React, { useState } from "react";
import { Plus, Edit3, Trash2, MapPin, Home as HomeIcon, Briefcase, MoreHorizontal, Check } from "lucide-react";
import ScreenHeader from "../components/ScreenHeader.jsx";
import PhoneField from "../components/PhoneField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { COUNTRY_NAMES } from "../lib/countries.js";
import { INDIAN_STATES } from "../lib/india.js";
import { useStore } from "../store.jsx";

const LABELS = ["Home", "Work", "Other"];
const blankAddr = { label: "Home", full_name: "", phone: "", line1: "", line2: "", area: "", city: "", state: "", pincode: "", country: "India", is_default: false };

// Icon per label so each card reads at a glance (Home → house, Work → briefcase…).
const labelIcon = (label) => ({ Home: HomeIcon, Work: Briefcase, Other: MapPin }[label] || MapPin);
// Subtle tint per label so the cards aren't all one colour.
const labelTint = (label) => ({ Home: "bg-emerald-50 text-emerald-600", Work: "bg-amber-50 text-amber-600", Other: "bg-brand-50 text-brand-600" }[label] || "bg-brand-50 text-brand-600");
// Pretty-print an Indian 10-digit mobile as "+91 XXXXX XXXXX" (other formats left as-is).
const fmtPhone = (ph) => {
  const d = (ph || "").replace(/\D/g, "");
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return ph;
};

export default function Addresses() {
  const { addresses, addrBusy, saveAddress, deleteAddress, makeDefaultAddress, goBack, profile } = useStore();
  const [editing, setEditing] = useState(null); // form object (with id when editing) or null
  const [err, setErr] = useState("");
  const [menuFor, setMenuFor] = useState(null); // id of the address whose ⋯ menu is open

  const viewOnMap = (a) => {
    const q = encodeURIComponent([a.line1, a.line2, a.area, a.city, a.state, a.pincode, a.country].filter(Boolean).join(", "));
    if (typeof window !== "undefined") window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener");
  };

  const startNew = () => {
    setErr("");
    setEditing({ ...blankAddr, full_name: profile?.full_name || "", phone: profile?.phone || "", is_default: addresses.length === 0 });
  };
  const startEdit = (a) => { setErr(""); setEditing({ ...a, country: a.country || "India" }); };

  const submit = async () => {
    const f = editing;
    if (!f.line1.trim() || !f.city.trim() || !f.state.trim() || !f.pincode.trim()) { setErr("Fill in flat/house, city, state and PIN code."); return; }
    if (!/^\d{6}$/.test(f.pincode.trim())) { setErr("PIN code must be 6 digits."); return; }
    const payload = {
      label: f.label, full_name: f.full_name.trim() || null, phone: f.phone.trim() || null,
      line1: f.line1.trim(), line2: f.line2.trim() || null, area: f.area.trim() || null,
      city: f.city.trim(), state: f.state.trim(), pincode: f.pincode.trim(),
      country: f.country || "India", is_default: !!f.is_default,
    };
    const ok = await saveAddress(payload, f.id);
    if (ok) setEditing(null);
  };

  const set = (k, v) => setEditing((e) => ({ ...e, [k]: v }));

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title={editing ? (editing.id ? "Edit address" : "New address") : "Addresses"} onBack={() => (editing ? setEditing(null) : goBack("account"))} />

      {editing ? (
        <>
        <div className="flex-1 px-5 mt-4 mb-5">
          <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
            <div className="flex gap-2">
              {LABELS.map((l) => (
                <button key={l} onClick={() => set("label", l)} className={`flex-1 py-2 rounded-xl text-sm font-semibold ${editing.label === l ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-slate-100 text-slate-500"}`}>{l}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Full name</label>
                <input value={editing.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Your Name" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400 placeholder:font-normal" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Phone</label>
                <PhoneField value={editing.phone} onChange={(v) => set("phone", v)} placeholder="Mobile number" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Flat / house no., building</label>
                <input value={editing.line1} onChange={(e) => set("line1", e.target.value)} placeholder="e.g. Flat 4B, Palm Residency" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400 placeholder:font-normal" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Street / locality</label>
                <input value={editing.line2} onChange={(e) => set("line2", e.target.value)} placeholder="e.g. 5th Cross, MG Road" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400 placeholder:font-normal" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Area / landmark <span className="text-slate-400">(optional)</span></label>
                <input value={editing.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Near City Mall" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400 placeholder:font-normal" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">City</label>
                <input value={editing.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Bengaluru" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400 placeholder:font-normal" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">State</label>
                {editing.country === "India" ? (
                  <select value={editing.state} onChange={(e) => set("state", e.target.value)} className={`w-full border border-slate-200 rounded-xl py-3 pl-2.5 pr-9 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white select-chevron ${editing.state ? "" : "text-slate-400"}`}>
                    <option value="">Select</option>
                    {(editing.state && !INDIAN_STATES.includes(editing.state) ? [editing.state, ...INDIAN_STATES] : INDIAN_STATES).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={editing.state} onChange={(e) => set("state", e.target.value)} placeholder="State / province" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400 placeholder:font-normal" />
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">PIN code</label>
                <input value={editing.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="6-digit PIN code" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400 placeholder:font-normal" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Country/region</label>
                <select value={editing.country} onChange={(e) => setEditing((ed) => ({ ...ed, country: e.target.value, state: "" }))} className="w-full border border-slate-200 rounded-xl py-3 pl-3 pr-9 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white select-chevron">
                  {COUNTRY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!editing.is_default} onChange={(e) => set("is_default", e.target.checked)} className="w-4 h-4 accent-brand-600" />
              Set as default delivery address
            </label>

            {err && <p className="text-red-500 text-xs">{err}</p>}
          </div>
        </div>
        <div className="sticky bottom-0 z-20 px-5 py-4 border-t border-slate-100 bg-white/95 backdrop-blur lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
          <div className="flex gap-2">
            <PrimaryButton onClick={submit} disabled={addrBusy} full={false} className="flex-1">{addrBusy ? "Saving…" : "Save address"}</PrimaryButton>
            <PrimaryButton variant="secondary" size="lg" full={false} onClick={() => setEditing(null)} className="px-5">Cancel</PrimaryButton>
          </div>
        </div>
        </>
      ) : addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No addresses yet" subtitle="Add a delivery address to speed up checkout." className="min-h-[55vh]">
          <PrimaryButton variant="solid" onClick={startNew} full={false} className="px-6"><Plus size={18} /> Add address</PrimaryButton>
        </EmptyState>
      ) : (
        <div className="px-5 mt-4 pb-6 space-y-3">
          {addresses.map((a) => {
            const Icon = labelIcon(a.label);
            // Hide "India" (the expected default) — only show a country when it's elsewhere.
            const fullAddr = [a.line1, a.line2, a.area, a.city, a.state, a.pincode, a.country && a.country !== "India" ? a.country : null].filter(Boolean).join(", ");
            const contact = [a.full_name, fmtPhone(a.phone)].filter(Boolean).join(" · ");
            return (
              // Tap (or Enter/Space) anywhere on the card to make it the default delivery address.
              <div
                key={a.id}
                onClick={() => !a.is_default && makeDefaultAddress(a.id)}
                {...(!a.is_default ? {
                  role: "button",
                  tabIndex: 0,
                  "aria-label": `Set ${a.label} address as default`,
                  onKeyDown: (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); makeDefaultAddress(a.id); } },
                } : {})}
                className={`rounded-xl shadow-card p-4 transition bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${a.is_default ? "ring-1 ring-brand-500 cursor-default" : "cursor-pointer hover:ring-1 hover:ring-slate-200"}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${labelTint(a.label)}`}><Icon size={18} /></span>
                  <p className="min-w-0 text-[15px] font-semibold text-slate-800 truncate">{a.label}</p>
                  {a.is_default && <span className="shrink-0 text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Default</span>}
                  {/* round radio — only one address is default at a time */}
                  <span aria-hidden="true" className="shrink-0 ml-auto">
                    {a.is_default
                      ? <span className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white"><Check size={14} strokeWidth={3} /></span>
                      : <span className="block w-6 h-6 rounded-full border-2 border-slate-300" />}
                  </span>
                </div>
                {contact && <p className="text-sm font-medium text-slate-800 mt-2.5">{contact}</p>}
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{fullAddr}</p>
                <div className="flex items-center justify-between mt-3">
                  <button onClick={(e) => { e.stopPropagation(); viewOnMap(a); }} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 active:scale-95 transition"><MapPin size={13} /> View on map</button>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === a.id ? null : a.id); }} aria-label="More options" className="w-8 h-8 -mr-1 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 active:scale-90 transition"><MoreHorizontal size={18} /></button>
                    {menuFor === a.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuFor(null); }} />
                        <div className="absolute right-0 bottom-9 z-20 w-32 bg-white rounded-xl shadow-card ring-1 ring-slate-100 overflow-hidden py-1">
                          <button onClick={(e) => { e.stopPropagation(); setMenuFor(null); startEdit(a); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Edit3 size={14} /> Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); setMenuFor(null); deleteAddress(a.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Address — below the list */}
          <PrimaryButton variant="solid" onClick={startNew} className="mt-1"><Plus size={18} /> Add New Address</PrimaryButton>
        </div>
      )}
    </div>
  );
}
