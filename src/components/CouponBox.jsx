import React, { useState } from "react";
import { Tag } from "lucide-react";
import { formatINR } from "../lib/format.js";
import { useStore } from "../store.jsx";

/*
  CouponBox — the single coupon apply/remove control, used in both the cart
  and checkout. Reads/writes coupon state from the store (applyCoupon,
  removeCoupon, bill.discount). Preset codes live in src/shop.config.js.
*/
export default function CouponBox() {
  const { coupon, bill, couponMsg, setCouponMsg, applyCoupon, removeCoupon } = useStore();
  const [code, setCode] = useState("");

  if (coupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
        <span className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
          <Tag size={14} /> {coupon.code} applied · −{formatINR(bill.discount)}
        </span>
        <button onClick={removeCoupon} className="text-xs font-semibold text-green-700/70 hover:text-green-800">Remove</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center border border-slate-200 rounded-xl px-3 bg-white">
          <Tag size={15} className="text-slate-400 shrink-0" />
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); if (couponMsg) setCouponMsg(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") applyCoupon(code); }}
            placeholder="Coupon code"
            className="flex-1 ml-2 py-2.5 outline-hidden text-sm bg-transparent min-w-0"
          />
        </div>
        <button onClick={() => applyCoupon(code)} disabled={!code.trim()} className="px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-40 active:scale-95 transition">Apply</button>
      </div>
      {couponMsg && <p className="text-red-500 text-[11px] mt-1.5">{couponMsg}</p>}
    </div>
  );
}
