import React, { useState } from "react";
import { ChevronLeft, Plus, Edit3, Trash2, MapPin, Check, Star } from "lucide-react";
import { useStore } from "../store.jsx";

const LABELS = ["Home", "Work", "Other"];
const blankAddr = { label: "Home", full_name: "", phone: "", line1: "", line2: "", area: "", city: "", state: "", pincode: "", is_default: false };

function fmtLines(a) {
  return [a.line1, a.line2, a.area].filter(Boolean).join(", ");
}

export default function Addresses() {
  const { addresses, addrBusy, saveAddress, deleteAddress, makeDefaultAddress, setScreen, profile } = useStore();
  const [editing, setEditing] = useState(null); // form object (with id when editing) or null
  const [err, setErr] = useState("");

  const startNew = () => {
    setErr("");
    setEditing({ ...blankAddr, full_name: profile?.full_name || "", phone: profile?.phone || "", is_default: addresses.length === 0 });
  };
  const startEdit = (a) => { setErr(""); setEditing({ ...a }); };

  const submit = async () => {
    const f = editing;
    if (!f.line1.trim() || !f.city.trim() || !f.state.trim() || !f.pincode.trim()) { setErr("Fill in flat/house, city, state and PIN code."); return; }
    if (!/^\d{6}$/.test(f.pincode.trim())) { setErr("PIN code must be 6 digits."); return; }
    const payload = {
      label: f.label, full_name: f.full_name.trim() || null, phone: f.phone.trim() || null,
      line1: f.line1.trim(), line2: f.line2.trim() || null, area: f.area.trim() || null,
      city: f.city.trim(), state: f.state.trim(), pincode: f.pincode.trim(), is_default: !!f.is_default,
    };
    const ok = await saveAddress(payload, f.id);
    if (ok) setEditing(null);
  };

  const set = (k, v) => setEditing((e) => ({ ...e, [k]: v }));

  return (
    <div className="pb-6">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => (editing ? setEditing(null) : setScreen("account"))} aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">{editing ? (editing.id ? "Edit address" : "New address") : "Delivery addresses"}</h2>
      </div>

      {editing ? (
        <div className="px-5 mt-4">
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex gap-2">
              {LABELS.map((l) => (
                <button key={l} onClick={() => set("label", l)} className={`flex-1 py-2 rounded-xl text-sm font-semibold ${editing.label === l ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-slate-100 text-slate-500"}`}>{l}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={editing.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Full name" className="border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
              <input value={editing.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="Phone" className="border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
            </div>
            <input value={editing.line1} onChange={(e) => set("line1", e.target.value)} placeholder="Flat / house no., building" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
            <input value={editing.line2} onChange={(e) => set("line2", e.target.value)} placeholder="Street / locality" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
            <input value={editing.area} onChange={(e) => set("area", e.target.value)} placeholder="Area / landmark (optional)" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
            <div className="grid grid-cols-2 gap-3">
              <input value={editing.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className="border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
              <input value={editing.state} onChange={(e) => set("state", e.target.value)} placeholder="State" className="border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
            </div>
            <input value={editing.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="PIN code" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />

            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!editing.is_default} onChange={(e) => set("is_default", e.target.checked)} className="w-4 h-4 accent-brand-600" />
              Set as default delivery address
            </label>

            {err && <p className="text-red-500 text-xs">{err}</p>}

            <div className="flex gap-2 pt-1">
              <button onClick={submit} disabled={addrBusy} className="flex-1 bg-linear-to-r from-brand-600 to-accent-500 text-white font-semibold py-3 rounded-xl shadow-md shadow-brand-500/25 disabled:opacity-60">{addrBusy ? "Saving…" : "Save address"}</button>
              <button onClick={() => setEditing(null)} className="px-5 border border-slate-200 rounded-xl text-sm text-slate-500">Cancel</button>
            </div>
          </div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-8 mt-20">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-4"><MapPin size={32} className="text-brand-500" /></div>
          <p className="font-bold text-slate-800 text-lg">No addresses yet</p>
          <p className="text-slate-400 text-sm mt-1">Add a delivery address to speed up checkout.</p>
          <button onClick={startNew} className="mt-5 bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2"><Plus size={18} /> Add address</button>
        </div>
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
              <p className="text-sm text-slate-500">{[a.city, a.state].filter(Boolean).join(", ")} {a.pincode}</p>
              <div className="flex items-center gap-2 mt-3">
                {!a.is_default && <button onClick={() => makeDefaultAddress(a.id)} disabled={addrBusy} className="text-xs font-semibold text-brand-600 disabled:opacity-50">Set as default</button>}
                <button onClick={() => startEdit(a)} className="ml-auto w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><Edit3 size={15} /></button>
                <button onClick={() => deleteAddress(a.id)} disabled={addrBusy} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 disabled:opacity-50"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          <button onClick={startNew} className="w-full border border-dashed border-brand-300 text-brand-600 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2"><Plus size={18} /> Add another address</button>
        </div>
      )}
    </div>
  );
}
