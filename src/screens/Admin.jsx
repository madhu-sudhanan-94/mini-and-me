import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, LogOut, Edit3, Plus, Trash2, Package, ChevronRight, Upload,
  Search, X, Check, IndianRupee, ShoppingBag, Clock, PackageX, AlertTriangle, RefreshCw,
} from "lucide-react";
import { formatINR, CAT_LABEL } from "../lib/format.js";
import { panelBlueDeep } from "../theme.js";
import { outOfStock, lowStock, COLOR_FAMILIES } from "../lib/catalog.js";
import { L, W, K } from "../data/products.js";
import Garment from "../components/Garment.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useStore } from "../store.jsx";

const SHAPES = ["dress", "tee", "shirt", "tunic", "jacket", "pants", "shorts", "overall", "toy"];
const CATS = ["women", "men", "kids", "toys"];

// One tile in the blue header's stat strip.
function StatTile({ icon: Icon, value, label }) {
  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-white">
        {Icon && <Icon size={13} className="text-brand-100 shrink-0" />}
        <p className="font-bold text-base leading-tight truncate">{value}</p>
      </div>
      <p className="text-brand-100 text-[10px] mt-0.5">{label}</p>
    </div>
  );
}

// Stock badge shown on each product row.
function StockBadge({ p }) {
  if (outOfStock(p)) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600"><PackageX size={11} /> Out of stock</span>;
  }
  if (lowStock(p)) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600"><AlertTriangle size={11} /> {p.stock} left</span>;
  }
  return null;
}

