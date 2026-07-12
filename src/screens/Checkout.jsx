import React, { useState } from "react";
import { ChevronDown, User, MapPin, Truck, Minus, Plus, Trash2, Gift, Check, CreditCard, Banknote } from "lucide-react";
import ScreenHeader from "../components/ScreenHeader.jsx";
import { formatINR, isEmail } from "../lib/format.js";
import { SHOP, COUPONS_ENABLED } from "../shop.config.js";
import { PAYMENTS } from "../payments.config.js";
import PhoneField from "../components/PhoneField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import CouponBox from "../components/CouponBox.jsx";
import ProductImage from "../components/ProductImage.jsx";
import { useStore } from "../store.jsx";

export default function Checkout() {
  const {
    coName, setCoName, coPhone, setCoPhone, coEmail, setCoEmail, coNote, setCoNote,
    auth, goToLogin, placeOrder, placingOrder, setScreen, defaultAddress, addresses, session, coupon,
    products, buyNowItem, setBuyNowItem, checkoutItems, checkoutCount, checkoutBill,
    changeQty, removeItem, changeBuyNowQty, giftWrap, setGiftWrap, paymentMethod, setPaymentMethod,
  } = useStore();
  const payOnline = paymentMethod === "online" && PAYMENTS.onlineEnabled;
  const codBlocked = paymentMethod === "cod" && !PAYMENTS.codAvailable;
  // Buy-now shows the single item; from the cart the order is collapsed by default.
  const [itemsOpen, setItemsOpen] = useState(!!buyNowItem);
  const emailInvalid = coEmail.trim() && !isEmail(coEmail);
  const hasContact = coPhone.trim() || (coEmail.trim() && isEmail(coEmail));
  const fmtAddr = (a) => (a ? [a.line1, a.line2, a.area, a.city, a.state, a.pincode].filter(Boolean).join(", ") : "");

  const AddressCard = ({ a }) => (
    <div className="border border-slate-200 bg-white rounded-xl p-3 flex gap-3">
      <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0"><MapPin size={17} className="text-brand-600" /></div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{a.label}{a.full_name ? " · " + a.full_name : ""}</p>
        <p className="text-xs text-slate-500">{fmtAddr(a)}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Checkout" back="cart" />

      <div className="flex-1 px-5 lg:px-6 pt-5 space-y-5">
        {/* Items in this order — collapsed by default when arriving from the cart */}
        <section>
          {buyNowItem ? (
            <p className="text-sm font-semibold text-slate-800 mb-2">Your item</p>
          ) : (
            <button type="button" onClick={() => setItemsOpen((v) => !v)} aria-expanded={itemsOpen} className="w-full flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Your order <span className="font-normal text-slate-400">({checkoutCount} item{checkoutCount !== 1 ? "s" : ""})</span></span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${itemsOpen ? "rotate-180" : ""}`} />
            </button>
          )}
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${(buyNowItem || itemsOpen) ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden min-h-0 -mx-3 px-3">
              <div className="space-y-3 pt-3 pb-3">
            {checkoutItems.map((item, idx) => {
              const p = products.find((x) => x.id === item.id);
              if (!p) return null;
              const onSale = p.original && p.original > p.price;
              const dec = () => (buyNowItem ? changeBuyNowQty(-1) : changeQty(idx, -1));
              const inc = () => (buyNowItem ? changeBuyNowQty(1) : changeQty(idx, 1));
              const del = () => { if (buyNowItem) { setBuyNowItem(null); setScreen("home"); } else removeItem(idx); };
              return (
                <div key={idx} className="bg-white rounded-xl p-3 shadow-card flex gap-3">
                  <div className="relative w-20 h-[84px] rounded-lg bg-linear-to-br from-accent-50 to-brand-100 overflow-hidden shrink-0">
                    <ProductImage p={p} color={item.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-slate-800 text-[15px] truncate pr-2">{p.name}</p>
                      <button onClick={del} aria-label="Remove item" className="text-slate-400 hover:text-red-500 shrink-0 active:scale-90 transition"><Trash2 size={17} /></button>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Size {item.size}
                      {onSale && <span className="ml-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">SAVE {formatINR((p.original - p.price) * item.qty)}</span>}
                    </p>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center bg-slate-100 rounded-full">
                        <button onClick={dec} aria-label="Decrease quantity" className="w-7 h-7 flex items-center justify-center active:scale-90 transition"><Minus size={14} /></button>
                        <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={inc} aria-label="Increase quantity" className="w-7 h-7 flex items-center justify-center active:scale-90 transition"><Plus size={14} /></button>
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
            </div>
          </div>
        </section>

        {/* Gift wrapping */}
        <section>
          <button type="button" onClick={() => setGiftWrap((v) => !v)} aria-pressed={giftWrap} className={`-mt-1 w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${giftWrap ? "border-brand-300 bg-white" : "border-slate-200 bg-white"}`}>
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${giftWrap ? "bg-brand-50 text-brand-500" : "bg-slate-100 text-slate-500"}`}><Gift size={18} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-slate-800">Add gift wrapping</span>
              <span className="block text-xs text-slate-400">Premium wrap for {formatINR(SHOP.giftWrapFee)}</span>
            </span>
            <span className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${giftWrap ? "bg-brand-600 border-brand-600" : "border-slate-300 bg-white"}`}>{giftWrap && <Check size={13} className="text-white" />}</span>
          </button>
        </section>

        {/* Delivery address */}
        {session && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-800">Delivery address</p>
              <button onClick={() => setScreen("addresses")} className="text-xs font-semibold text-brand-600">{defaultAddress ? "Change" : "Add"}</button>
            </div>
            {defaultAddress ? <AddressCard a={defaultAddress} /> : (
              <button onClick={() => setScreen("addresses")} className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left active:scale-[0.98] transition">
                <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><MapPin size={18} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">Add a delivery address</span>
                  <span className="block text-xs text-slate-400">Tell us where to deliver your order</span>
                </span>
                <span className="w-8 h-8 rounded-full bg-white ring-1 ring-slate-200 text-brand-600 flex items-center justify-center shrink-0 shadow-xs"><Plus size={16} /></span>
              </button>
            )}
          </section>
        )}

        {/* Coupon */}
        {COUPONS_ENABLED && (
          <section>
            <p className="text-sm font-semibold text-slate-800 mb-2">Have a coupon?</p>
            <CouponBox bill={checkoutBill} />
          </section>
        )}

        {/* Order summary */}
        <section className="bg-linear-to-br from-brand-50 to-accent-50 border border-brand-100 rounded-xl p-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatINR(checkoutBill.subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>GST ({checkoutBill.ratePct}%, incl.)</span><span>{formatINR(checkoutBill.gst)}</span></div>
            {checkoutBill.discount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Coupon ({coupon?.code})</span><span>−{formatINR(checkoutBill.discount)}</span></div>}
            <div className="flex justify-between text-slate-600"><span>Delivery</span>{checkoutBill.deliveryFee ? <span>{formatINR(checkoutBill.deliveryFee)}</span> : <span className="text-green-600 font-medium">Free</span>}</div>
            {checkoutBill.giftWrapFee > 0 && <div className="flex justify-between text-slate-600"><span>Gift wrapping</span><span>{formatINR(checkoutBill.giftWrapFee)}</span></div>}
          </div>
          {!checkoutBill.qualifiesFree && checkoutBill.itemsTotal > 0 && (
            <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-2.5 flex items-center gap-1.5"><Truck size={13} /> Add {formatINR(checkoutBill.toFreeDelivery)} more for FREE delivery</p>
          )}
          <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-brand-100">
            <span className="font-semibold text-slate-800">{checkoutCount} item{checkoutCount !== 1 ? "s" : ""} · to pay</span>
            <span className="text-xl font-bold text-slate-900">{formatINR(checkoutBill.total)}</span>
          </div>
          {checkoutBill.totalSaved > 0 && <p className="text-right text-xs font-semibold text-green-600 mt-1">You saved {formatINR(checkoutBill.totalSaved)} 🎉</p>}
        </section>

        {/* Payment method */}
        {(PAYMENTS.onlineEnabled || PAYMENTS.codEnabled) && (
          <section>
            <p className="text-sm font-semibold text-slate-800 mb-2">Payment method</p>
            <div className="space-y-2">
              {PAYMENTS.onlineEnabled && (
                <button type="button" onClick={() => setPaymentMethod("online")} aria-pressed={paymentMethod === "online"} className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${paymentMethod === "online" ? "border-brand-400 bg-brand-50/50" : "border-slate-200 bg-white"}`}>
                  <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><CreditCard size={18} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-800">Pay online</span>
                    <span className="block text-xs text-slate-400">UPI, cards, netbanking &amp; wallets</span>
                  </span>
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${paymentMethod === "online" ? "border-brand-600" : "border-slate-300"}`}>{paymentMethod === "online" && <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />}</span>
                </button>
              )}
              {PAYMENTS.codEnabled && (
                <button type="button" onClick={() => setPaymentMethod("cod")} aria-pressed={paymentMethod === "cod"} className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${paymentMethod === "cod" ? "border-brand-400 bg-brand-50/50" : "border-slate-200 bg-white"}`}>
                  <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Banknote size={18} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-800">Cash on delivery</span>
                    <span className="block text-xs text-slate-400">Pay in cash when your order arrives</span>
                  </span>
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${paymentMethod === "cod" ? "border-brand-600" : "border-slate-300"}`}>{paymentMethod === "cod" && <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />}</span>
                </button>
              )}
            </div>
            {codBlocked && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-2">Cash on delivery isn't available for this order yet — please pay online to place your order.</p>
            )}
          </section>
        )}

        {/* Contact */}
        <section>
          <p className="text-sm font-semibold text-slate-800 mb-3">Where should we send your order updates?</p>
          <label className="block text-xs text-slate-500 mb-1">Full name</label>
          <input value={coName} onChange={(e) => setCoName(e.target.value)} placeholder="Your name" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 mb-4" />

          <label className="block text-xs text-slate-500 mb-1">Phone number</label>
          <div className="mb-4"><PhoneField value={coPhone} onChange={setCoPhone} /></div>

          <div className="flex items-center gap-3 my-1 text-slate-300 text-xs"><div className="flex-1 h-px bg-slate-200" />or<div className="flex-1 h-px bg-slate-200" /></div>

          <label className="block text-xs text-slate-500 mb-1 mt-2">Email</label>
          <input value={coEmail} onChange={(e) => setCoEmail(e.target.value)} type="email" placeholder="you@email.com" className={`w-full border rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${emailInvalid ? "border-red-300" : "border-slate-200"}`} />
          {emailInvalid
            ? <p className="text-red-500 text-[11px] mt-1">Enter a valid email address.</p>
            : <p className="text-[11px] text-slate-400 mt-2">Add at least one — a phone number or an email.</p>}
        </section>

        {/* Order note */}
        <section>
          <p className="text-sm font-semibold text-slate-800 mb-1">Order note <span className="font-normal text-slate-400">(optional)</span></p>
          <p className="text-[11px] text-slate-400 mb-2">Delivery instructions, a gift message, or anything else we should know.</p>
          <textarea value={coNote} onChange={(e) => setCoNote(e.target.value)} rows={3} maxLength={500} placeholder="e.g. Leave at the front desk, or call on arrival" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 resize-none" />
        </section>
      </div>

      <div className="sticky bottom-0 z-20 p-5 border-t border-slate-100 bg-white/95 backdrop-blur lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
        {auth.role === "guest" ? (
          <>
            <PrimaryButton onClick={() => goToLogin("checkout")} size="xl"><User size={18} /> Log in to place order</PrimaryButton>
            <p className="text-[11px] text-slate-400 text-center mt-2">Please log in or create an account to complete your order.</p>
          </>
        ) : (
          <PrimaryButton onClick={placeOrder} disabled={!coName.trim() || !hasContact || placingOrder || checkoutCount === 0 || codBlocked} size="xl">
            {codBlocked
              ? "Cash on delivery unavailable"
              : placingOrder
              ? (payOnline ? "Starting payment…" : "Placing your order…")
              : `${payOnline ? "Pay" : "Place order ·"} ${formatINR(checkoutBill.total)}`}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
