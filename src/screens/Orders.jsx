import React, { useEffect } from "react";
import { ChevronLeft, Package, MapPin } from "lucide-react";
import { formatINR } from "../lib/format.js";
import { ORDER_STEPS, STATUS_LABEL, fmtDate, normalizeOrder, shipLines, mergeOrders } from "../lib/orders.js";
import { useStore } from "../store.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";

function StatusTracker({ status }) {
  if (status === "cancelled") return <p className="text-xs font-semibold text-red-500 mt-3">Order cancelled</p>;
  const idx = ORDER_STEPS.indexOf(status);
  return (
    <div className="flex items-center mt-3">
      {ORDER_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full ${i <= idx ? "bg-brand-600" : "bg-slate-200"}`} />
            <span className={`text-[9px] mt-1 ${i <= idx ? "text-brand-600 font-semibold" : "text-slate-400"}`}>{STATUS_LABEL[s]}</span>
          </div>
          {i < ORDER_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-3.5 ${i < idx ? "bg-brand-600" : "bg-slate-200"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Orders() {
  const { myOrders, orders, session, setScreen, loadMyOrders } = useStore();
  useEffect(() => { if (session) loadMyOrders(); }, [session]);

  // Signed-in users: DB history plus any local order not yet synced (deduped by ref).
  const list = (session ? mergeOrders(myOrders, orders) : orders).map(normalizeOrder);

  return (
    <div className="pb-6">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("account")} aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">My orders</h2>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-8 mt-20">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-4"><Package size={32} className="text-brand-500" /></div>
          <p className="font-bold text-slate-800 text-lg">No orders yet</p>
          <p className="text-slate-400 text-sm mt-1">Your placed orders will show up here.</p>
          <PrimaryButton variant="solid" full={false} onClick={() => setScreen("home")} className="mt-5 px-6">Start shopping</PrimaryButton>
        </div>
      ) : (
        <div className="px-5 mt-4 space-y-3">
          {list.map((o) => (
            <div key={o.key} className="bg-white rounded-2xl shadow-xs p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">#{o.ref}</p>
                  <p className="text-xs text-slate-400">{fmtDate(o.date)} · {o.items.length} item{o.items.length !== 1 ? "s" : ""}</p>
                </div>
                <span className="font-extrabold text-slate-900">{formatINR(o.total)}</span>
              </div>

              <StatusTracker status={o.status} />

              {o.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-500">
                      <span className="truncate pr-2">{it.product_name} · {it.size} × {it.qty}</span>
                      <span className="shrink-0">{formatINR((it.unit_price || 0) * (it.qty || 1))}</span>
                    </div>
                  ))}
                </div>
              )}

              {o.shipping && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500">{[o.shipping.full_name, shipLines(o.shipping)].filter(Boolean).join(" · ")}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
