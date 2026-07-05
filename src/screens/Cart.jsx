import React from "react";
import { ChevronLeft, ShoppingCart, Trash2, Minus, Plus, Truck } from "lucide-react";
import { formatINR } from "../lib/format.js";
import ProductImage from "../components/ProductImage.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import CouponBox from "../components/CouponBox.jsx";
import { useStore } from "../store.jsx";

export default function Cart() {
  const { cart, products, setScreen, removeItem, changeQty, bill, coupon } = useStore();

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-[18px] flex items-center gap-3">
        <button onClick={() => setScreen("home")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-semibold text-slate-900">My cart</h2>
      </div>

      {cart.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Your cart is empty" subtitle="Find something you'll love." className="flex-1 min-h-[68vh]">
          <PrimaryButton variant="solid" full={false} onClick={() => setScreen("home")} className="px-6">Start shopping</PrimaryButton>
        </EmptyState>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto lg:overflow-visible px-5 mt-3 space-y-3">
            {cart.map((item, idx) => {
              const p = products.find((x) => x.id === item.id);
              if (!p) return null;
              const onSale = p.original && p.original > p.price;
              return (
                <div key={idx} className="bg-white rounded-2xl p-3 shadow-xs flex gap-3">
                  <div className="relative w-20 h-20 rounded-xl bg-linear-to-br from-accent-50 to-brand-100 overflow-hidden shrink-0">
                    <ProductImage p={p} color={item.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-slate-800 text-[15px] truncate pr-2">{p.name}</p>
                      <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 size={17} /></button>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Size {item.size}
                      {onSale && <span className="ml-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">SAVE {formatINR((p.original - p.price) * item.qty)}</span>}
                    </p>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center bg-slate-100 rounded-full">
                        <button onClick={() => changeQty(idx, -1)} className="w-7 h-7 flex items-center justify-center"><Minus size={14} /></button>
                        <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => changeQty(idx, 1)} className="w-7 h-7 flex items-center justify-center"><Plus size={14} /></button>
                      </div>
                      <div className="flex flex-col items-end leading-tight">
                        <span className="font-bold text-slate-900">{formatINR(p.price * item.qty)}</span>
                        {onSale && <span className="text-[11px] text-slate-400 line-through">{formatINR(p.original * item.qty)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-4 mt-2 bg-white lg:bg-transparent border-t border-slate-100 lg:border-0">
            {/* Free-delivery nudge */}
            {!bill.qualifiesFree && bill.itemsTotal > 0 && (
              <div className="mb-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5"><Truck size={14} /> Add {formatINR(bill.toFreeDelivery)} more for FREE delivery!</p>
                <div className="mt-2 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min(100, (bill.itemsTotal / bill.freeThreshold) * 100)}%` }} />
                </div>
              </div>
            )}

            {/* Coupon */}
            <div className="mb-3"><CouponBox /></div>

            {/* Bill */}
            <div className="space-y-1 mb-3 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatINR(bill.subtotal)}</span></div>
              <div className="flex justify-between text-slate-500"><span>GST ({bill.ratePct}%, incl.)</span><span>{formatINR(bill.gst)}</span></div>
              {bill.discount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Coupon ({coupon?.code})</span><span>−{formatINR(bill.discount)}</span></div>}
              <div className="flex justify-between text-slate-500">
                <span>Delivery</span>
                {bill.deliveryFee ? <span className="text-slate-700">{formatINR(bill.deliveryFee)}</span> : <span className="text-green-600 font-medium">Free</span>}
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                <span className="font-semibold text-slate-800">Total</span>
                <span className="text-2xl font-extrabold text-slate-900">{formatINR(bill.total)}</span>
              </div>
              {bill.totalSaved > 0 && <p className="text-right text-xs font-semibold text-green-600">You saved {formatINR(bill.totalSaved)} 🎉</p>}
            </div>

            <PrimaryButton size="xl" onClick={() => setScreen("checkout")}>Check out</PrimaryButton>
            <button onClick={() => setScreen("home")} className="w-full mt-2.5 text-sm font-semibold text-slate-500 py-1.5 active:scale-95 transition">Continue shopping</button>
          </div>
        </>
      )}
    </div>
  );
}
