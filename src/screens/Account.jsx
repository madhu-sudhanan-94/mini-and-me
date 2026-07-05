import React from "react";
import { User, Shield, ChevronRight, ChevronLeft, Package, ShoppingCart, LogOut, MapPin, LifeBuoy, KeyRound } from "lucide-react";
import { mergeOrders } from "../lib/orders.js";
import { useStore } from "../store.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";

const TINT = {
  brand: "bg-brand-100 text-brand-600",
  emerald: "bg-emerald-100 text-emerald-600",
  violet: "bg-violet-100 text-violet-600",
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-600",
  sky: "bg-sky-100 text-sky-600",
};

export default function Account() {
  const { auth, orders, cartCount, setScreen, goToLogin, logout, profile, addresses, session, myOrders } = useStore();
  const orderCount = session ? mergeOrders(myOrders, orders).length : orders.length;
  const isGuest = auth.role === "guest";
  const name = isGuest ? "Guest user" : (profile?.full_name || (auth.role === "admin" ? "Administrator" : "Customer"));

  const groups = [
    { label: "Account", items: [
      session && { icon: User, tint: "brand", label: "Edit profile", action: () => setScreen("profile") },
      session && { icon: MapPin, tint: "emerald", label: "Delivery addresses", note: addresses.length, action: () => setScreen("addresses") },
      session && { icon: KeyRound, tint: "violet", label: "Login & security", action: () => setScreen("security") },
      auth.role === "admin" && { icon: Shield, tint: "brand", label: "Admin dashboard", action: () => setScreen("admin") },
    ].filter(Boolean) },
    { label: "Shopping", items: [
      { icon: Package, tint: "amber", label: "My orders", note: orderCount + " placed", action: () => setScreen("orders") },
      { icon: ShoppingCart, tint: "rose", label: "My cart", note: cartCount + " item" + (cartCount !== 1 ? "s" : ""), action: () => setScreen("cart") },
    ] },
    { label: "Support", items: [
      { icon: LifeBuoy, tint: "sky", label: "Help & support", note: "FAQ · Policies", action: () => setScreen("contact") },
    ] },
  ].filter((g) => g.items.length);

  return (
    <div className="pb-6">
      {/* light profile header */}
      <div className="px-5 pt-[18px]">
        <button onClick={() => setScreen("home")} aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center active:scale-95 transition"><ChevronLeft size={20} className="text-slate-700" /></button>
        <div className="flex items-center gap-4 mt-4">
          <div className="p-[3px] rounded-full bg-linear-to-br from-brand-500 to-accent-400 shrink-0 shadow-sm">
            <div className="w-[70px] h-[70px] rounded-full bg-white flex items-center justify-center overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : (auth.role === "admin" ? <Shield size={28} className="text-brand-600" /> : <User size={28} className="text-brand-500" />)}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-slate-900 truncate">{name}</p>
            <p className="text-sm text-slate-500 truncate">{auth.id || "Not signed in"}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">{g.label}</p>
            <div className="bg-white rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
              {g.items.map((it) => (
                <button key={it.label} onClick={it.action} className="w-full p-4 flex items-center gap-3.5 hover:bg-slate-50 active:bg-slate-100 transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TINT[it.tint]}`}><it.icon size={19} /></div>
                  <span className="flex-1 text-left font-semibold text-slate-800">{it.label}</span>
                  {it.note != null && <span className="text-xs text-slate-400">{it.note}</span>}
                  <ChevronRight size={19} className="text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {isGuest ? (
          <PrimaryButton onClick={() => goToLogin()} size="xl"><User size={18} /> Log in / Sign up</PrimaryButton>
        ) : (
          <button onClick={logout} className="w-full border border-red-200 text-red-500 font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 active:scale-[0.99] transition"><LogOut size={18} /> Log out</button>
        )}
      </div>
    </div>
  );
}
