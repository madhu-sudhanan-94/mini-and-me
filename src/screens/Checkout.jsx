import React from "react";
import { ChevronLeft, User, MapPin } from "lucide-react";
import { formatINR } from "../lib/format.js";
import { useStore } from "../store.jsx";

export default function Checkout() {
  const {
    cartCount, cartTotal, coName, setCoName, coPhone, setCoPhone,
    coEmail, setCoEmail, auth, goToLogin, placeOrder, setScreen, defaultAddress,
  } = useStore();

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("cart")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">Checkout</h2>
      </div>

      <div className="flex-1 px-6 pt-5">
        {auth.role !== "guest" && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-800">Deliver to</p>
              <button onClick={() => setScreen("addresses")} className="text-xs font-semibold text-brand-600">{defaultAddress ? "Change" : "Add"}</button>
            </div>
            {defaultAddress ? (
              <div className="border border-slate-200 rounded-2xl p-3 flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0"><MapPin size={17} className="text-brand-600" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{defaultAddress.label}{defaultAddress.full_name ? " · " + defaultAddress.full_name : ""}</p>
                  <p className="text-xs text-slate-500">{[defaultAddress.line1, defaultAddress.line2, defaultAddress.area, defaultAddress.city, defaultAddress.state, defaultAddress.pincode].filter(Boolean).join(", ")}</p>
                </div>
              </div>
            ) : (
              <button onClick={() => setScreen("addresses")} className="w-full border border-dashed border-brand-300 text-brand-600 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm"><MapPin size={16} /> Add a delivery address</button>
            )}
          </div>
        )}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex justify-between items-center mb-5">
          <span className="text-sm text-brand-700 font-medium">{cartCount} item{cartCount !== 1 ? "s" : ""} · to pay</span>
          <span className="font-extrabold text-brand-700 text-lg">{formatINR(cartTotal)}</span>
        </div>

        <p className="text-sm font-semibold text-slate-800 mb-3">Where should we send your order updates?</p>
        <label className="block text-xs text-slate-500 mb-1">Full name</label>
        <input value={coName} onChange={(e) => setCoName(e.target.value)} placeholder="Your name" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 mb-4" />

        <label className="block text-xs text-slate-500 mb-1">Phone number</label>
        <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-brand-500 mb-4">
          <span className="text-slate-500 text-sm pr-2 border-r border-slate-200">+91</span>
          <input value={coPhone} onChange={(e) => setCoPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="Mobile number" className="flex-1 py-3 px-3 outline-hidden text-sm" />
        </div>

        <div className="flex items-center gap-3 my-1 text-slate-300 text-xs"><div className="flex-1 h-px bg-slate-200" />or<div className="flex-1 h-px bg-slate-200" /></div>

        <label className="block text-xs text-slate-500 mb-1 mt-2">Email</label>
        <input value={coEmail} onChange={(e) => setCoEmail(e.target.value)} type="email" placeholder="you@email.com" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
        <p className="text-[11px] text-slate-400 mt-2">Add at least one — a phone number or an email.</p>
      </div>

      <div className="p-5 border-t border-slate-100">
        {auth.role === "guest" ? (
          <>
            <button onClick={() => goToLogin("checkout")} className="w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2">
              <User size={18} /> Log in to place order
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">Please log in or create an account to complete your order.</p>
          </>
        ) : (
          <button onClick={placeOrder} disabled={!coName.trim() || (!coPhone.trim() && !coEmail.trim())} className="w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/30 disabled:opacity-50">
            Place order · {formatINR(cartTotal)}
          </button>
        )}
      </div>
    </div>
  );
}
