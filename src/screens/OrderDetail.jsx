import React from "react";
import { MapPin, Package, ShoppingCart } from "lucide-react";
import ScreenHeader from "../components/ScreenHeader.jsx";
import { formatINR } from "../lib/format.js";
import { fmtDate, shipLines } from "../lib/orders.js";
import { outOfStock } from "../lib/catalog.js";
import { SHOP } from "../shop.config.js";
import { StatusPill, StepTracker } from "./Orders.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useStore } from "../store.jsx";

/*
  OrderDetail — the full view of a single order, opened by tapping an order in
  the Orders list. Shows the status tracker, every line item (with thumbnails),
  the delivery address and a payment summary.
*/
export default function OrderDetail() {
  const { selectedOrder: o, products, setScreen, openProduct, addToCart, showToast } = useStore();

  if (!o) {
    return (
      <div className="pb-6">
        <ScreenHeader title="Order details" back="orders" />
        <EmptyState icon={Package} title="Order not found" subtitle="This order is no longer available." className="min-h-[55vh]">
          <PrimaryButton variant="solid" full={false} onClick={() => setScreen("orders")} className="px-6">Back to orders</PrimaryButton>
        </EmptyState>
      </div>
    );
  }

  const count = o.items.length;
  const subtotal = o.items.reduce((s, it) => s + (it.unit_price || 0) * (it.qty || 1), 0);
  // Reorder: re-add every still-available line item to the cart.
  const anyAvailable = o.items.some((it) => { const p = products.find((x) => x.id === it.product_id); return p && !outOfStock(p); });
  const reorder = () => {
    let added = 0, skipped = 0;
    o.items.forEach((it) => {
      const p = products.find((x) => x.id === it.product_id);
      if (p && !outOfStock(p)) { addToCart(p, it.size, it.color, it.qty || 1); added += 1; }
      else skipped += 1;
    });
    if (added) { showToast(skipped ? `${added} added · ${skipped} unavailable` : "Added to cart"); setScreen("cart"); }
    else showToast("These items are no longer available");
  };

  // Prefer the persisted breakdown (orders placed after the 2026-07 migration —
  // itemsTotal > 0 signals it's stored). Older orders saved only the grand total,
  // so reconstruct their fees from the fixed shop rates.
  const hasBreakdown = (o.itemsTotal || 0) > 0;
  let deliveryFee, giftWrap, discount, otherCharges = 0;
  if (hasBreakdown) {
    deliveryFee = o.deliveryFee || 0;
    giftWrap = o.giftWrapFee || 0;
    discount = o.discount || 0;
  } else {
    let rem = (o.total || 0) - subtotal;
    deliveryFee = subtotal > 0 && subtotal < SHOP.freeDeliveryThreshold && rem >= SHOP.deliveryFee ? SHOP.deliveryFee : 0;
    rem -= deliveryFee;
    giftWrap = rem >= SHOP.giftWrapFee ? SHOP.giftWrapFee : 0;
    rem -= giftWrap;
    discount = rem < 0 ? -rem : 0;
    otherCharges = rem > 0 ? rem : 0;
  }

  return (
    <div className="pb-10">
      <ScreenHeader title="Order details" back="orders" />

      <div className="px-5 mt-4 space-y-4">
        {/* Status + tracker */}
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-800">#{o.ref}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fmtDate(o.date)} · {count} item{count !== 1 ? "s" : ""}</p>
            </div>
            <StatusPill status={o.status} />
          </div>
          <StepTracker status={o.status} />
        </div>

        {/* Items */}
        {count > 0 && (
          <div className="bg-white rounded-xl shadow-card p-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">Items</p>
            <div className="space-y-3">
              {o.items.map((it, i) => {
                const prod = products.find((p) => p.id === it.product_id);
                const soldOut = !prod || outOfStock(prod);
                const src = prod?.images?.[0];
                return (
                  <button key={i} onClick={() => prod && openProduct(prod)} disabled={!prod} className="w-full flex items-center gap-3 text-left disabled:cursor-default active:scale-[0.99] transition">
                    <div className={`w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center ${soldOut ? "grayscale opacity-60" : ""}`}>
                      {src ? <img src={src} alt={it.product_name} className="w-full h-full object-cover" loading="lazy" /> : <Package size={16} className="text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{it.product_name}</p>
                      <p className="text-xs text-slate-400">
                        {it.size ? `Size ${it.size} · ` : ""}Qty {it.qty || 1}
                        {soldOut && <span className="ml-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Out of stock</span>}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-800 shrink-0">{formatINR((it.unit_price || 0) * (it.qty || 1))}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery address */}
        {o.shipping && (
          <div className="bg-white rounded-xl shadow-card p-4">
            <p className="text-sm font-semibold text-slate-800 mb-2">Delivery address</p>
            <div className="flex gap-2">
              <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-500 leading-relaxed">{[o.shipping.full_name, shipLines(o.shipping)].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
        )}

        {/* Order note (delivery instructions / gift message) */}
        {o.note && (
          <div className="bg-white rounded-xl shadow-card p-4">
            <p className="text-sm font-semibold text-slate-800 mb-1">Order note</p>
            <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">{o.note}</p>
          </div>
        )}

        {/* Payment summary */}
        <div className="bg-white rounded-xl shadow-card p-4">
          <p className="text-sm font-semibold text-slate-800 mb-3">Payment summary</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
            {subtotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                {deliveryFee > 0 ? <span>{formatINR(deliveryFee)}</span> : <span className="font-semibold text-emerald-600">Free</span>}
              </div>
            )}
            {giftWrap > 0 && <div className="flex justify-between text-slate-600"><span>Gift wrapping</span><span>{formatINR(giftWrap)}</span></div>}
            {otherCharges > 0 && <div className="flex justify-between text-slate-600"><span>Other charges</span><span>{formatINR(otherCharges)}</span></div>}
            {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount{o.couponCode ? ` (${o.couponCode})` : ""}</span><span>− {formatINR(discount)}</span></div>}
            <div className="flex justify-between pt-2 mt-1 border-t border-slate-100 text-slate-900 font-bold text-base">
              <span>Total</span><span>{formatINR(o.total)}</span>
            </div>
          </div>
        </div>

        {/* Reorder — re-adds the still-available items to the cart */}
        <PrimaryButton variant="solid" onClick={reorder} disabled={!anyAvailable} className="mt-1">
          <ShoppingCart size={18} /> Reorder
        </PrimaryButton>
      </div>
    </div>
  );
}
