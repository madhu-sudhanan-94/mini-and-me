import React from "react";
import { ChevronLeft, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { formatINR, gstBreakdown } from "../lib/format.js";
import ProductImage from "../components/ProductImage.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useStore } from "../store.jsx";

export default function Cart() {
  const { cart, products, cartTotal, setScreen, removeItem, changeQty } = useStore();
  const bill = gstBreakdown(cartTotal);
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("home")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">My cart</h2>
      </div>

      {cart.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Your cart is empty" subtitle="Find something you'll love." className="flex-1">
          <PrimaryButton variant="solid" full={false} onClick={() => setScreen("home")} className="px-6">Start shopping</PrimaryButton>
        </EmptyState>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto lg:overflow-visible px-5 mt-3 space-y-3">
            {cart.map((item, idx) => {
              const p = products.find((x) => x.id === item.id);
              if (!p) return null;
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
                    <p className="text-xs text-slate-400 mt-0.5">Size {item.size}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center bg-slate-100 rounded-full">
                        <button onClick={() => changeQty(idx, -1)} className="w-7 h-7 flex items-center justify-center"><Minus size={14} /></button>
                        <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => changeQty(idx, 1)} className="w-7 h-7 flex items-center justify-center"><Plus size={14} /></button>
                      </div>
                      <span className="font-bold text-slate-900">{formatINR(p.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-5 border-t border-slate-100 bg-white">
            <div className="space-y-1 mb-3 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatINR(bill.subtotal)}</span></div>
              <div className="flex justify-between text-slate-500"><span>GST ({bill.ratePct}%, incl.)</span><span>{formatINR(bill.gst)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Delivery</span><span className="text-green-600 font-medium">Free</span></div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                <span className="font-semibold text-slate-800">Total</span>
                <span className="text-2xl font-extrabold text-slate-900">{formatINR(bill.total)}</span>
              </div>
            </div>
            <PrimaryButton size="xl" onClick={() => setScreen("checkout")}>Check out</PrimaryButton>
          </div>
        </>
      )}
    </div>
  );
}
