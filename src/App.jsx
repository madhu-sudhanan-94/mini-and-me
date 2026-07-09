import React, { useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { BRAND } from "./brand.config.js";
import { panelBlue, profileWash } from "./theme.js";
import { StoreProvider, useStore } from "./store.jsx";
import DesktopNav from "./components/DesktopNav.jsx";
import Footer from "./components/Footer.jsx";
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
import Orders from "./screens/Orders.jsx";
import Admin from "./screens/Admin.jsx";
import AdminOrders from "./screens/AdminOrders.jsx";
import LegalPage from "./screens/LegalPage.jsx";
import Contact from "./screens/Contact.jsx";
import ResetPassword from "./screens/ResetPassword.jsx";
import Security from "./screens/Security.jsx";
import ProductModal from "./screens/ProductModal.jsx";
import QuickAddSheet from "./components/QuickAddSheet.jsx";

const Logo = BRAND.logo;

const SCREENS = {
  login: Login, home: Home, category: Category, favorites: Favorites,
  cart: Cart, checkout: Checkout, success: Success, account: Account, profile: Profile,
  addresses: Addresses, orders: Orders, admin: Admin, adminorders: AdminOrders,
  legal: LegalPage, contact: Contact, resetpw: ResetPassword, security: Security,
};

function Shell() {
  const { hydrated, screen, toast, query } = useStore();
  const scrollRef = useRef(null);
  // Every screen should open at the top — reset scroll on navigation so a new
  // screen never inherits the previous screen's scroll position.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [screen]);

  if (!hydrated) {
    return (
      <div className="min-h-dvh flex items-center justify-center font-sans" style={panelBlue}>
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
  const showFooter = screen === "home" && !query.trim(); // hide footer while showing search results
  const showChrome = screen !== "login" && screen !== "resetpw";
  const deskWidth = ["home", "category", "favorites"].includes(screen) ? "lg:max-w-6xl" : (screen === "admin" || screen === "adminorders") ? "lg:max-w-4xl" : "lg:max-w-xl";

  return (
    <div className="min-h-dvh bg-slate-300 lg:bg-slate-50 flex justify-center sm:max-lg:py-6 font-sans">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}@keyframes vkUp{from{transform:translateY(100%);opacity:.7}to{transform:translateY(0);opacity:1}}.screen-wash{background:${profileWash};background-attachment:local}@media(min-width:900px){.screen-wash{background:none}}`}</style>
      <div className="relative w-full max-w-[430px] lg:max-w-none bg-slate-50 sm:max-lg:rounded-[2.5rem] sm:max-lg:shadow-2xl overflow-visible sm:max-lg:overflow-hidden flex flex-col min-h-dvh sm:max-lg:min-h-0 sm:max-lg:h-[880px] lg:h-auto lg:min-h-dvh">
        {showChrome && <DesktopNav />}
        {/* True mobile lets the PAGE scroll (so the browser's address bar can collapse);
            the sm→lg phone-mockup keeps its own inner scroll. */}
        <div ref={scrollRef} className="flex-1 overflow-visible sm:max-lg:overflow-y-auto no-scrollbar screen-wash">
          <div className={`lg:mx-auto lg:w-full lg:px-6 ${deskWidth}`}><Current /></div>
          {showFooter && <Footer />}
        </div>
        <ProductModal />
        <QuickAddSheet />

        {/* Toast */}
        {toast && (
          <div className="fixed sm:max-lg:absolute left-1/2 -translate-x-1/2 bottom-24 lg:bottom-8 min-w-[260px] max-w-[92%] justify-center text-center bg-slate-900 text-white text-sm px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-50">
            <Check size={15} className="text-accent-400 shrink-0" /> {toast}
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