export default function Admin() {
  const {
    products, adminOrders, ordersBusy, loadAdminOrders,
    form, setForm, blankForm, adminBusy,
    saveProduct, editProduct, deleteProduct, refreshFromDb, auth, logout, setScreen, goBack,
    uploadProductImage, importProductsCsv,
  } = useStore();

  const [search, setSearch] = useState("");
  const [draftColor, setDraftColor] = useState("#2563EB");
  const [imgDraft, setImgDraft] = useState("");
  const [sizeDraft, setSizeDraft] = useState("");
  const formRef = useRef(null);
  const editing = !!form.id;
  // The size set a product uses depends on its category/shape (mirrors store.saveProduct).
  const formSizes = form.cat === "toys" ? [] : form.cat === "kids" ? K : ["pants", "shorts"].includes(form.shape) ? W : L;
  const allSizes = [...formSizes, ...(form.customSizes || []).filter((s) => s && !formSizes.includes(s))];
  const addCustomSize = () => { const s = sizeDraft.trim(); if (!s || allSizes.some((x) => x.toLowerCase() === s.toLowerCase())) return; setForm((f) => ({ ...f, customSizes: [...(f.customSizes || []), s] })); setSizeDraft(""); };
  const removeCustomSize = (s) => setForm((f) => ({ ...f, customSizes: (f.customSizes || []).filter((x) => x !== s), sizeStock: Object.fromEntries(Object.entries(f.sizeStock || {}).filter(([k]) => k !== s)) }));

  useEffect(() => { loadAdminOrders(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Stats (fixed: orders/revenue now come from adminOrders, not local state) ----
  const revenue = useMemo(() => adminOrders.reduce((s, o) => s + (o.total || 0), 0), [adminOrders]);
  const pending = useMemo(
    () => adminOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length,
    [adminOrders],
  );
  const oosCount = useMemo(() => products.filter(outOfStock).length, [products]);
  const lowCount = useMemo(() => products.filter(lowStock).length, [products]);

  // ---- Product search ----
  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return products;
    return products.filter((p) =>
      `${p.name} ${CAT_LABEL[p.cat] || p.cat} ${p.shape} ${p.tag || ""}`.toLowerCase().includes(q)
    );
  }, [products, q]);

  // ---- Multiple-colour editor (reads/writes the form.colors ARRAY) ----
  // Defensive read: tolerate a single-`color` form shape too, so the editor
  // works whether or not the store migration to `colors` has landed yet.
  const colors = useMemo(() => {
    if (Array.isArray(form.colors) && form.colors.length) return form.colors;
    if (form.color) return [form.color];
    return ["#2563EB"];
  }, [form.colors, form.color]);

  const addColor = () => {
    if (colors.some((c) => String(c).toLowerCase() === draftColor.toLowerCase())) return;
    setForm({ ...form, colors: [...colors, draftColor], color: colors[0] });
  };
  const removeColor = (hex) => {
    const next = colors.filter((c) => c !== hex);
    const safe = next.length ? next : ["#2563EB"]; // never zero
    setForm({ ...form, colors: safe, color: safe[0] });
  };

  // ---- Image list editor (form.image is newline-joined URLs) ----
  const imgLines = form.image ? form.image.split("\n") : [];
  const setImages = (arr) => setForm((f) => ({ ...f, image: arr.join("\n") }));
  const setImageAt = (i, val) => setImages(imgLines.map((u, idx) => (idx === i ? val : u)));
  const removeImageAt = (i) => setImages(imgLines.filter((_, idx) => idx !== i));
  const addImageUrl = () => { const u = imgDraft.trim(); if (!u) return; setImages([...imgLines, u]); setImgDraft(""); };

  const scrollToForm = () => setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  const startEdit = (p) => { editProduct(p); scrollToForm(); };
  const startAdd = () => { setForm(blankForm); scrollToForm(); };

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* ============ Blue admin header ============ */}
      <div className="rounded-b-3xl" style={panelBlueDeep}>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between max-w-5xl mx-auto lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => goBack("account")} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:scale-95 transition"><ChevronLeft size={18} className="text-white" /></button>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Admin</p>
              <p className="text-brand-100 text-[11px]">{auth?.id}</p>
            </div>
          </div>
          <button onClick={logout} className="text-white/90 flex items-center gap-1.5 text-xs font-semibold bg-white/15 rounded-full px-3 py-1.5 active:scale-95 transition"><LogOut size={15} /><span className="hidden sm:inline">Log out</span></button>
        </div>

        {/* 2-row stat strip (single 6-wide row on desktop) */}
        <div className="px-5 pb-5 max-w-5xl mx-auto lg:px-8">
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
            <StatTile icon={Package} value={products.length} label="Products" />
            <StatTile icon={ShoppingBag} value={ordersBusy ? "…" : adminOrders.length} label="Orders" />
            <StatTile icon={IndianRupee} value={ordersBusy ? "…" : formatINR(revenue)} label="Revenue" />
            <StatTile icon={Clock} value={ordersBusy ? "…" : pending} label="Pending" />
            <StatTile icon={PackageX} value={oosCount} label="Out of stock" />
            <StatTile icon={AlertTriangle} value={lowCount} label="Low stock" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-5xl mx-auto w-full lg:px-8">
        {/* ============ Quick actions ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button onClick={() => setScreen("adminorders")} className="bg-white rounded-xl p-4 shadow-card flex items-center gap-3.5 active:scale-[0.99] transition text-left">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0"><Package size={19} className="text-brand-600" /></div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-slate-800 block text-sm">Manage orders</span>
              <span className="text-[11px] text-slate-400">{ordersBusy ? "Loading…" : `${adminOrders.length} total · ${pending} pending`}</span>
            </div>
            <ChevronRight size={20} className="text-slate-300 shrink-0" />
          </button>
          <button onClick={startAdd} className="bg-white rounded-xl p-4 shadow-card flex items-center gap-3.5 active:scale-[0.99] transition text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><Plus size={19} className="text-emerald-600" /></div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-slate-800 block text-sm">Add product</span>
              <span className="text-[11px] text-slate-400">Start a fresh listing</span>
            </div>
            <ChevronRight size={20} className="text-slate-300 shrink-0" />
          </button>
        </div>

        {/* ============ Form + list (side by side on desktop) ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-5 lg:items-start">
          {/* -------- Add / edit form (clearly-marked card) -------- */}
          <div
            ref={formRef}
            className={`rounded-xl p-4 shadow-card mb-4 lg:mb-0 lg:sticky lg:top-4 scroll-mt-4 transition-colors ${editing ? "bg-brand-50 ring-2 ring-brand-500" : "bg-white"}`}
          >
            {editing ? (
              <div className="-mx-4 -mt-4 mb-4 rounded-t-2xl bg-brand-600 px-4 py-2.5 flex items-center justify-between gap-2">
                <p className="text-white text-sm font-semibold flex items-center gap-2 min-w-0">
                  <Edit3 size={15} className="shrink-0" />
                  <span className="truncate">Editing: {form.name || "product"}</span>
                </p>
                <button onClick={() => setForm(blankForm)} className="text-white/90 hover:text-white text-xs font-semibold inline-flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 active:scale-95 transition shrink-0"><X size={13} /> Cancel</button>
              </div>
            ) : (
              <p className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Plus size={16} className="text-brand-600" /> Add product</p>
            )}

            <div className="flex gap-3 items-center mb-3">
              <div className="w-16 h-16 rounded-xl bg-linear-to-br from-accent-50 to-brand-100 flex items-center justify-center shrink-0">
                <Garment shape={form.shape} color={colors[0]} className="h-[80%]" />
              </div>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="flex-1 border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white" />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} className="border border-slate-200 rounded-lg py-2.5 pl-2 pr-8 text-sm outline-hidden bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 select-chevron">
                {CATS.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
              <select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })} className="border border-slate-200 rounded-lg py-2.5 pl-2 pr-8 text-sm outline-hidden bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 select-chevron">
                {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="Price ₹" className="border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white" />
              <input value={form.original} onChange={(e) => setForm({ ...form, original: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="MRP ₹ (optional)" className="border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white" />
            </div>

            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Description (shown on the product page)" className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white resize-none mb-2" />

            <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="Total stock qty (leave blank if not tracking)" className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white mb-2" />

            {/* Per-size stock (optional — overrides total stock when any are set) */}
            <div className="mb-2">
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Stock per size <span className="font-normal text-slate-400">(optional)</span></p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allSizes.map((s) => {
                  const custom = (form.customSizes || []).includes(s);
                  return (
                    <div key={s} className="flex items-center gap-1 border border-slate-200 rounded-lg pl-2 pr-1 py-1 bg-white">
                      <span className="text-[11px] font-semibold text-slate-500 min-w-[28px]">{s}</span>
                      <input value={(form.sizeStock && form.sizeStock[s]) || ""} onChange={(e) => setForm({ ...form, sizeStock: { ...(form.sizeStock || {}), [s]: e.target.value.replace(/\D/g, "") } })} inputMode="numeric" placeholder="—" className="w-12 border border-slate-200 rounded py-1 px-1.5 text-sm text-center outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
                      {custom && <button type="button" onClick={() => removeCustomSize(s)} aria-label={`Remove ${s}`} className="w-4 h-4 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 flex items-center justify-center shrink-0"><X size={10} /></button>}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <input value={sizeDraft} onChange={(e) => setSizeDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }} placeholder="Add custom size (e.g. 10Y, XXXL)" className="flex-1 min-w-0 border border-slate-200 rounded-lg py-2 px-3 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white" />
                <button type="button" onClick={addCustomSize} disabled={!sizeDraft.trim()} className="inline-flex items-center gap-1 border border-brand-200 bg-brand-50 rounded-lg px-3 py-2 text-xs font-semibold text-brand-600 disabled:opacity-50 active:scale-95 transition shrink-0"><Plus size={14} /> Add</button>
              </div>
            </div>

            {/* -------- Image editor: one box per image, preview + delete -------- */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Images</p>
              <div className="space-y-2 mb-2">
                {imgLines.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      {url.trim() && <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                    </div>
                    <input value={url} onChange={(e) => setImageAt(i, e.target.value)} placeholder="Image URL" className="flex-1 min-w-0 text-xs text-slate-600 outline-hidden bg-transparent" />
                    <button type="button" onClick={() => removeImageAt(i)} aria-label="Delete image" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-500 flex items-center justify-center shrink-0 transition"><Trash2 size={15} /></button>
                  </div>
                ))}
                {imgLines.length === 0 && <p className="text-xs text-slate-400 py-1">No images yet — add a URL or upload below.</p>}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <input value={imgDraft} onChange={(e) => setImgDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }} placeholder="Paste image URL" className="flex-1 min-w-0 border border-slate-200 rounded-lg py-2 px-3 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white" />
                <button type="button" onClick={addImageUrl} disabled={!imgDraft.trim()} className="inline-flex items-center gap-1 border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 active:scale-95 transition shrink-0"><Plus size={14} /> Add</button>
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 cursor-pointer border border-brand-200 bg-brand-50 rounded-lg px-3 py-2 active:scale-95 transition shrink-0">
                  <Upload size={14} /> Upload
                  <input type="file" accept="image/*" className="hidden" disabled={adminBusy}
                    onChange={async (e) => { const file = e.target.files && e.target.files[0]; e.target.value = ""; if (file) { const url = await uploadProductImage(file); if (url) setForm((f) => ({ ...f, image: (f.image ? f.image + "\n" : "") + url })); } }} />
                </label>
              </div>
            </div>

            {/* -------- Colour editor -------- */}
            <div className="mb-3 rounded-xl border border-slate-100 bg-white p-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">Colours <span className="font-normal text-slate-400">· {colors.length} selected</span></p>

              {/* selected colours — tap the × to remove */}
              <div className="flex flex-wrap gap-2.5 mb-3">
                {colors.map((hex) => (
                  <button type="button" key={hex} onClick={() => removeColor(hex)} disabled={colors.length <= 1} title={`Remove ${hex}`} aria-label={`Remove ${hex}`}
                    className="group relative w-9 h-9 rounded-full shadow-sm ring-1 ring-black/10 active:scale-90 transition disabled:active:scale-100" style={{ backgroundColor: hex }}>
                    {colors.length > 1 && <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center text-slate-500 group-hover:text-rose-500 group-hover:bg-rose-50"><X size={11} /></span>}
                  </button>
                ))}
              </div>

              {/* palette — tap to add / remove */}
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Tap to add</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {COLOR_FAMILIES.map((f) => {
                  const match = colors.find((c) => String(c).toLowerCase() === f.hex.toLowerCase());
                  const light = f.key === "white" || f.key === "yellow";
                  return (
                    <button type="button" key={f.key} title={f.label} aria-label={f.label} aria-pressed={!!match}
                      onClick={() => (match ? removeColor(match) : setForm({ ...form, colors: [...colors, f.hex], color: colors[0] }))}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90 ${match ? "ring-2 ring-offset-2 ring-slate-800" : "ring-1 ring-black/10 hover:scale-110"}`} style={{ backgroundColor: f.hex }}>
                      {match && <Check size={14} className={light ? "text-slate-800" : "text-white"} />}
                    </button>
                  );
                })}
              </div>

              {/* custom colour */}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                <label className="relative w-9 h-9 rounded-lg ring-1 ring-slate-200 overflow-hidden cursor-pointer shrink-0" style={{ backgroundColor: draftColor }}>
                  <input type="color" value={draftColor} onChange={(e) => setDraftColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Pick a custom colour" />
                </label>
                <span className="text-xs font-mono font-medium text-slate-500 uppercase w-[68px]">{draftColor}</span>
                <button type="button" onClick={addColor} className="ml-auto inline-flex items-center gap-1 border border-brand-200 bg-brand-50 rounded-lg px-3 py-2 text-xs font-semibold text-brand-600 active:scale-95 transition"><Plus size={14} /> Add custom</button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={form.trending} onChange={(e) => setForm({ ...form, trending: e.target.checked })} className="w-4 h-4 accent-brand-600" />
                Show in Trending
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={form.tag === "new"} onChange={(e) => setForm({ ...form, tag: e.target.checked ? "new" : "" })} className="w-4 h-4 accent-brand-600" />
                Show in New in
              </label>
            </div>

            <div className="flex gap-2">
              <PrimaryButton variant={editing ? "solid" : "gradient"} size="md" full={false} onClick={saveProduct} disabled={adminBusy} className="flex-1 text-sm">
                {adminBusy ? "Saving…" : (editing ? <><Check size={15} /> Save changes</> : <><Plus size={15} /> Add product</>)}
              </PrimaryButton>
              {editing && <button onClick={() => setForm(blankForm)} className="px-4 border border-slate-200 bg-white rounded-xl text-sm text-slate-500 font-medium active:scale-95 transition">Cancel</button>}
            </div>
          </div>

          {/* -------- Product manager -------- */}
          <div>
            {/* Sticky search */}
            <div className="sticky top-0 z-10 -mx-5 px-5 pt-1 pb-2 bg-slate-50/95 backdrop-blur-sm lg:mx-0 lg:px-0 lg:top-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-9 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 shadow-xs" />
                {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Clear search"><X size={16} /></button>}
              </div>
            </div>

            <p className="font-bold text-slate-800 my-2 px-1 text-sm">
              {q ? `Results (${filtered.length})` : `All products (${products.length})`}
            </p>

            <div className="space-y-2">
              {filtered.map((p) => {
                const isRow = form.id === p.id;
                return (
                  <div key={p.id} className={`bg-white rounded-xl p-2.5 shadow-card flex items-center gap-3 ${isRow ? "ring-2 ring-brand-500" : ""}`}>
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-accent-50 to-brand-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.images && p.images[0]
                        ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        : <Garment shape={p.shape} color={(p.colors && p.colors[0]) || "#2563EB"} className="h-[80%]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[55%]">{p.name}</p>
                        <StockBadge p={p} />
                      </div>
                      <p className="text-xs text-slate-400">{CAT_LABEL[p.cat]} · {formatINR(p.price)}{p.trending ? " · Trending" : ""}</p>
                    </div>
                    <button onClick={() => startEdit(p)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition" aria-label="Edit"><Edit3 size={15} /></button>
                    <button onClick={() => deleteProduct(p.id)} disabled={adminBusy} className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 disabled:opacity-50 active:scale-95 transition" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="bg-white rounded-xl p-6 shadow-card text-center text-sm text-slate-400">
                  No products match “{search}”.
                </div>
              )}
            </div>

            {/* -------- Data tools -------- */}
            <button onClick={refreshFromDb} disabled={adminBusy} className="w-full mt-5 mb-1 border border-slate-200 bg-white text-slate-600 font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99] transition">
              <RefreshCw size={16} /> Refresh from database
            </button>
            <label className={`w-full mt-2 border border-slate-200 bg-white text-slate-600 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 ${adminBusy ? "opacity-60" : "cursor-pointer active:scale-[0.99] transition"}`}>
              <Upload size={16} /> Import products (CSV)
              <input type="file" accept=".csv,text/csv" className="hidden" disabled={adminBusy}
                onChange={(e) => { const file = e.target.files && e.target.files[0]; e.target.value = ""; if (file) { const reader = new FileReader(); reader.onload = () => importProductsCsv(String(reader.result || "")); reader.readAsText(file); } }} />
            </label>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              CSV columns: name, category, shape, price, original_price, colors, sizes, images, trending, tag, description, stock, size_stock. Separate multiple colours / sizes / image URLs with <b>|</b>; per-size stock as <b>S:5|M:0|L:3</b>. Rows with an unknown category are skipped.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
