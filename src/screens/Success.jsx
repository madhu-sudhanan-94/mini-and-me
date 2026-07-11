import React from "react";
import { Check, Download } from "lucide-react";
import { formatINR } from "../lib/format.js";
import { SUPPORT } from "../content/legal.js";
import { printInvoice } from "../lib/invoice.js";
import { useStore } from "../store.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import Confetti from "../components/Confetti.jsx";

export default function Success() {
  const { lastOrder, setScreen } = useStore();
  return (
    <div className="relative flex flex-col min-h-full overflow-hidden">
      <Confetti />
      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-8 pt-[60px] pb-10">
        {/* Animated tick with a pulsing halo */}
        <div className="relative mb-6">
          <span className="sc-pulse absolute inset-0 rounded-full bg-brand-400/40" />
          <div className="sc-pop relative w-24 h-24 rounded-full bg-linear-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Check size={44} className="text-white" strokeWidth={3} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">Order placed! 🎉</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-xs">
          Thanks{lastOrder ? ", " + lastOrder.name : ""}. We'll send updates to <span className="font-semibold text-slate-700">{lastOrder?.contact}</span>.
        </p>

        {/* Order card */}
        <div className="bg-white rounded-2xl shadow-card p-4 mt-6 w-full max-w-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Order ID</span>
            <span className="font-bold text-slate-800">{lastOrder?.id}</span>
          </div>
          {lastOrder?.total != null && (
            <div className="flex justify-between items-center border-t border-slate-100 mt-3 pt-3">
              <span className="text-xs text-slate-400">Amount paid</span>
              <span className="font-bold text-slate-800">{formatINR(lastOrder.total)}</span>
            </div>
          )}
          {lastOrder?.saved > 0 && (
            <p className="mt-3 text-xs font-semibold text-green-600 bg-green-50 rounded-lg py-1.5">You saved {formatINR(lastOrder.saved)} on this order 🎉</p>
          )}
        </div>

        {/* Tax invoice */}
        {lastOrder?.items?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-4 mt-4 w-full max-w-xs text-left">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm font-bold text-slate-800">Tax invoice</p>
              <button onClick={() => printInvoice(lastOrder)} className="text-xs font-semibold text-brand-600 flex items-center gap-1 active:scale-95 transition"><Download size={13} /> Download</button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500"><span>Taxable value</span><span>{formatINR(lastOrder.subtotal)}</span></div>
              <div className="flex justify-between text-slate-500"><span>GST ({lastOrder.ratePct}%)</span><span>{formatINR(lastOrder.gst)}</span></div>
              {lastOrder.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatINR(lastOrder.discount)}</span></div>}
              <div className="flex justify-between text-slate-500"><span>Delivery</span><span>{lastOrder.delivery_fee ? formatINR(lastOrder.delivery_fee) : "Free"}</span></div>
              <div className="flex justify-between pt-1.5 mt-1.5 border-t border-slate-100 font-bold text-slate-800"><span>Total</span><span>{formatINR(lastOrder.total)}</span></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">{SUPPORT.gstin ? `GSTIN ${SUPPORT.gstin} · ` : ""}Prices inclusive of GST.</p>
          </div>
        )}

        {/* Actions */}
        <div className="w-full max-w-xs mt-6 space-y-4">
          <PrimaryButton onClick={() => setScreen("home")}>Continue shopping</PrimaryButton>
          <button onClick={() => setScreen("orders")} className="w-full text-base font-semibold text-slate-500 py-1.5 active:scale-95 transition"> View my orders</button>
        </div>
      </div>
    </div>
  );
}
