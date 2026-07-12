import React, { useEffect } from "react";
import { ChevronLeft, MapPin, Package } from "lucide-react";
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

export default function AdminOrders() {
  const { adminOrders, ordersBusy, loadAdminOrders, updateOrderStatus, reconcileOrders, goBack } = useStore();
  useEffect(() => { loadAdminOrders(); }, []);

  // On load, reconcile any pending online orders against Razorpay: settle
  // captured-but-pending ones (so revenue is right) and sweep abandoned checkouts.
  // Only fires when such rows exist, so a clean list makes zero Razorpay calls.
  useEffect(() => {
    if (adminOrders.some((o) => o.payment_method === "online" && o.payment_status === "pending" && o.status !== "cancelled")) {
      reconcileOrders();
    }
  }, [adminOrders]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = adminOrders.map(normalizeOrder);
  // Count toward revenue/AOV only real orders: not cancelled, and not an online
  // attempt that was never paid (abandoned/failed Razorpay leaves a pending row).
  const paid = adminOrders.filter((o) => o.status !== "cancelled" && !(o.payment_method === "online" && o.payment_status !== "paid"));
  const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
  const aov = paid.length ? Math.round(revenue / paid.length) : 0;
  const statusCounts = adminOrders.reduce((m, o) => { const s = o.status || "placed"; m[s] = (m[s] || 0) + 1; return m; }, {});

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="rounded-b-3xl" style={panelBlueDeep}>
        <div className="px-5 pt-[18px] pb-4 flex items-center gap-3">
          <button onClick={() => goBack("admin")} aria-label="Back" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><ChevronLeft size={18} className="text-white" /></button>
          <div>
            <p className="text-white font-bold text-lg">Orders</p>
            <p className="text-brand-100 text-[11px]">{adminOrders.length} order{adminOrders.length !== 1 ? "s" : ""} · {formatINR(revenue)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {adminOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-card p-4 mb-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-bold text-slate-900">{adminOrders.length}</p><p className="text-[10px] text-slate-400">Orders</p></div>
              <div><p className="text-lg font-bold text-slate-900">{formatINR(revenue)}</p><p className="text-[10px] text-slate-400">Revenue</p></div>
              <div><p className="text-lg font-bold text-slate-900">{formatINR(aov)}</p><p className="text-[10px] text-slate-400">Avg order</p></div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
              {ALL_STATUSES.map((s) => statusCounts[s] ? <span key={s} className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${statusChip[s] || "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[s]} · {statusCounts[s]}</span> : null)}
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

        <div className="space-y-3">
          {list.map((o) => (
            <div key={o.key} className="bg-white rounded-xl shadow-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">#{o.ref}</p>
                  <p className="text-xs text-slate-400">{fmtDate(o.date)} · {o.name || "—"}{o.contact ? " · " + o.contact : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 block">{formatINR(o.total)}</span>
                  <PayBadge o={o} />
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

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${statusChip[o.status] || "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[o.status] || o.status}</span>
                <select
                  value={o.status}
                  disabled={ordersBusy}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === o.status) return;
                    // Cancelling is destructive (a paid online order fires a REAL
                    // Razorpay refund) — confirm before it goes through.
                    if (v === "cancelled") {
                      const msg = (o.paymentMethod === "online" && o.paymentStatus === "paid")
                        ? "Cancel this order and refund the customer at Razorpay? This can't be undone."
                        : "Cancel this order? This can't be undone.";
                      if (typeof window !== "undefined" && !window.confirm(msg)) return;
                    }
                    updateOrderStatus(o.key, v);
                  }}
                  className="border border-slate-200 rounded-lg py-2 pl-2.5 pr-8 text-sm outline-hidden bg-white disabled:opacity-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 select-chevron"
                >
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
