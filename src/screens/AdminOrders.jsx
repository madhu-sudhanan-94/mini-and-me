import React, { useEffect } from "react";
import { ChevronLeft, MapPin } from "lucide-react";
import { formatINR } from "../lib/format.js";
import { ALL_STATUSES, STATUS_LABEL, fmtDate, normalizeOrder, shipLines } from "../lib/orders.js";
import { panelBlueDeep } from "../theme.js";
import { useStore } from "../store.jsx";

const statusChip = {
  placed: "bg-amber-50 text-amber-700",
  confirmed: "bg-brand-50 text-brand-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};

export default function AdminOrders() {
  const { adminOrders, ordersBusy, loadAdminOrders, updateOrderStatus, setScreen } = useStore();
  useEffect(() => { loadAdminOrders(); }, []);

  const list = adminOrders.map(normalizeOrder);
  const revenue = adminOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="rounded-b-3xl" style={panelBlueDeep}>
        <div className="px-5 pt-2 pb-4 flex items-center gap-3">
          <button onClick={() => setScreen("admin")} aria-label="Back" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><ChevronLeft size={18} className="text-white" /></button>
          <div>
            <p className="text-white font-bold text-lg">Orders</p>
            <p className="text-brand-100 text-[11px]">{adminOrders.length} order{adminOrders.length !== 1 ? "s" : ""} · {formatINR(revenue)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {ordersBusy && list.length === 0 && <p className="text-center text-slate-400 text-sm py-10">Loading orders…</p>}
        {!ordersBusy && list.length === 0 && <p className="text-center text-slate-400 text-sm py-10">No orders yet.</p>}

        <div className="space-y-3">
          {list.map((o) => (
            <div key={o.key} className="bg-white rounded-2xl shadow-xs p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">#{o.ref}</p>
                  <p className="text-xs text-slate-400">{fmtDate(o.date)} · {o.name || "—"}{o.contact ? " · " + o.contact : ""}</p>
                </div>
                <span className="font-extrabold text-slate-900">{formatINR(o.total)}</span>
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

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${statusChip[o.status] || "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[o.status] || o.status}</span>
                <select value={o.status} disabled={ordersBusy} onChange={(e) => updateOrderStatus(o.key, e.target.value)} className="border border-slate-200 rounded-lg py-2 px-2.5 text-sm outline-hidden bg-white disabled:opacity-60">
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
