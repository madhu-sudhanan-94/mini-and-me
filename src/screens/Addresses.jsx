import React, { useState } from "react";
import { Plus, Edit3, Trash2, MapPin, Star } from "lucide-react";
import ScreenHeader from "../components/ScreenHeader.jsx";
import PhoneField from "../components/PhoneField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { COUNTRY_NAMES } from "../lib/countries.js";
import { INDIAN_STATES } from "../lib/india.js";
import { useStore } from "../store.jsx";

const LABELS = ["Home", "Work", "Other"];
const blankAddr = { label: "Home", full_name: "", phone: "", line1: "", line2: "", area: "", city: "", state: "", pincode: "", country: "India", is_default: false };

function fmtLines(a) {
  return [a.line1, a.line2, a.area].filter(Boolean).join(", ");
}

export default function Addresses() {
  const { addresses, addrBusy, saveAddress, deleteAddress, makeDefaultAddress, setScreen, goBack, profile } = useStore();
  const [editing, setEditing] = useState(null); // form object (with id when editing) or null
  const [err, setErr] = useState("");

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
    <div className="pb-6">
      <ScreenHeader title={editing ? (editing.id ? "Edit address" : "New address") : "Delivery addresses"} onBack={() => (editing ? setEditing(null) : goBack("account"))} />

      {editing ? (
        <div className="px-5 mt-4">
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex gap-2">
              {LABELS.map((l) => (
                <button key={l} onClick={() => set("label", l)} className={`flex-1 py-2 rounded-xl text-sm font-semibold ${editing.label === l ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-slate-100 text-slate-500"}`}>{l}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Full name</label>
                <input value={editing.full_name} onChange={(e) => set("full_name", e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Phone</label>
                <PhoneField value={editing.phone} onChange={(v) => set("phone", v)} placeholder="Mobile number" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Flat / house no., building</label>
                <input value={editing.line1} onChange={(e) => set("line1", e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Street / locality</label>
                <input value={editing.line2} onChange={(e) => set("line2", e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Area / landmark <span className="text-slate-400">(optional)</span></label>
                <input value={editing.area} onChange={(e) => set("area", e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">City</label>
                <input value={editing.city} onChange={(e) => set("city", e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">State</label>
                {editing.country === "India" ? (
                  <select value={editing.state} onChange={(e) => set("state", e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 pl-2.5 pr-9 outline-hidden text-sm focus:border-brand-500 bg-white select-chevron">
                    <option value="">Select</option>
                    {(editing.state && !INDIAN_STATES.includes(editing.state) ? [editing.state, ...INDIAN_STATES] : INDIAN_STATES).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={editing.state} onChange={(e) => set("state", e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">PIN code</label>
                <input value={editing.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Country/region</label>
                <select value={editing.country} onChange={(e) => set("country", e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 pl-3 pr-9 outline-hidden text-sm focus:border-brand-500 bg-white select-chevron">
                  {COUNTRY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!editing.is_default} onChange={(e) => set("is_default", e.target.checked)} className="w-4 h-4 accent-brand-600" />
              Set as default delivery address
            </label>

            {err && <p className="text-red-500 text-xs">{err}</p>}

            <div className="flex gap-2 pt-1">
              <PrimaryButton onClick={submit} disabled={addrBusy} full={false} className="flex-1">{addrBusy ? "Saving…" : "Save address"}</PrimaryButton>
              <button onClick={() => setEditing(null)} className="px-5 border border-slate-200 rounded-xl text-sm text-slate-500">Cancel</button>
            </div>
          </div>
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No addresses yet" subtitle="Add a delivery address to speed up checkout." className="min-h-[55vh]">
          <PrimaryButton variant="solid" onClick={startNew} full={false} className="px-6"><Plus size={18} /> Add address</PrimaryButton>
        </EmptyState>
      ) : (
        <div className="px-5 mt-4 space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl shadow-xs p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{a.label}</span>
                {a.is_default && <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md flex items-center gap-1"><Star size={11} fill="currentColor" /> Default</span>}
              </div>
              {(a.full_name || a.phone) && <p className="text-sm font-semibold text-slate-800">{[a.full_name, a.phone].filter(Boolean).join(" · ")}</p>}
              <p className="text-sm text-slate-500 mt-0.5">{fmtLines(a)}</p>
              <p className="text-sm text-slate-500">{[a.city, a.state].filter(Boolean).join(", ")} {a.pincode}{a.country ? " · " + a.country : ""}</p>
              <div className="flex items-center gap-2 mt-3">
                {!a.is_default && <button onClick={() => makeDefaultAddress(a.id)} disabled={addrBusy} className="text-xs font-semibold text-brand-600 disabled:opacity-50">Set as default</button>}
                <button onClick={() => startEdit(a)} className="ml-auto w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><Edit3 size={15} /></button>
                <button onClick={() => deleteAddress(a.id)} disabled={addrBusy} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 disabled:opacity-50"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          <button onClick={startNew} className="w-full border border-dashed border-brand-300 text-brand-600 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 mt-5"><Plus size={18} /> Add another address</button>
        </div>
      )}
    </div>
  );
}
