import React from "react";
import { User, Shield, ChevronRight, Package, ShoppingCart, LogOut, MapPin, LifeBuoy, KeyRound } from "lucide-react";
import ScreenHeader from "../components/ScreenHeader.jsx";
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
  const plural = (n, w) => `${n} ${w}${n !== 1 ? "s" : ""}`;

  const groups = [
    { label: "Account", items: [
      session && { icon: User, tint: "brand", label: "Edit profile", sub: "Name, phone, photo & more", action: () => setScreen("profile") },
      session && { icon: MapPin, tint: "emerald", label: "Delivery addresses", sub: plural(addresses.length, "saved address").replace("addresss", "addresses"), action: () => setScreen("addresses") },
      session && { icon: KeyRound, tint: "violet", label: "Login & security", sub: "Password & account security", action: () => setScreen("security") },
      auth.role === "admin" && { icon: Shield, tint: "brand", label: "Admin dashboard", sub: "Manage products & orders", action: () => setScreen("admin") },
    ].filter(Boolean) },
    { label: "Shopping", items: [
      { icon: Package, tint: "amber", label: "My orders", sub: `${plural(orderCount, "order")} placed`, action: () => setScreen("orders") },
      { icon: ShoppingCart, tint: "rose", label: "My cart", sub: cartCount ? `${plural(cartCount, "item")} in your bag` : "Your bag is empty", action: () => setScreen("cart") },
    ] },
    { label: "Support", items: [
      { icon: LifeBuoy, tint: "sky", label: "Help & support", sub: "FAQs, contact & policies", action: () => setScreen("contact") },
    ] },
  ].filter((g) => g.items.length);

  const Avatar = (
    <div className="w-14 h-14 rounded-full bg-slate-100 ring-1 ring-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        : (auth.role === "admin" ? <Shield size={24} className="text-brand-600" /> : <User size={24} className="text-slate-400" />)}
    </div>
  );

  return (
    <div className="pb-6">
      <div className="px-5 pt-[18px]">
        <ScreenHeader title="My account" back="home" padded={false} />

        {/* Profile card */}
        {session ? (
          <button onClick={() => setScreen("profile")} className="w-full bg-white rounded-xl shadow-card p-4 mt-5 flex items-center gap-4 text-left hover:bg-slate-50 active:scale-[0.99] transition">
            {Avatar}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 truncate">{name}</p>
              <p className="text-sm text-slate-500 truncate">{auth.id || "Not signed in"}</p>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </button>
        ) : (
          <div className="w-full bg-white rounded-xl shadow-card p-4 mt-4 flex items-center gap-4">
            {Avatar}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 truncate">{name}</p>
              <p className="text-sm text-slate-500 truncate">Not signed in</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 mt-5 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">{g.label}</p>
            <div className="bg-white rounded-xl shadow-card divide-y divide-slate-100 overflow-hidden">
              {g.items.map((it) => (
                <button key={it.label} onClick={it.action} className="w-full p-4 flex items-center gap-3.5 hover:bg-slate-50 active:bg-slate-100 transition text-left">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TINT[it.tint]}`}><it.icon size={19} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{it.label}</p>
                    <p className="text-xs text-slate-400 truncate">{it.sub}</p>
                  </div>
                  <ChevronRight size={19} className="text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {isGuest ? (
          <PrimaryButton onClick={() => goToLogin()} size="xl"><User size={18} /> Log in / Sign up</PrimaryButton>
        ) : (
          <PrimaryButton variant="danger" size="lg" onClick={logout}><LogOut size={18} /> Log out</PrimaryButton>
        )}
      </div>
    </div>
  );
}
