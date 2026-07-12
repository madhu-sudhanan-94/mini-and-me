import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, MapPin, Package, Search, X, Truck, RotateCcw, TrendingUp } from "lucide-react";
import { formatINR } from "../lib/format.js";
import { ALL_STATUSES, STATUS_LABEL, fmtDate, normalizeOrder, shipLines } from "../lib/orders.js";
import { panelBlueDeep } from "../theme.js";
import Skeleton from "../components/Skeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useStore } from "../store.jsx";

const statusChip = {
  placed: "bg-amber-50 text-amber-700",
  confirmed: "bg-brand-50 text-brand-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};

// Payment badge so an unpaid/abandoned online order is never mistaken for a real one.
function PayBadge({ o }) {
  const m = o.paymentMethod, s = o.paymentStatus;
  let text, cls;
  if (m === "online" && s === "paid") { text = "Paid online"; cls = "bg-green-50 text-green-700"; }
  else if (m === "online" && s === "refunded") { text = "Refunded"; cls = "bg-slate-100 text-slate-500"; }
  else if (m === "online") { text = "Unpaid"; cls = "bg-red-50 text-red-600"; }
  else if (m === "cod") { text = "COD"; cls = "bg-slate-100 text-slate-600"; }
  else return null;
  return <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{text}</span>;
}

// A real (counts-for-revenue) order: not cancelled, and not an unpaid online attempt.
const isPaidReal = (o) => o.status !== "cancelled" && !(o.paymentMethod === "online" && o.paymentStatus !== "paid");
// Paid and awaiting dispatch.
const isToShip = (o) => (o.status === "placed" || o.status === "confirmed") && isPaidReal(o);

const RANGES = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
];

