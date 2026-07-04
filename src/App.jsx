import React from "react";
import { Check } from "lucide-react";
import { BRAND } from "./brand.config.js";
import { panelBlue } from "./theme.js";
import { StoreProvider, useStore } from "./store.jsx";
import DesktopNav from "./components/DesktopNav.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Login from "./screens/Login.jsx";
import Home from "./screens/Home.jsx";
import Category from "./screens/Category.jsx";
import Favorites from "./screens/Favorites.jsx";
import Cart from "./screens/Cart.jsx";
import Checkout from "./screens/Checkout.jsx";
import Success from "./screens/Success.jsx";
import Account from "./screens/Account.jsx";
import Profile from "./screens/Profile.jsx";
import Addresses from "./screens/Addresses.jsx";
import Admin from "./screens/Admin.jsx";
import ProductModal from "./screens/ProductModal.jsx";

const Logo = BRAND.logo;

const SCREENS = {
  login: Login, home: Home, category: Category, favorites: Favorites,
  cart: Cart, checkout: Checkout, success: Success, account: Account, profile: Profile,
  addresses: Addresses, admin: Admin,
};

function Shell() {
  const { hydrated, screen, toast } = useStore();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans" style={panelBlue}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Logo size={30} className="text-white" />
          </div>
          <p className="text-white text-xl font-extrabold">{BRAND.name}</p>
          <p className="text-brand-100 text-sm mt-1">Loading your store…</p>
        </div>
      </div>
    );
  }

  const Current = SCREENS[screen] || Home;
  const showNav = ["home", "category", "account", "cart", "favorites"].includes(screen);
  const showChrome = screen !== "login";
  const deskWidth = ["home", "category", "favorites"].includes(screen) ? "lg:max-w-6xl" : screen === "admin" ? "lg:max-w-4xl" : "lg:max-w-2xl";

  return (
    <div className="min-h-screen bg-slate-300 lg:bg-slate-50 flex justify-center sm:py-6 lg:py-0 font-sans">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}@keyframes vkUp{from{transform:translateY(100%);opacity:.7}to{transform:translateY(0);opacity:1}}`}</style>
      <div className="relative w-full max-w-[430px] lg:max-w-none bg-slate-50 sm:rounded-[2.5rem] lg:rounded-none sm:shadow-2xl lg:shadow-none overflow-hidden lg:overflow-visible flex flex-col h-screen sm:h-[880px] lg:h-auto lg:min-h-screen">
        {showChrome && <DesktopNav />}
        <div className="flex-1 overflow-y-auto no-scrollbar lg:overflow-visible">
          <div className={`lg:mx-auto lg:w-full lg:px-6 ${deskWidth}`}><Current /></div>
        </div>
        {showNav && <BottomNav />}
        <ProductModal />

        {/* Toast */}
        {toast && (
          <div className="absolute lg:fixed left-1/2 -translate-x-1/2 bottom-24 lg:bottom-8 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-50">
            <Check size={15} className="text-accent-400" /> {toast}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
