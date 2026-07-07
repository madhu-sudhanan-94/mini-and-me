import React from "react";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useStore } from "../store.jsx";

/* Mobile-only bottom tab bar (hidden on desktop via lg:hidden). */
export default function BottomNav() {
  const { screen, setScreen, setSelCategory, cartCount } = useStore();
  const Item = ({ icon: Icon, label, target, badge, onClick }) => {
    const active = screen === target;
    return (
      <button onClick={onClick || (() => setScreen(target))} className="relative flex flex-col items-center gap-0.5 flex-1 py-1">
        <Icon size={21} className={active ? "text-brand-600" : "text-slate-400"} />
        <span className={`text-[10px] ${active ? "text-brand-600 font-semibold" : "text-slate-400"}`}>{label}</span>
        {badge > 0 && <span className="absolute top-0 right-7 bg-brand-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{badge}</span>}
      </button>
    );
  };
  return (
    <div className="lg:hidden border-t border-slate-100 bg-white px-3 py-1.5 flex">
      <Item icon={Home} label="Home" target="home" />
      <Item icon={LayoutGrid} label="Shop" target="category" onClick={() => { setSelCategory("all"); setScreen("category"); }} />
      <Item icon={ShoppingCart} label="Cart" target="cart" badge={cartCount} />
      <Item icon={User} label="Account" target="account" />
    </div>
  );
}
