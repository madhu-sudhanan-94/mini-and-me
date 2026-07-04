import React from "react";
import { ChevronLeft, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { formatINR } from "../lib/format.js";
import ProductImage from "../components/ProductImage.jsx";
import { useStore } from "../store.jsx";

export default function Cart() {
  const { cart, products, cartTotal, setScreen, removeItem, changeQty } = useStore();
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("home")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">My cart</h2>
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-4"><ShoppingCart size={32} className="text-brand-500" /></div>
          <p className="font-bold text-slate-800 text-lg">Your cart is empty</p>
          <p className="text-slate-400 text-sm mt-1">Find something you'll love.</p>
          <button onClick={() => setScreen("home")} className="mt-5 bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl">Start shopping</button>
        </div>
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
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Total</span>
              <span className="text-2xl font-extrabold text-slate-900">{formatINR(cartTotal)}</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Inclusive of all taxes</p>
            <button onClick={() => setScreen("checkout")} className="w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/30">Check out</button>
          </div>
        </>
      )}
    </div>
  );
}
