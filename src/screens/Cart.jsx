import React from "react";
import { ShoppingCart, Trash2, Minus, Plus, Truck } from "lucide-react";
import ScreenHeader from "../components/ScreenHeader.jsx";
import { formatINR } from "../lib/format.js";
import ProductImage from "../components/ProductImage.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import CouponBox from "../components/CouponBox.jsx";
import { COUPONS_ENABLED } from "../shop.config.js";
import { stockFor, sizeOutOfStock, sizeLowStock, outOfStock } from "../lib/catalog.js";
import { useStore } from "../store.jsx";

export default function Cart() {
  const { cart, products, setScreen, removeItem, changeQty, bill, coupon, cartCount, openProduct } = useStore();

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="My cart" back="home" />

      {cart.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Your cart is empty" subtitle="Find something you'll love." className="flex-1 min-h-[55vh]">
          <PrimaryButton variant="solid" full={false} onClick={() => setScreen("home")} className="px-6">Start shopping</PrimaryButton>
        </EmptyState>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto lg:overflow-visible px-5 mt-3 space-y-3">
            {cart.map((item, idx) => {
              const p = products.find((x) => x.id === item.id);
              if (!p) return null;
              const onSale = p.original && p.original > p.price;
              const soldOut = outOfStock(p) || sizeOutOfStock(p, item.size);
              const avail = stockFor(p, item.size);
              const low = !soldOut && sizeLowStock(p, item.size);
              return (
                <div key={idx} className={`bg-white rounded-xl p-3 shadow-card flex gap-3 ${soldOut ? "ring-1 ring-rose-200" : ""}`}>
                  <button onClick={() => openProduct(p)} aria-label={`View ${p.name}`} className="relative w-20 h-[84px] rounded-lg bg-linear-to-br from-accent-50 to-brand-100 overflow-hidden shrink-0 active:scale-95 transition">
                    <ProductImage p={p} color={item.color} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <button onClick={() => openProduct(p)} className="font-semibold text-slate-800 text-[15px] truncate pr-2 text-left hover:text-brand-600 transition">{p.name}</button>
                      <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 size={17} /></button>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Size {item.size}
                      {onSale && <span className="ml-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">SAVE {formatINR((p.original - p.price) * item.qty)}</span>}
                    </p>
                    {soldOut
                      ? <p className="text-[11px] font-bold text-rose-600 mt-1">Out of stock — remove to check out</p>
                      : low && <p className="text-[11px] font-semibold text-amber-600 mt-1">Only {avail} left</p>}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center bg-slate-100 rounded-full">
                        <button onClick={() => changeQty(idx, -1)} className="w-7 h-7 flex items-center justify-center"><Minus size={14} /></button>
                        <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => changeQty(idx, 1)} className="w-7 h-7 flex items-center justify-center"><Plus size={14} /></button>
                      </div>
                      <div className="flex flex-col items-end leading-tight">
                        {onSale && <span className="text-[11px] text-slate-400 line-through">{formatINR(p.original * item.qty)}</span>}
                        <span className="font-bold text-slate-900">{formatINR(p.price * item.qty)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-4 bg-transparent">
            {/* Free-delivery nudge */}
            {!bill.qualifiesFree && bill.itemsTotal > 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5"><Truck size={14} /> Add {formatINR(bill.toFreeDelivery)} more for FREE delivery!</p>
                <div className="mt-2 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min(100, (bill.itemsTotal / bill.freeThreshold) * 100)}%` }} />
                </div>
              </div>
            )}

            {/* Coupon */}
            {COUPONS_ENABLED && (
              <>
                <p className="text-sm font-semibold text-slate-800 mb-2">Have a coupon?</p>
                <div className="mb-4"><CouponBox /></div>
              </>
            )}

            {/* Summary */}
            <div className="bg-linear-to-br from-brand-50 to-accent-50 border border-brand-100 rounded-xl p-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatINR(bill.subtotal)}</span></div>
                {bill.gst > 0 && <div className="flex justify-between text-slate-600"><span>GST ({bill.ratePct}%, incl.)</span><span>{formatINR(bill.gst)}</span></div>}
                {bill.discount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Coupon ({coupon?.code})</span><span>−{formatINR(bill.discount)}</span></div>}
                <div className="flex justify-between text-slate-600"><span>Delivery</span>{bill.deliveryFee ? <span>{formatINR(bill.deliveryFee)}</span> : <span className="text-green-600 font-medium">Free</span>}</div>
              </div>
              <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-brand-100">
                <span className="font-semibold text-slate-800">{cartCount} item{cartCount !== 1 ? "s" : ""} · to pay</span>
                <span className="text-xl font-bold text-slate-900">{formatINR(bill.total)}</span>
              </div>
              {bill.totalSaved > 0 && <p className="text-right text-xs font-semibold text-green-600 mt-1">You saved {formatINR(bill.totalSaved)} 🎉</p>}
            </div>

            <PrimaryButton size="xl" onClick={() => setScreen("checkout")} className="mt-4">Check out</PrimaryButton>
            <button onClick={() => setScreen("home")} className="w-full mt-4 text-sm font-semibold text-slate-500 py-1.5 active:scale-95 transition">Continue shopping</button>
          </div>
        </>
      )}
    </div>
  );
}
