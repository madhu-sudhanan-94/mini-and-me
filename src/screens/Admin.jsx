import React from "react";
import { ChevronLeft, LogOut, Edit3, Plus, Trash2, Package, ChevronRight, Upload } from "lucide-react";
import { formatINR, CAT_LABEL } from "../lib/format.js";
import { panelBlueDeep } from "../theme.js";
import Garment from "../components/Garment.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useStore } from "../store.jsx";

export default function Admin() {
  const {
    products, orders, form, setForm, blankForm, adminBusy,
    saveProduct, editProduct, deleteProduct, refreshFromDb, auth, logout, setScreen,
    uploadProductImage, importProductsCsv,
  } = useStore();

  const stats = [
    { label: "Products", value: products.length },
    { label: "Orders", value: orders.length },
    { label: "Revenue", value: formatINR(orders.reduce((s, o) => s + o.total, 0)) },
  ];
  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="rounded-b-3xl" style={panelBlueDeep}>
        <div className="px-5 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen("account")} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><ChevronLeft size={18} className="text-white" /></button>
            <div>
              <p className="text-white font-bold text-lg">Admin</p>
              <p className="text-brand-100 text-[11px]">{auth.id}</p>
            </div>
          </div>
          <button onClick={logout} className="text-white/90"><LogOut size={20} /></button>
        </div>
        <div className="grid grid-cols-3 gap-2 px-5 pb-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
              <p className="text-white font-bold text-base leading-tight">{s.value}</p>
              <p className="text-brand-100 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <button onClick={() => setScreen("adminorders")} className="w-full mb-4 bg-white rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center"><Package size={19} className="text-brand-600" /></div>
          <span className="flex-1 text-left font-semibold text-slate-800">Manage orders</span>
          <ChevronRight size={20} className="text-slate-300" />
        </button>

        {/* Add / edit form */}
        <div className="bg-white rounded-2xl p-4 shadow-xs mb-4">
          <p className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            {form.id ? <><Edit3 size={16} className="text-brand-600" /> Edit product</> : <><Plus size={16} className="text-brand-600" /> Add product</>}
          </p>
          <div className="flex gap-3 items-center mb-3">
            <div className="w-16 h-16 rounded-xl bg-linear-to-br from-accent-50 to-brand-100 flex items-center justify-center shrink-0">
              <Garment shape={form.shape} color={form.color} className="h-[80%]" />
            </div>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="flex-1 border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} className="border border-slate-200 rounded-lg py-2.5 px-2 text-sm outline-hidden">
              <option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option>
            </select>
            <select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })} className="border border-slate-200 rounded-lg py-2.5 px-2 text-sm outline-hidden">
              {["dress", "tee", "shirt", "tunic", "jacket", "pants", "shorts", "overall"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="Price ₹" className="border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500" />
            <input value={form.original} onChange={(e) => setForm({ ...form, original: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="MRP ₹ (optional)" className="border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500" />
          </div>
          <div className="mb-2">
            <textarea value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} rows={2} placeholder="Image URLs — one per line (optional)" className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500 resize-none" />
            <label className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 cursor-pointer">
              <Upload size={14} /> Upload image
              <input type="file" accept="image/*" className="hidden" disabled={adminBusy}
                onChange={async (e) => { const file = e.target.files && e.target.files[0]; e.target.value = ""; if (file) { const url = await uploadProductImage(file); if (url) setForm((f) => ({ ...f, image: (f.image ? f.image + "\n" : "") + url })); } }} />
            </label>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Colour</span>
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-9 h-9 rounded-lg border border-slate-200 bg-white" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.trending} onChange={(e) => setForm({ ...form, trending: e.target.checked })} className="w-4 h-4 accent-brand-600" />
              Show in Trending
            </label>
          </div>
          <div className="flex gap-2">
            <PrimaryButton variant="solid" size="md" full={false} onClick={saveProduct} disabled={adminBusy} className="flex-1 text-sm">{adminBusy ? "Saving…" : (form.id ? "Save changes" : "Add product")}</PrimaryButton>
            {form.id && <button onClick={() => setForm(blankForm)} className="px-4 border border-slate-200 rounded-lg text-sm text-slate-500">Cancel</button>}
          </div>
        </div>

        {/* Product list */}
        <p className="font-bold text-slate-800 mb-2 px-1">All products ({products.length})</p>
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-2.5 shadow-xs flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-accent-50 to-brand-100 flex items-center justify-center shrink-0">
                <Garment shape={p.shape} color={p.colors[0]} className="h-[80%]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                <p className="text-xs text-slate-400">{CAT_LABEL[p.cat]} · {formatINR(p.price)}</p>
              </div>
              <button onClick={() => editProduct(p)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><Edit3 size={15} /></button>
              <button onClick={() => deleteProduct(p.id)} disabled={adminBusy} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 disabled:opacity-50"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <button onClick={refreshFromDb} disabled={adminBusy} className="w-full mt-5 mb-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60">
          Refresh from database
        </button>
        <label className={`w-full mt-2 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 ${adminBusy ? "opacity-60" : "cursor-pointer"}`}>
          <Upload size={16} /> Import products (CSV)
          <input type="file" accept=".csv,text/csv" className="hidden" disabled={adminBusy}
            onChange={(e) => { const file = e.target.files && e.target.files[0]; e.target.value = ""; if (file) { const reader = new FileReader(); reader.onload = () => importProductsCsv(String(reader.result || "")); reader.readAsText(file); } }} />
        </label>
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
          CSV columns: name, category, shape, price, original_price, colors, sizes, images, trending, tag, description. Separate multiple colours / sizes / image URLs with <b>|</b>.
        </p>
      </div>
    </div>
  );
}
