import React from "react";
import { ChevronLeft, User, MapPin, Truck, Check } from "lucide-react";
import { formatINR, isEmail } from "../lib/format.js";
import PhoneField from "../components/PhoneField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import CouponBox from "../components/CouponBox.jsx";
import { useStore } from "../store.jsx";

export default function Checkout() {
  const {
    cartCount, coName, setCoName, coPhone, setCoPhone, coEmail, setCoEmail,
    auth, goToLogin, placeOrder, setScreen, goBack, defaultAddress, addresses, session, bill, coupon,
    billingSame, setBillingSame, billingAddrId, setBillingAddrId, billingAddress,
  } = useStore();
  const emailInvalid = coEmail.trim() && !isEmail(coEmail);
  const hasContact = coPhone.trim() || (coEmail.trim() && isEmail(coEmail));
  const fmtAddr = (a) => (a ? [a.line1, a.line2, a.area, a.city, a.state, a.pincode].filter(Boolean).join(", ") : "");

  const AddressCard = ({ a }) => (
    <div className="border border-slate-200 rounded-2xl p-3 flex gap-3">
      <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0"><MapPin size={17} className="text-brand-600" /></div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{a.label}{a.full_name ? " · " + a.full_name : ""}</p>
        <p className="text-xs text-slate-500">{fmtAddr(a)}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-[18px] flex items-center gap-3">
        <button onClick={() => goBack("cart")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-semibold text-slate-900">Checkout</h2>
      </div>

      <div className="flex-1 px-5 lg:px-6 pt-5 space-y-5">
        {/* Delivery address */}
        {session && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-800">Delivery address</p>
              <button onClick={() => setScreen("addresses")} className="text-xs font-semibold text-brand-600">{defaultAddress ? "Change" : "Add"}</button>
            </div>
            {defaultAddress ? <AddressCard a={defaultAddress} /> : (
              <button onClick={() => setScreen("addresses")} className="w-full border border-dashed border-brand-300 text-brand-600 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm"><MapPin size={16} /> Add a delivery address</button>
            )}
          </section>
        )}

        {/* Billing address */}
        {/* {session && defaultAddress && (
          <section>
            <p className="text-sm font-semibold text-slate-800 mb-2">Billing address</p>
            <button onClick={() => setBillingSame((v) => !v)} className="flex items-center gap-2 mb-2">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${billingSame ? "bg-brand-600 border-brand-600" : "border-slate-300 bg-white"}`}>{billingSame && <Check size={13} className="text-white" />}</span>
              <span className="text-sm text-slate-600">Same as delivery address</span>
            </button>
            {!billingSame && (
              addresses.length > 1 ? (
                <select value={billingAddrId || defaultAddress.id} onChange={(e) => setBillingAddrId(e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 pl-3 pr-9 outline-hidden text-sm focus:border-brand-500 bg-white select-chevron">
                  {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} · {fmtAddr(a)}</option>)}
                </select>
              ) : (
                <div>
                  {billingAddress && <AddressCard a={billingAddress} />}
                  <button onClick={() => setScreen("addresses")} className="text-xs font-semibold text-brand-600 mt-1.5">+ Add another address</button>
                </div>
              )
            )}
          </section>
        )} */}

        {/* Coupon */}
        <section>
          <p className="text-sm font-semibold text-slate-800 mb-2">Have a coupon?</p>
          <CouponBox />
        </section>

        {/* Order summary */}
        <section className="bg-linear-to-br from-brand-50 to-accent-50 border border-brand-100 rounded-2xl p-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatINR(bill.subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>GST ({bill.ratePct}%, incl.)</span><span>{formatINR(bill.gst)}</span></div>
            {bill.discount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Coupon ({coupon?.code})</span><span>−{formatINR(bill.discount)}</span></div>}
            <div className="flex justify-between text-slate-600"><span>Delivery</span>{bill.deliveryFee ? <span>{formatINR(bill.deliveryFee)}</span> : <span className="text-green-600 font-medium">Free</span>}</div>
          </div>
          {!bill.qualifiesFree && bill.itemsTotal > 0 && (
            <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-2.5 flex items-center gap-1.5"><Truck size={13} /> Add {formatINR(bill.toFreeDelivery)} more for FREE delivery</p>
          )}
          <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-brand-100">
            <span className="font-semibold text-slate-800">{cartCount} item{cartCount !== 1 ? "s" : ""} · to pay</span>
            <span className="text-xl font-extrabold text-slate-900">{formatINR(bill.total)}</span>
          </div>
          {bill.totalSaved > 0 && <p className="text-right text-xs font-semibold text-green-600 mt-1">You saved {formatINR(bill.totalSaved)} 🎉</p>}
        </section>

        {/* Contact */}
        <section>
          <p className="text-sm font-semibold text-slate-800 mb-3">Where should we send your order updates?</p>
          <label className="block text-xs text-slate-500 mb-1">Full name</label>
          <input value={coName} onChange={(e) => setCoName(e.target.value)} placeholder="Your name" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 mb-4" />

          <label className="block text-xs text-slate-500 mb-1">Phone number</label>
          <div className="mb-4"><PhoneField value={coPhone} onChange={setCoPhone} /></div>

          <div className="flex items-center gap-3 my-1 text-slate-300 text-xs"><div className="flex-1 h-px bg-slate-200" />or<div className="flex-1 h-px bg-slate-200" /></div>

          <label className="block text-xs text-slate-500 mb-1 mt-2">Email</label>
          <input value={coEmail} onChange={(e) => setCoEmail(e.target.value)} type="email" placeholder="you@email.com" className={`w-full border rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 ${emailInvalid ? "border-red-300" : "border-slate-200"}`} />
          {emailInvalid
            ? <p className="text-red-500 text-[11px] mt-1">Enter a valid email address.</p>
            : <p className="text-[11px] text-slate-400 mt-2">Add at least one — a phone number or an email.</p>}
        </section>
      </div>

      <div className="p-5 border-t border-slate-100 lg:border-0">
        {auth.role === "guest" ? (
          <>
            <PrimaryButton onClick={() => goToLogin("checkout")} size="xl"><User size={18} /> Log in to place order</PrimaryButton>
            <p className="text-[11px] text-slate-400 text-center mt-2">Please log in or create an account to complete your order.</p>
          </>
        ) : (
          <PrimaryButton onClick={placeOrder} disabled={!coName.trim() || !hasContact} size="xl">
            Place order · {formatINR(bill.total)}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
