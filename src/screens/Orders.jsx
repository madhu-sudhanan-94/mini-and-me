import React, { useEffect } from "react";
import { ChevronLeft, Package, Truck, CheckCircle2, MapPin, Clock } from "lucide-react";
import { formatINR } from "../lib/format.js";
import { ORDER_STEPS, STATUS_LABEL, fmtDate, normalizeOrder, shipLines, mergeOrders } from "../lib/orders.js";
import { useStore } from "../store.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import EmptyState from "../components/EmptyState.jsx";

/*
  Orders — "visual receipt" cards. Each order reads like a shoppy receipt:
  a colour-coded status pill, a row of real product thumbnails, an icon-based
  Package→Truck→Delivered tracker with a slim progress bar, and an emphasised
  total footer. Entrance + progress-bar fill animate (reduced-motion safe).
*/

// Colour-coded status pill: placed=brand, confirmed=violet, shipped=amber,
// delivered=emerald, cancelled=rose. Icon reinforces the stage.
const STATUS_STYLE = {
  placed: { pill: "bg-brand-50 text-brand-600", dot: "bg-brand-500", Icon: Clock },
  confirmed: { pill: "bg-violet-100 text-violet-600", dot: "bg-violet-500", Icon: CheckCircle2 },
  shipped: { pill: "bg-amber-100 text-amber-600", dot: "bg-amber-500", Icon: Truck },
  delivered: { pill: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-500", Icon: CheckCircle2 },
  cancelled: { pill: "bg-rose-100 text-rose-600", dot: "bg-rose-500", Icon: Clock },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.placed;
  const { Icon } = s;
  return (
    <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full text-xs font-semibold ${s.pill}`}>
      <Icon size={13} strokeWidth={2.5} />
      {STATUS_LABEL[status] || STATUS_LABEL.placed}
    </span>
  );
}

// Icon-based step tracker: Package → Truck → Delivered, joined by a slim
// progress bar that fills to the current stage's %. Cancelled shows a
// muted, greyed-out rail with a rose note.
const TRACK_STEPS = [
  { key: "confirmed", label: "Confirmed", Icon: Package },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: CheckCircle2 },
];

function StepTracker({ status }) {
  const cancelled = status === "cancelled";
  const idx = ORDER_STEPS.indexOf(status); // 0..3 over placed/confirmed/shipped/delivered
  // Progress across the 3 visible milestones (confirmed→delivered).
  const reached = TRACK_STEPS.map((t) => ORDER_STEPS.indexOf(t.key) <= idx);
  const doneCount = cancelled ? 0 : reached.filter(Boolean).length;
  const progress = Math.max(0, doneCount - 1) / (TRACK_STEPS.length - 1); // 0, .5, 1

  return (
    <div className="mt-4">
      <div className="relative flex items-center justify-between">
        {/* rail */}
        <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-slate-100" />
        {!cancelled && (
          <div
            className="ord-fill absolute left-4 top-4 h-1 rounded-full bg-linear-to-r from-brand-500 to-accent-500"
            style={{ width: "calc(100% - 2rem)", "--ord-progress": progress }}
          />
        )}
        {TRACK_STEPS.map((t, i) => {
          const active = !cancelled && reached[i];
          const { Icon } = t;
          return (
            <div key={t.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  active ? "bg-brand-600 text-white shadow-xs shadow-brand-500/30" : "bg-white text-slate-300 ring-1 ring-slate-200"
                }`}
              >
                <Icon size={15} strokeWidth={2.4} />
              </div>
              <span className={`mt-1.5 text-[10px] font-medium ${active ? "text-slate-700" : "text-slate-400"}`}>{t.label}</span>
            </div>
          );
        })}
      </div>
      {cancelled && <p className="mt-2.5 text-xs font-semibold text-rose-500">This order was cancelled.</p>}
    </div>
  );
}

// Overlapping product thumbnails (like a "visual receipt"), looked up from
// products by product_id. Falls back to a Package tile when no image; an extra
// "+N" chip absorbs overflow beyond 4 thumbnails.
function ThumbRow({ items, products }) {
  const imgOf = (it) => products.find((p) => p.id === it.product_id)?.images?.[0];
  const shown = items.slice(0, 4);
  const extra = items.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((it, i) => {
          const src = imgOf(it);
          return (
            <div
              key={i}
              className="w-11 h-11 rounded-xl ring-2 ring-white bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center"
              style={{ zIndex: shown.length - i }}
            >
              {src ? (
                <img src={src} alt={it.product_name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <Package size={16} className="text-slate-400" />
              )}
            </div>
          );
        })}
        {extra > 0 && (
          <div className="w-11 h-11 rounded-xl ring-2 ring-white bg-brand-50 text-brand-600 text-xs font-bold shrink-0 flex items-center justify-center">
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Orders() {
  const { myOrders, orders, session, setScreen, goBack, loadMyOrders, products } = useStore();
  useEffect(() => { if (session) loadMyOrders(); }, [session]);

  // Signed-in users: DB history plus any local order not yet synced (deduped by ref).
  const list = (session ? mergeOrders(myOrders, orders) : orders).map(normalizeOrder);

  return (
    <div className="pb-6">
      <div className="px-5 pt-[18px] flex items-center gap-3">
        <button onClick={() => goBack("account")} aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-semibold text-slate-900">My orders</h2>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" subtitle="Your placed orders will show up here." className="min-h-[55vh]">
          <PrimaryButton variant="solid" full={false} onClick={() => setScreen("home")} className="px-6">Start shopping</PrimaryButton>
        </EmptyState>
      ) : (
        <div className="px-5 mt-4 space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {list.map((o, oi) => {
            const count = o.items.length;
            return (
              <div
                key={o.key}
                className="ord-rise bg-white rounded-2xl shadow-xs p-4"
                style={{ animationDelay: `${Math.min(oi, 6) * 0.06}s` }}
              >
                {/* Header: ref + date on the left, status pill on the right */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">#{o.ref}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(o.date)} · {count} item{count !== 1 ? "s" : ""}</p>
                  </div>
                  <StatusPill status={o.status} />
                </div>

                {/* Visual receipt: thumbnails + a short item summary */}
                {count > 0 && (
                  <div className="mt-3.5 flex items-center gap-3">
                    <ThumbRow items={o.items} products={products} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{o.items[0].product_name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {o.items[0].size ? `Size ${o.items[0].size} · ` : ""}Qty {o.items[0].qty || 1}
                        {count > 1 ? ` · +${count - 1} more` : ""}
                      </p>
                    </div>
                  </div>
                )}

                <StepTracker status={o.status} />

                {/* Itemised lines */}
                {count > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    {o.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="truncate pr-2 text-slate-500">
                          {it.product_name}
                          <span className="text-slate-400">{it.size ? ` · ${it.size}` : ""} × {it.qty || 1}</span>
                        </span>
                        <span className="shrink-0 font-medium text-slate-600">{formatINR((it.unit_price || 0) * (it.qty || 1))}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shipping address */}
                {o.shipping && (
                  <div className="mt-3 flex gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">{[o.shipping.full_name, shipLines(o.shipping)].filter(Boolean).join(" · ")}</p>
                  </div>
                )}

                {/* Emphasised total footer */}
                <div className="mt-3.5 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                  <span className="text-xs font-medium text-slate-500">Order total</span>
                  <span className="text-lg font-extrabold text-slate-900 tracking-tight">{formatINR(o.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