// One order card, with its own tracking-editor + partial-refund local state.
function AdminOrderCard({ o }) {
  const { updateOrderStatus, saveTracking, partialRefund, ordersBusy } = useStore();
  const [trackOpen, setTrackOpen] = useState(false);
  const [tk, setTk] = useState({ carrier: o.trackingCarrier || "", number: o.trackingNumber || "", url: o.trackingUrl || "", eta: o.trackingEta || "" });
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmt, setRefundAmt] = useState("");

  const canRefund = o.paymentMethod === "online" && o.paymentStatus === "paid" && o.status !== "cancelled";
  const remaining = Math.max(0, (o.total || 0) - (o.amountRefunded || 0));
  const hasTracking = o.trackingNumber || o.trackingUrl || o.trackingCarrier;

  const onStatusChange = (e) => {
    const v = e.target.value;
    if (v === o.status) return;
    if (v === "cancelled") {
      const msg = (o.paymentMethod === "online" && o.paymentStatus === "paid")
        ? "Cancel this order and refund the customer at Razorpay? This can't be undone."
        : "Cancel this order? This can't be undone.";
      if (typeof window !== "undefined" && !window.confirm(msg)) return;
    }
    updateOrderStatus(o.key, v);
  };

  const saveTk = async () => { const ok = await saveTracking(o.key, tk); if (ok) setTrackOpen(false); };
  const doRefund = async () => {
    // Clamp to the remaining refundable so the confirm dialog matches what the
    // server will actually refund (it caps at the Razorpay remainder too).
    const amt = Math.min(Math.floor(Number(refundAmt)), remaining);
    if (!Number.isFinite(amt) || amt <= 0) return;
    if (typeof window !== "undefined" && !window.confirm(`Refund ₹${amt} to the customer at Razorpay? This can't be undone.`)) return;
    const ok = await partialRefund(o.key, amt);
    if (ok) { setRefundAmt(""); setRefundOpen(false); }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-800">#{o.ref}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusChip[o.status] || "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[o.status] || o.status}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{fmtDate(o.date)} · {o.name || "—"}{o.contact ? " · " + o.contact : ""}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="font-bold text-slate-900 block">{formatINR(o.total)}</span>
          <PayBadge o={o} />
          {o.amountRefunded > 0 && <span className="block mt-0.5 text-[10px] font-bold text-slate-500">−{formatINR(o.amountRefunded)} refunded</span>}
        </div>
      </div>

      {o.items.length > 0 && (
        <div className="mt-2.5 space-y-1">
          {o.items.map((it, i) => (
            <div key={i} className="flex justify-between text-xs text-slate-500">
              <span className="truncate pr-2">{it.product_name} · {it.size} × {it.qty}</span>
              <span className="shrink-0">{formatINR((it.unit_price || 0) * (it.qty || 1))}</span>
            </div>
          ))}
        </div>
      )}

      {o.shipping && (
        <div className="mt-2.5 flex gap-2">
          <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">{[o.shipping.full_name, o.shipping.phone, shipLines(o.shipping)].filter(Boolean).join(" · ")}</p>
        </div>
      )}

      {o.note && (
        <div className="mt-2.5 rounded-lg bg-amber-50 px-2.5 py-2">
          <p className="text-xs text-amber-700 leading-relaxed whitespace-pre-line"><span className="font-semibold">Note:</span> {o.note}</p>
        </div>
      )}

      {/* Tracking summary (when set) */}
      {hasTracking && !trackOpen && (
        <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-2">
          <Truck size={14} className="text-brand-600 shrink-0" />
          <span className="truncate">{[o.trackingCarrier, o.trackingNumber, o.trackingEta].filter(Boolean).join(" · ") || "Tracking added"}</span>
        </div>
      )}

      {/* Actions: change status, then tracking / refund */}
      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 shrink-0">Update status</span>
          <select value={o.status} disabled={ordersBusy} onChange={onStatusChange} className="flex-1 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm outline-hidden bg-white disabled:opacity-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 select-chevron">
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTrackOpen((v) => !v)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg py-2 active:scale-95 transition">
            <Truck size={14} /> {hasTracking ? "Edit tracking" : "Add tracking"}
          </button>
          {canRefund && (
            <button onClick={() => setRefundOpen((v) => !v)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg py-2 active:scale-95 transition">
              <RotateCcw size={14} /> Refund
            </button>
          )}
        </div>
      </div>

      {/* Tracking editor — opens under the actions */}
      {trackOpen && (
        <div className="mt-2.5 rounded-lg border border-slate-200 p-2.5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={tk.carrier} onChange={(e) => setTk((s) => ({ ...s, carrier: e.target.value }))} placeholder="Carrier (e.g. Delhivery)" className="border border-slate-200 rounded-lg py-2 px-2.5 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
            <input value={tk.number} onChange={(e) => setTk((s) => ({ ...s, number: e.target.value }))} placeholder="AWB / tracking no." className="border border-slate-200 rounded-lg py-2 px-2.5 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
          </div>
          <input value={tk.url} onChange={(e) => setTk((s) => ({ ...s, url: e.target.value }))} placeholder="Tracking link (https://…)" className="w-full border border-slate-200 rounded-lg py-2 px-2.5 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
          <input value={tk.eta} onChange={(e) => setTk((s) => ({ ...s, eta: e.target.value }))} placeholder="ETA (optional, e.g. 3–5 days)" className="w-full border border-slate-200 rounded-lg py-2 px-2.5 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
          <div className="flex gap-2">
            <button onClick={saveTk} disabled={ordersBusy} className="flex-1 bg-brand-600 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50 active:scale-[0.98] transition">Save tracking</button>
            <button onClick={() => setTrackOpen(false)} className="px-4 border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Partial-refund editor — opens under the actions */}
      {refundOpen && (
        <div className="mt-2.5 rounded-lg border border-slate-200 p-2.5">
          <p className="text-xs text-slate-500 mb-1.5">Refundable: <span className="font-semibold text-slate-700">{formatINR(remaining)}</span></p>
          <div className="flex gap-2">
            <input value={refundAmt} onChange={(e) => setRefundAmt(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Amount ₹" className="flex-1 min-w-0 border border-slate-200 rounded-lg py-2 px-2.5 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
            <button onClick={doRefund} disabled={ordersBusy || !refundAmt} className="bg-rose-600 text-white text-sm font-semibold px-4 rounded-lg disabled:opacity-50 active:scale-[0.98] transition">Refund</button>
            <button onClick={() => setRefundOpen(false)} className="px-3 border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrders() {
  const { adminOrders, ordersBusy, loadAdminOrders, reconcileOrders, goBack } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | status | 'toship'
  const [range, setRange] = useState("all");

  useEffect(() => { loadAdminOrders(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On load, reconcile any pending online orders against Razorpay: settle
  // captured-but-pending ones (so revenue is right) and sweep abandoned checkouts.
  // Only fires when such rows exist, so a clean list makes zero Razorpay calls.
  useEffect(() => {
    if (adminOrders.some((o) => o.payment_method === "online" && (o.payment_status === "pending" || o.payment_status === "failed") && o.status !== "cancelled")) {
      reconcileOrders();
    }
  }, [adminOrders]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => adminOrders.map(normalizeOrder), [adminOrders]);

  // ---- Sales report over the selected date range ----
  const report = useMemo(() => {
    let cutoff = null;
    if (range !== "all") {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      cutoff = range === "today" ? d.getTime() : Date.now() - (range === "7d" ? 7 : 30) * 86400000;
    }
    const inRange = (o) => { if (!cutoff) return true; const t = new Date(o.date).getTime(); return Number.isFinite(t) && t >= cutoff; };
    const paid = list.filter((o) => isPaidReal(o) && inRange(o));
    // Net of partial refunds: a partially-refunded order stays 'paid' (not
    // cancelled), so subtract what was returned or Revenue/AOV overstate takings.
    const refunded = paid.reduce((s, o) => s + (o.amountRefunded || 0), 0);
    const revenue = paid.reduce((s, o) => s + Math.max(0, (o.total || 0) - (o.amountRefunded || 0)), 0);
    const aov = paid.length ? Math.round(revenue / paid.length) : 0;
    // Best sellers by units sold across paid orders in range.
    const byProduct = {};
    paid.forEach((o) => (o.items || []).forEach((it) => {
      const key = it.product_name || "Item";
      const e = byProduct[key] || (byProduct[key] = { name: key, qty: 0, revenue: 0 });
      e.qty += it.qty || 0;
      e.revenue += (it.unit_price || 0) * (it.qty || 0);
    }));
    const bestSellers = Object.values(byProduct).sort((a, b) => b.qty - a.qty).slice(0, 5);
    return { count: paid.length, revenue, refunded, aov, bestSellers };
  }, [list, range]);

  const statusCounts = useMemo(() => list.reduce((m, o) => { const s = o.status || "placed"; m[s] = (m[s] || 0) + 1; return m; }, {}), [list]);
  const toShipCount = useMemo(() => list.filter(isToShip).length, [list]);

  // ---- Visible order list (search + status/to-ship filter) ----
  const q = search.trim().toLowerCase();
  const visible = useMemo(() => list.filter((o) => {
    if (statusFilter === "toship") { if (!isToShip(o)) return false; }
    else if (statusFilter !== "all") { if (o.status !== statusFilter) return false; }
    if (!q) return true;
    return `${o.ref} ${o.name || ""} ${o.contact || ""} ${o.trackingNumber || ""}`.toLowerCase().includes(q);
  }), [list, statusFilter, q]);

  const FilterChip = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition ${active ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>{children}</button>
  );

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="rounded-b-3xl" style={panelBlueDeep}>
        <div className="px-5 pt-[18px] pb-4 flex items-center gap-3">
          <button onClick={() => goBack("admin")} aria-label="Back" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><ChevronLeft size={18} className="text-white" /></button>
          <div>
            <p className="text-white font-bold text-lg">Orders</p>
            <p className="text-brand-100 text-[11px]">{adminOrders.length} order{adminOrders.length !== 1 ? "s" : ""} · {toShipCount} to ship</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* ---- Sales report ---- */}
        {adminOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-card p-4 mb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-3">
              {RANGES.map((r) => <FilterChip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>{r.label}</FilterChip>)}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-bold text-slate-900">{report.count}</p><p className="text-[10px] text-slate-400">Paid orders</p></div>
              <div><p className="text-lg font-bold text-slate-900">{formatINR(report.revenue)}</p><p className="text-[10px] text-slate-400">Revenue{report.refunded > 0 ? " (net)" : ""}</p></div>
              <div><p className="text-lg font-bold text-slate-900">{formatINR(report.aov)}</p><p className="text-[10px] text-slate-400">Avg order</p></div>
            </div>
            {report.refunded > 0 && <p className="text-[11px] text-slate-400 text-center mt-1.5">Net of {formatINR(report.refunded)} refunded</p>}
            {report.bestSellers.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><TrendingUp size={13} className="text-brand-600" /> Best sellers</p>
                <div className="space-y-1.5">
                  {report.bestSellers.map((b) => (
                    <div key={b.name} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate pr-2">{b.name}</span>
                      <span className="text-slate-400 shrink-0">{b.qty} sold · {formatINR(b.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
              {ALL_STATUSES.map((s) => statusCounts[s] ? <span key={s} className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${statusChip[s] || "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[s]} · {statusCounts[s]}</span> : null)}
            </div>
          </div>
        )}

        {/* ---- Search + status filter ---- */}
        {adminOrders.length > 0 && (
          <div className="mb-3">
            <div className="relative mb-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by #ref, name, phone, tracking…" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-9 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 shadow-xs" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Clear search"><X size={16} /></button>}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All</FilterChip>
              <FilterChip active={statusFilter === "toship"} onClick={() => setStatusFilter("toship")}>To ship{toShipCount ? ` · ${toShipCount}` : ""}</FilterChip>
              {ALL_STATUSES.map((s) => <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{STATUS_LABEL[s]}</FilterChip>)}
            </div>
          </div>
        )}

        {ordersBusy && list.length === 0 && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-card p-4 space-y-2">
                <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /></div>
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-8 w-full mt-2" />
              </div>
            ))}
          </div>
        )}
        {!ordersBusy && list.length === 0 && <EmptyState icon={Package} title="No orders yet" subtitle="New orders will appear here." className="py-16" />}
        {list.length > 0 && visible.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-card text-center text-sm text-slate-400">No orders match your search or filter.</div>
        )}

        <div className="space-y-3">
          {visible.map((o) => <AdminOrderCard key={o.key} o={o} />)}
        </div>
      </div>
    </div>
  );
}
