import React from "react";
import { User, Shield, ChevronRight, Package, ShoppingCart, LogOut, MapPin } from "lucide-react";
import { panelBlue } from "../theme.js";
import { useStore } from "../store.jsx";

export default function Account() {
  const { auth, orders, cartCount, setScreen, goToLogin, logout, profile, addresses, session, myOrders } = useStore();
  return (
    <div className="pb-4">
      <div className="rounded-b-[2.5rem] pb-8" style={panelBlue}>
        <div className="px-6 pt-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : auth.role === "admin" ? <Shield size={28} className="text-white" /> : <User size={28} className="text-white" />}
          </div>
          <div>
            <p className="text-white font-bold text-lg">{auth.role === "guest" ? "Guest user" : (profile?.full_name || (auth.role === "admin" ? "Administrator" : "Customer"))}</p>
            <p className="text-brand-100 text-sm">{auth.id || "Not signed in"}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-2.5">
        {session && (
          <button onClick={() => setScreen("profile")} className="w-full bg-white rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center"><User size={19} className="text-brand-600" /></div>
            <span className="flex-1 text-left font-semibold text-slate-800">Edit profile</span>
            <ChevronRight size={20} className="text-slate-300" />
          </button>
        )}
        {session && (
          <button onClick={() => setScreen("addresses")} className="w-full bg-white rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><MapPin size={19} className="text-slate-600" /></div>
            <span className="flex-1 text-left font-semibold text-slate-800">Delivery addresses</span>
            <span className="text-xs text-slate-400">{addresses.length}</span>
            <ChevronRight size={20} className="text-slate-300" />
          </button>
        )}
        {auth.role === "admin" && (
          <button onClick={() => setScreen("admin")} className="w-full bg-white rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center"><Shield size={19} className="text-brand-600" /></div>
            <span className="flex-1 text-left font-semibold text-slate-800">Admin dashboard</span>
            <ChevronRight size={20} className="text-slate-300" />
          </button>
        )}
        {[
          { icon: Package, label: "My orders", note: (session ? myOrders.length : orders.length) + " placed", action: () => setScreen("orders") },
          { icon: ShoppingCart, label: "My cart", note: cartCount + " items", action: () => setScreen("cart") },
        ].map((row, i) => (
          <button key={i} onClick={row.action} className="w-full bg-white rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><row.icon size={19} className="text-slate-600" /></div>
            <span className="flex-1 text-left font-semibold text-slate-800">{row.label}</span>
            <span className="text-xs text-slate-400">{row.note}</span>
          </button>
        ))}

        {auth.role === "guest" ? (
          <button onClick={() => goToLogin()} className="w-full mt-3 bg-linear-to-r from-brand-600 to-accent-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"><User size={18} /> Log in / Sign up</button>
        ) : (
          <button onClick={logout} className="w-full mt-3 border border-red-200 text-red-500 font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2"><LogOut size={18} /> Log out</button>
        )}
      </div>
    </div>
  );
}
