import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import {
  ADMIN_EMAIL, SUPABASE_URL, SUPABASE_KEY, SB_HEADERS, mapDbProduct,
  authSignUp, authSignIn, authRefresh, authSignOut, authErrText,
  authRecover, authGetUser, authUpdateUser,
} from "./lib/supabase.js";
import { PKEY, OKEY, CKEY, FKEY, AKEY, sget, sset, getRemember, saveSessionLocal, loadSessionLocal, clearSessionLocal } from "./lib/storage.js";
import { INITIAL_PRODUCTS, L, W, K } from "./data/products.js";
import { parseCsv } from "./lib/csv.js";
import { gstBreakdown, formatINR } from "./lib/format.js";
import { outOfStock, stockFor, sizeOutOfStock, firstInStockSize } from "./lib/catalog.js";
import { SHOP, findCoupon, couponDiscount } from "./shop.config.js";
import { PAYMENTS } from "./payments.config.js";
import { createRazorpayOrder, verifyRazorpayPayment, openRazorpayCheckout } from "./lib/razorpay.js";

/*
  StoreProvider holds ALL of the app's state and actions (what used to live in
  the single App component). Screens/components read it with the useStore() hook,
  so each screen can live in its own file without prop-drilling.
*/
const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [screen, setScreenRaw] = useState("home"); // open on the store; login only when needed
  // Navigation is mirrored into the browser history so the device/browser Back
  // (and Forward) buttons walk through the app's screens (Address → Profile → Home),
  // instead of leaving the app. See the popstate effect below.
  const screenRef = useRef("home");
  const setScreen = (next) => {
    const cur = screenRef.current;
    const target = typeof next === "function" ? next(cur) : next;
    if (target === cur) return;
    screenRef.current = target;
    if (typeof window !== "undefined") { try { window.history.pushState({ screen: target }, ""); } catch {} }
    setScreenRaw(target);
  };
  const goBack = (fallback = "home") => {
    if (typeof window !== "undefined") { window.history.back(); return; }
    screenRef.current = fallback; setScreenRaw(fallback);
  };
  const [auth, setAuth] = useState({ role: "guest", id: null });
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [imgIndex, setImgIndex] = useState(0);

  const [authMode, setAuthMode] = useState("login"); // login | signup
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [session, setSession] = useState(null); // { access_token, refresh_token, user }
  const [rememberMe, setRememberMe] = useState(getRemember()); // keep me signed in after browser restart
  const [adminBusy, setAdminBusy] = useState(false);
  const [returnTo, setReturnTo] = useState(null); // screen to return to after logging in
  const [profile, setProfile] = useState(null); // profiles row for the signed-in user
  const [profileBusy, setProfileBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [addresses, setAddresses] = useState([]); // delivery addresses for the signed-in user
  const [addrBusy, setAddrBusy] = useState(false);
  const [myOrders, setMyOrders] = useState([]);      // this user's orders (from DB)
  const [adminOrders, setAdminOrders] = useState([]); // all orders (admin view)
  const [ordersBusy, setOrdersBusy] = useState(false);

  const [selProduct, setSelProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // order shown on the order-detail screen
  const [selColor, setSelColor] = useState(null);
  const [selSize, setSelSize] = useState(null);
  const [quickAdd, setQuickAdd] = useState(null); // product shown in the quick-add bottom sheet

  const [selCategory, setSelCategory] = useState("women");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [legalPage, setLegalPage] = useState("privacy"); // which policy the Legal screen shows

  // checkout
  const [coName, setCoName] = useState("");
  const [coPhone, setCoPhone] = useState("");
  const [coEmail, setCoEmail] = useState("");
  const [coNote, setCoNote] = useState("");       // optional order note / delivery instructions
  const [giftWrap, setGiftWrap] = useState(false); // optional gift wrapping add-on at checkout
  const [paymentMethod, setPaymentMethod] = useState(PAYMENTS.onlineEnabled ? "online" : "cod"); // 'online' | 'cod'
  const [coupon, setCoupon] = useState(null);       // applied coupon object (or null)
  const [couponMsg, setCouponMsg] = useState("");   // coupon error / hint text
  const [lastOrder, setLastOrder] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState(null); // express "Buy now" single item (bypasses the cart)

  // admin form
  const blankForm = { id: null, name: "", cat: "women", shape: "dress", price: "", original: "", colors: ["#2563EB"], image: "", trending: false, tag: "", stock: "", sizeStock: {}, customSizes: [], description: "" };
  const [form, setForm] = useState(blankForm);

  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0] || null;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // ----- bill maths, computed for any set of order lines (cart OR express buy-now) -----
  const linesTotal = (lines) => lines.reduce((s, i) => {
    const p = products.find((x) => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const linesSavings = (lines) => lines.reduce((s, i) => {
    const p = products.find((x) => x.id === i.id);
    return s + (p && p.original && p.original > p.price ? (p.original - p.price) * i.qty : 0);
  }, 0);
  const computeBill = (lines, wrap = false) => {
    const itemsTotal = linesTotal(lines);
    const savings = linesSavings(lines);
    const g = gstBreakdown(itemsTotal);
    const discount = couponDiscount(coupon, itemsTotal);
    const qualifiesFree = itemsTotal >= SHOP.freeDeliveryThreshold;
    const deliveryFee = itemsTotal === 0 || qualifiesFree ? 0 : SHOP.deliveryFee;
    const toFreeDelivery = qualifiesFree ? 0 : Math.max(0, SHOP.freeDeliveryThreshold - itemsTotal);
    const giftWrapFee = wrap && itemsTotal > 0 ? SHOP.giftWrapFee : 0;
    const total = Math.max(0, itemsTotal - discount + deliveryFee + giftWrapFee);
    return {
      ...g, itemsTotal, savings, coupon, discount, deliveryFee, giftWrapFee,
      freeThreshold: SHOP.freeDeliveryThreshold, toFreeDelivery, qualifiesFree,
      totalSaved: savings + discount, total,
    };
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const bill = useMemo(() => computeBill(cart), [cart, products, coupon]);

  // Express "Buy now": checkout uses this single item instead of the cart.
  const checkoutItems = useMemo(() => (buyNowItem ? [buyNowItem] : cart), [buyNowItem, cart]);
  const checkoutCount = checkoutItems.reduce((s, i) => s + i.qty, 0);
  const checkoutBill = useMemo(() => computeBill(checkoutItems, giftWrap), [checkoutItems, products, coupon, giftWrap]);

  const applyCoupon = (code) => {
    const c = findCoupon(code);
    if (!c) { setCouponMsg("That code isn't valid."); return; }
    if (checkoutBill.itemsTotal < (c.minSubtotal || 0)) { setCouponMsg(`Spend ₹${c.minSubtotal.toLocaleString("en-IN")}+ to use ${c.code}.`); return; }
    setCoupon(c); setCouponMsg(""); showToast(`Coupon ${c.code} applied 🎉`);
  };
  const removeCoupon = () => { setCoupon(null); setCouponMsg(""); };

  // Drop the express "Buy now" item once the user leaves the checkout flow, so a
  // later normal checkout falls back to the cart.
  useEffect(() => {
    if (!["checkout", "addresses", "login"].includes(screen)) {
      setGiftWrap(false);
      if (buyNowItem) { setBuyNowItem(null); setCoupon(null); setCouponMsg(""); }
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefill the checkout contact fields from the signed-in profile (only fills blanks).
  useEffect(() => {
    if (screen !== "checkout" || !session) return;
    setCoName((v) => v || profile?.full_name || "");
    setCoPhone((v) => v || profile?.phone || defaultAddress?.phone || "");
    setCoEmail((v) => v || auth?.id || "");
  }, [screen, session, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hydrate from persistent storage on first load
  useEffect(() => {
    (async () => {
      const [pp, oo, cc, ff] = await Promise.all([
        sget(PKEY, true), sget(OKEY, true), sget(CKEY, false), sget(FKEY, false),
      ]);
      if (pp) { try { const a = JSON.parse(pp); if (Array.isArray(a) && a.length) setProducts(a); } catch {} }
      else { sset(PKEY, JSON.stringify(INITIAL_PRODUCTS), true); }
      if (oo) { try { const a = JSON.parse(oo); if (Array.isArray(a)) setOrders(a); } catch {} }
      if (cc) { try { const a = JSON.parse(cc); if (Array.isArray(a)) setCart(a); } catch {} }
      if (ff) { try { const a = JSON.parse(ff); if (Array.isArray(a)) setFavorites(a); } catch {} }
      setHydrated(true);
    })();
  }, []);

  // Headers for authenticated (admin) writes — uses the logged-in admin's token
  const writeHeaders = () => ({
    apikey: SUPABASE_KEY,
    Authorization: "Bearer " + (session?.access_token || SUPABASE_KEY),
    "Content-Type": "application/json",
  });

  // fetch that retries once on a 401 by refreshing the access token (so a
  // long-open session doesn't fail a write when the token expires).
  const authedFetch = async (url, opts = {}) => {
    let res = await fetch(url, opts);
    if (res.status === 401 && session?.refresh_token) {
      const fresh = await authRefresh(session.refresh_token);
      if (fresh && fresh.access_token) {
        setSession((s) => (s ? { ...s, access_token: fresh.access_token, refresh_token: fresh.refresh_token || s.refresh_token, user: fresh.user || s.user } : s));
        res = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: "Bearer " + fresh.access_token } });
      }
    }
    return res;
  };

  // Load live products from Supabase (falls back to samples if unreachable)
  const loadProducts = async ({ allowEmpty = false } = {}) => {
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/products?select=*&order=id.asc", { headers: SB_HEADERS });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && (rows.length || allowEmpty)) setProducts(rows.map(mapDbProduct));
      }
    } catch (e) { /* offline / not hosted yet — keep local sample data */ }
  };
  useEffect(() => { loadProducts(); }, []);

  // ---- Browser Back / Forward buttons ↔ screen + product modal ----
  // setScreen()/openProduct() push history entries; this listener syncs the app
  // state when the user presses the browser (or Android) Back/Forward button.
  const productsRef = useRef(products);
  const selProductRef = useRef(null);
  const quickAddRef = useRef(null);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { selProductRef.current = selProduct; }, [selProduct]);
  useEffect(() => { quickAddRef.current = quickAdd; }, [quickAdd]);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.history.replaceState({ screen: "home" }, ""); } catch {}
    const onPop = (e) => {
      const st = (e && e.state) || { screen: "home" };
      // quick-add bottom sheet
      if (st.quick != null) {
        const p = (productsRef.current || []).find((x) => x.id === st.quick);
        if (p) setQuickAdd(p);
      } else if (quickAddRef.current) {
        setQuickAdd(null);
      }
      const target = st.screen || "home";
      if (target !== screenRef.current) { screenRef.current = target; setScreenRaw(target); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Handle auth callbacks from email links: signup confirmation and password recovery.
  // Supabase redirects back with #access_token=...&type=signup|recovery in the URL.
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || hash.indexOf("access_token") === -1) return;
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type = params.get("type");
    if (!access_token) return;
    (async () => {
      const user = await authGetUser(access_token);
      const email = (user?.email || "").toLowerCase();
      guestMergeRef.current = { cart, favorites };
      setSession({ access_token, refresh_token, user });
      setAuth({ role: email === ADMIN_EMAIL ? "admin" : "customer", id: user?.email || email, uid: user?.id || null });
      if (type === "recovery") setScreen("resetpw");
      else { setScreen(email === ADMIN_EMAIL ? "admin" : "home"); showToast("Email verified — you're signed in"); }
      try { window.history.replaceState(null, "", window.location.pathname + window.location.search); } catch {}
    })();
  }, []);

  // Load the signed-in user's profile row whenever the session changes
  const loadProfile = async () => {
    const uid = session?.user?.id;
    if (!uid) { setProfile(null); return; }
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/profiles?id=eq." + uid + "&select=*", { headers: writeHeaders() });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]) setProfile(rows[0]);
      }
    } catch (e) { /* offline — keep whatever we have */ }
  };
  useEffect(() => { loadProfile(); }, [session?.user?.id]);

  // Load the signed-in user's delivery addresses. Stable order (newest first) so
  // picking a new default does NOT reshuffle the list / jump a card to the top.
  const loadAddresses = async () => {
    const uid = session?.user?.id;
    if (!uid) { setAddresses([]); return; }
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/addresses?user_id=eq." + uid + "&select=*&order=created_at.desc", { headers: writeHeaders() });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) setAddresses(rows);
      }
    } catch (e) { /* offline */ }
  };
  useEffect(() => { loadAddresses(); }, [session?.user?.id]);

  // Customer order history (from the DB, with line items)
  const loadMyOrders = async () => {
    const uid = session?.user?.id;
    if (!uid) { setMyOrders([]); return; }
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/orders?user_id=eq." + uid + "&select=*,order_items(*)&order=created_at.desc", { headers: writeHeaders() });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) setMyOrders(rows);
      }
    } catch (e) { /* offline */ }
  };
  useEffect(() => { loadMyOrders(); }, [session?.user?.id]);

  // ----- Cart & wishlist synced per user, + claim guest orders on login -----
  const userStateLoaded = useRef(false);
  const guestMergeRef = useRef(null); // guest cart/wishlist captured at interactive login, merged into the account
  const mergeCart = (base, extra) => {
    const out = base.map((x) => ({ ...x }));
    for (const it of extra) {
      const i = out.findIndex((x) => x.id === it.id && x.size === it.size && x.color === it.color);
      if (i >= 0) out[i].qty = (out[i].qty || 0) + (it.qty || 0);
      else out.push({ ...it });
    }
    return out;
  };

  const upsertUserState = async (uid, cartVal, favVal) => {
    try {
      await authedFetch(SUPABASE_URL + "/rest/v1/user_state?on_conflict=user_id", {
        method: "POST",
        headers: { ...writeHeaders(), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ user_id: uid, cart: cartVal, favorites: favVal, updated_at: new Date().toISOString() }),
      });
    } catch (e) { /* offline */ }
  };

  const loadUserState = async () => {
    const uid = session?.user?.id;
    if (!uid) return;
    let remoteCart = [], remoteFav = [];
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/user_state?user_id=eq." + uid + "&select=*", { headers: writeHeaders() });
      if (res.ok) {
        const rows = await res.json();
        const row = Array.isArray(rows) && rows[0];
        if (row) {
          remoteCart = Array.isArray(row.cart) ? row.cart : [];
          remoteFav = Array.isArray(row.favorites) ? row.favorites : [];
        }
      }
      // Merge a genuine guest cart/wishlist captured at interactive login; on a plain
      // session restore (no snapshot), the account's saved data is authoritative.
      const snap = guestMergeRef.current;
      guestMergeRef.current = null;
      const mergedCart = snap ? mergeCart(remoteCart, snap.cart || []) : remoteCart;
      const mergedFav = snap ? Array.from(new Set([...remoteFav, ...(snap.favorites || [])])) : remoteFav;
      setCart(mergedCart);
      setFavorites(mergedFav);
      if (session?.user?.id === uid) await upsertUserState(uid, mergedCart, mergedFav); // skip if the account switched mid-fetch
    } catch (e) { /* offline */ }
    finally { userStateLoaded.current = true; }
  };

  // Claim guest orders (user_id null) placed with this account's email
  const claimGuestOrders = async () => {
    const uid = session?.user?.id;
    const email = session?.user?.email;
    if (!uid || !email) return;
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/orders?user_id=is.null&customer_email=eq." + encodeURIComponent(email.toLowerCase()), {
        method: "PATCH",
        headers: writeHeaders(),
        body: JSON.stringify({ user_id: uid }),
      });
      if (res.ok) loadMyOrders();
    } catch (e) { /* ignore */ }
  };

  // On login: pull the saved cart/wishlist and claim any matching guest orders
  useEffect(() => {
    userStateLoaded.current = false;
    if (session?.user?.id) { loadUserState(); claimGuestOrders(); }
  }, [session?.user?.id]);

  // Persist cart/wishlist to the DB while signed in (debounced, after the initial load)
  useEffect(() => {
    if (!hydrated || !session?.user?.id || !userStateLoaded.current) return;
    const t = setTimeout(() => upsertUserState(session.user.id, cart, favorites), 600);
    return () => clearTimeout(t);
  }, [cart, favorites, session?.user?.id, hydrated]);

  // Admin: read & manage ALL orders
  const loadAdminOrders = async () => {
    if (auth.role !== "admin" || !session?.access_token) return;
    setOrdersBusy(true);
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/orders?select=*,order_items(*)&order=created_at.desc", { headers: writeHeaders() });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) setAdminOrders(rows);
      }
    } catch (e) { /* offline */ }
    finally { setOrdersBusy(false); }
  };
  // Cancel + refund a paid online order via the edge function (Razorpay refund;
  // the DB trigger then restores stock). Used for any cancel of a paid order.
  const cancelRefundOrder = async (id) => {
    setOrdersBusy(true);
    try {
      const res = await fetch(SUPABASE_URL + "/functions/v1/refund-order", {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, userToken: session?.access_token || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) { showToast(data.error === "refund_failed" ? "Refund failed at Razorpay — try again" : "Couldn't cancel the order"); return; }
      setAdminOrders((os) => os.map((o) => (o.id === id ? { ...o, status: "cancelled", payment_status: data.refunded ? "refunded" : o.payment_status } : o)));
      showToast(data.refunded ? "Order cancelled & refunded" : "Order cancelled");
    } catch (e) { showToast("Network error"); }
    finally { setOrdersBusy(false); }
  };

  const updateOrderStatus = async (id, status) => {
    if (auth.role !== "admin" || !session?.access_token) return;
    const raw = adminOrders.find((o) => o.id === id);
    // Cancelled orders are terminal — reopening would leave them fulfillable with
    // the money already refunded and the stock already restored.
    if (raw && raw.status === "cancelled" && status !== "cancelled") {
      showToast("A cancelled order can't be reopened.");
      return;
    }
    // Cancelling ANY online order routes through the refund edge function, which
    // re-checks the real payment state server-side (covers paid, and the
    // captured-but-not-yet-confirmed window) and refunds if money was taken.
    if (status === "cancelled" && raw && raw.payment_method === "online") return cancelRefundOrder(id);
    setOrdersBusy(true);
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/orders?id=eq." + id, {
        method: "PATCH",
        headers: { ...writeHeaders(), Prefer: "return=representation" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { showToast("Couldn't update status"); return; }
      setAdminOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
      showToast("Order marked " + status);
      // Email the customer on shipped/delivered (fire-and-forget; server dedupes).
      if (status === "shipped" || status === "delivered") {
        fetch(SUPABASE_URL + "/functions/v1/send-order-email", {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: id, kind: status, userToken: session?.access_token || null }),
        }).catch(() => {});
      }
    } catch (e) { showToast("Network error"); }
    finally { setOrdersBusy(false); }
  };

  // Restore a saved login session on load (refresh the token so it stays valid)
  useEffect(() => {
    (async () => {
      const raw = loadSessionLocal() || await sget(AKEY, false);
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (!saved?.refresh_token) return;
        const fresh = await authRefresh(saved.refresh_token);
        if (fresh && fresh.access_token) {
          const email = (fresh.user?.email || saved.user?.email || "").toLowerCase();
          setSession({ access_token: fresh.access_token, refresh_token: fresh.refresh_token, user: fresh.user || saved.user });
          setAuth({ role: email === ADMIN_EMAIL ? "admin" : "customer", id: fresh.user?.email || email, uid: fresh.user?.id || null });
          setScreen((s) => (s === "login" ? "home" : s));
        } else {
          clearSessionLocal();
          await sset(AKEY, "", false);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => { if (hydrated) sset(PKEY, JSON.stringify(products), true); }, [products, hydrated]);
  useEffect(() => { if (hydrated) sset(OKEY, JSON.stringify(orders), true); }, [orders, hydrated]);
  useEffect(() => { if (hydrated) sset(CKEY, JSON.stringify(cart), false); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) sset(FKEY, JSON.stringify(favorites), false); }, [favorites, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    saveSessionLocal(session, rememberMe); // localStorage if "remember me", else sessionStorage
    sset(AKEY, session ? JSON.stringify(session) : "", false);
  }, [session, rememberMe, hydrated]);

  // Auto-rotate the home hero
  useEffect(() => {
    if (screen !== "home") return;
    const t = setInterval(() => setHeroIndex((i) => i + 1), 4000);
    return () => clearInterval(t);
  }, [screen]);

  /* ---------- actions ---------- */
  // Send a guest to the login screen, remembering where to bring them back
  const goToLogin = (target) => {
    // A guest can't complete express checkout instantly (sign-up may need an
    // email-confirm reload that would lose the in-memory item), so fold the
    // buy-now item into the persisted cart before sending them to login.
    if (buyNowItem) {
      setCart((prev) => mergeCart(prev, [{ id: buyNowItem.id, size: buyNowItem.size, color: buyNowItem.color, qty: buyNowItem.qty }]));
      setBuyNowItem(null);
    }
    setReturnTo(target || null);
    setAuthErr(""); setAuthNotice(""); setAuthMode("login");
    setScreen("login");
  };

  const openLegal = (key) => { setLegalPage(key); setScreen("legal"); };

  /* ---------- password recovery & account changes ---------- */
  const requestPasswordReset = async () => {
    const email = loginEmail.trim().toLowerCase();
    setAuthErr(""); setAuthNotice("");
    if (!email) { setAuthErr("Enter your email above first, then tap Forgot password."); return; }
    setAuthBusy(true);
    try {
      await authRecover(email);
      setAuthNotice("If an account exists for " + email + ", a password reset link is on its way.");
    } catch (e) {
      setAuthErr("Couldn't send the reset email. Please try again.");
    } finally { setAuthBusy(false); }
  };

  // Set a new password using the recovery session from the email link.
  const setNewPassword = async (pw) => {
    if (!session?.access_token) { showToast("Reset link expired — request a new one"); return false; }
    if (!pw || pw.length < 6) { showToast("Password must be at least 6 characters"); return false; }
    const { ok, data } = await authUpdateUser(session.access_token, { password: pw });
    if (!ok) { showToast(authErrText(data)); return false; }
    showToast("Password updated");
    setScreen("home");
    return true;
  };

  // Change email / password for a signed-in user. Returns { ok, data }.
  const updateAccount = async (fields) => {
    if (!session?.access_token) { showToast("Log in first"); return { ok: false }; }
    const { ok, data } = await authUpdateUser(session.access_token, fields);
    if (!ok) { showToast(authErrText(data)); return { ok: false, data }; }
    return { ok: true, data };
  };

  const applySession = (data) => {
    guestMergeRef.current = { cart, favorites }; // merge this guest cart/wishlist into the account
    const user = data.user || { email: loginEmail.trim().toLowerCase() };
    const email = (user.email || "").toLowerCase();
    const isAdmin = email === ADMIN_EMAIL;
    setSession({ access_token: data.access_token, refresh_token: data.refresh_token, user });
    setAuth({ role: isAdmin ? "admin" : "customer", id: user.email || email, uid: user.id || null });
    setLoginEmail(""); setLoginPassword(""); setAuthErr(""); setAuthNotice("");
    // Return to where they were headed (e.g. checkout); else admins → dashboard, others → home
    const dest = returnTo || (isAdmin ? "admin" : "home");
    setReturnTo(null);
    setScreen(dest);
  };

  const handleAuth = async () => {
    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;
    setAuthErr(""); setAuthNotice("");
    if (!email || !password) { setAuthErr("Enter your email and password."); return; }
    if (password.length < 6) { setAuthErr("Password must be at least 6 characters."); return; }
    setAuthBusy(true);
    try {
      if (authMode === "signup") {
        const { ok, data } = await authSignUp(email, password);
        if (!ok) { setAuthErr(authErrText(data)); return; }
        if (data.access_token) { applySession(data); return; } // email confirmation off → instant session
        // email confirmation on → no session until the link is clicked
        setAuthNotice("Account created! Check " + email + " for a confirmation link, then log in.");
        setAuthMode("login");
        setLoginPassword("");
      } else {
        const { ok, data } = await authSignIn(email, password);
        if (!ok || !data.access_token) { setAuthErr(authErrText(data)); return; }
        applySession(data);
      }
    } catch (e) {
      setAuthErr("Network error — please check your connection and try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const showProduct = (p) => {
    setSelProduct(p);
    setSelColor(p.colors[0]);
    setSelSize(firstInStockSize(p) || p.sizes[0]); // land on a buyable size
    setImgIndex(0);
  };
  const openProduct = (p) => {
    showProduct(p);
    setScreen("product"); // product is a routed screen now; setScreen handles the history push
  };
  const closeProduct = () => { goBack(); };

  // Open the full order-detail screen for a given (normalized) order.
  const openOrder = (o) => { setSelectedOrder(o); setScreen("orderdetail"); };

  // ----- Product reviews (shared, from the `reviews` table) -----
  const [productReviews, setProductReviews] = useState({}); // { [productId]: [rows] }
  const loadProductReviews = async (productId) => {
    if (productId == null) return;
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/reviews?product_id=eq." + productId + "&select=*&order=created_at.desc", { headers: SB_HEADERS });
      if (res.ok) { const rows = await res.json(); setProductReviews((m) => ({ ...m, [productId]: Array.isArray(rows) ? rows : [] })); }
    } catch (e) { /* offline — leave whatever we have */ }
  };
  // Only a signed-in customer with a DELIVERED order containing this product may
  // review it (mirrors the reviews_insert_delivered_buyer RLS policy).
  const canReview = (productId) =>
    !!session && (myOrders || []).some((o) => o.status === "delivered" && (o.order_items || []).some((it) => it.product_id === productId));
  const submitReview = async ({ productId, rating, comment }) => {
    if (!session?.user?.id) { showToast("Log in to write a review"); return false; }
    if (!rating || rating < 1) { showToast("Pick a star rating first"); return false; }
    try {
      const name = (profile?.full_name || (auth?.id || "").split("@")[0] || "Customer").trim();
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/reviews", {
        method: "POST", headers: { ...writeHeaders(), Prefer: "return=representation" },
        body: JSON.stringify({ product_id: productId, user_id: session.user.id, name, rating, comment: (comment || "").trim() || null }),
      });
      if (!res.ok) { showToast(res.status === 401 || res.status === 403 ? "Only delivered buyers can review this" : "Couldn't post your review"); return false; }
      await loadProductReviews(productId);
      showToast("Thanks for your review!");
      return true;
    } catch (e) { showToast("Network error — review not posted"); return false; }
  };

  // Quick-add bottom sheet (tap the cart icon on a product card → pick a size →
  // add to cart / buy now, without leaving the current screen). History-backed so
  // the device Back button just closes the sheet.
  const openQuickAdd = (p) => {
    if (!p) return;
    setQuickAdd(p);
    if (typeof window !== "undefined") { try { window.history.pushState({ screen: screenRef.current, quick: p.id }, ""); } catch {} }
  };
  const closeQuickAdd = () => {
    if (typeof window !== "undefined" && window.history.state && window.history.state.quick != null) { window.history.back(); return; }
    setQuickAdd(null);
  };

  // Deep-link: a shared ?p=<id> URL opens that product once products are loaded.
  const deepLinkedRef = useRef(false);
  useEffect(() => {
    if (deepLinkedRef.current || typeof window === "undefined") return;
    const pid = new URLSearchParams(window.location.search).get("p");
    if (!pid) { deepLinkedRef.current = true; return; }
    const p = products.find((x) => String(x.id) === String(pid));
    if (!p) return; // products may still be loading — retry when they change
    deepLinkedRef.current = true;
    openProduct(p);
    try { const u = new URL(window.location.href); u.searchParams.delete("p"); window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash); } catch {}
  }, [products]);
  const toggleFav = (id) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const isFav = (id) => favorites.includes(id);

  const addToCart = (p, size, color, qty = 1) => {
    const n = Math.max(1, Math.floor(qty) || 1);
    if (outOfStock(p) || sizeOutOfStock(p, size)) { showToast(sizeOutOfStock(p, size) && !outOfStock(p) ? `Size ${size} is out of stock` : "Sorry, that's out of stock"); return; }
    // Cap against the size's stock summed across every colour of this product+size.
    const avail = stockFor(p, size);
    const sameSizeQty = cart.filter((x) => x.id === p.id && x.size === size).reduce((s, x) => s + x.qty, 0);
    if (avail != null && sameSizeQty + n > avail) { showToast(`Only ${avail} left in size ${size}`); return; }
    setCart((prev) => {
      const i = prev.findIndex((x) => x.id === p.id && x.size === size && x.color === color);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + n };
        return copy;
      }
      return [...prev, { id: p.id, size, color, qty: n }];
    });
    showToast(n > 1 ? `Added ${n} × ${p.name} (${size})` : `Added ${p.name} (${size})`);
  };

  const changeQty = (idx, d) => {
    if (d > 0) {
      const line = cart[idx];
      const p = line && products.find((x) => x.id === line.id);
      const avail = p && stockFor(p, line.size);
      const sameSizeQty = line ? cart.filter((x) => x.id === line.id && x.size === line.size).reduce((s, x) => s + x.qty, 0) : 0;
      if (avail != null && sameSizeQty + d > avail) { showToast(`Only ${avail} left in size ${line.size}`); return; }
    }
    setCart((prev) => {
      const copy = [...prev];
      if (!copy[idx]) return prev;
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + d };
      if (copy[idx].qty <= 0) copy.splice(idx, 1);
      return copy;
    });
  };
  const removeItem = (idx) => setCart((prev) => prev.filter((_, i) => i !== idx));

  // Buy now: add the item then jump straight to checkout. Guests reach checkout
  // (it shows a "Log in to place order" branch), so no login gate. Respects stock.
  const buyNow = (p, size, color, qty = 1) => {
    if (outOfStock(p) || sizeOutOfStock(p, size)) { showToast(sizeOutOfStock(p, size) && !outOfStock(p) ? `Size ${size} is out of stock` : "Sorry, that's out of stock"); return; }
    const avail = stockFor(p, size);
    const n = Math.min(Math.max(1, Math.floor(qty) || 1), avail != null ? avail : Infinity);
    setBuyNowItem({ id: p.id, size, color, qty: n }); // express checkout — does NOT touch the cart
    setCoupon(null); setCouponMsg("");                 // express checkout starts with a clean coupon
    setSelProduct(null);                               // close the product modal
    // Replace the product's history entry with checkout (instead of pushing on top of it),
    // so a single Back returns to the store rather than re-opening the product modal.
    if (typeof window !== "undefined") { try { window.history.replaceState({ screen: "checkout" }, ""); } catch {} }
    screenRef.current = "checkout";
    setScreenRaw("checkout");
  };
  // Change the express buy-now item's quantity (clamped to >= 1, respects stock).
  const changeBuyNowQty = (d) => {
    if (!buyNowItem) return;
    const next = buyNowItem.qty + d;
    if (next < 1) return;
    const p = products.find((x) => x.id === buyNowItem.id);
    const avail = p && stockFor(p, buyNowItem.size);
    if (d > 0 && avail != null && next > avail) { showToast(`Only ${avail} left in size ${buyNowItem.size}`); return; }
    setBuyNowItem({ ...buyNowItem, qty: next });
  };

  // Persist an order + its line items. Returns { ok, dbId } / { ok:false, offline? }.
  // If the line-items insert fails, we roll back the just-created order. This
  // works for signed-in users (orders_delete_own RLS); for guests the delete may
  // be blocked by RLS, leaving a rare item-less order for admin cleanup.
  const saveOrderToDb = async (order, items, phone, email, extra = {}) => {
    try {
      const baseBody = {
        customer_name: order.name, customer_phone: phone, customer_email: email,
        total: order.total, status: "placed",
        ref: order.id,
        user_id: extra.userId || null,
        shipping_address: extra.shipping || null,
      };
      // Full breakdown — persisted once supabase/2026-07-11-feature-migration.sql
      // has added these columns. On a DB that predates it, PostgREST 400s on the
      // unknown columns, so we fall back (full → base+note → base) and still
      // record the order rather than failing it.
      const fullBody = {
        ...baseBody,
        note: order.note || null,
        items_total: order.itemsTotal,
        subtotal: order.subtotal,
        gst: order.gst,
        gst_rate_pct: order.ratePct,
        discount: order.discount,
        coupon_code: order.coupon?.code || null,
        delivery_fee: order.delivery_fee,
        gift_wrap: !!order.giftWrap,
        gift_wrap_fee: order.gift_wrap_fee,
        total_saved: order.saved,
        payment_method: "cod",
      };
      const postOrder = (body) => authedFetch(SUPABASE_URL + "/rest/v1/orders", {
        method: "POST",
        headers: { ...writeHeaders(), Prefer: "return=representation" },
        body: JSON.stringify(body),
      });
      let res = await postOrder(fullBody);
      if (!res.ok) res = await postOrder(order.note ? { ...baseBody, note: order.note } : baseBody);
      if (!res.ok && order.note) res = await postOrder(baseBody);
      if (!res.ok) return { ok: false };
      const rows = await res.json().catch(() => []);
      const dbId = rows && rows[0] && rows[0].id;
      if (!dbId) return { ok: false };
      if (items.length) {
        const ir = await authedFetch(SUPABASE_URL + "/rest/v1/order_items", {
          method: "POST",
          headers: writeHeaders(),
          body: JSON.stringify(items.map((it) => ({ ...it, order_id: dbId }))),
        });
        if (!ir.ok) {
          // roll back the orphaned order (best effort — RLS may block guests)
          authedFetch(SUPABASE_URL + "/rest/v1/orders?id=eq." + dbId, { method: "DELETE", headers: writeHeaders() }).catch(() => {});
          return { ok: false };
        }
      }
      if (extra.userId) loadMyOrders();
      return { ok: true, dbId };
    } catch (e) {
      return { ok: false, offline: true };
    }
  };

  const placeOrder = async () => {
    if (placingOrder) return;
    if (!coName.trim() || (!coPhone.trim() && !coEmail.trim())) return;
    // A signed-in user must have a delivery address, or the order ships nowhere.
    if (session && !defaultAddress) { showToast("Please add a delivery address"); setScreen("addresses"); return; }
    // Don't let an out-of-stock / over-quantity item through checkout.
    const badLine = checkoutItems.find((it) => {
      const p = products.find((x) => x.id === it.id);
      if (!p) return false;
      const avail = stockFor(p, it.size);
      const sameSizeQty = checkoutItems.filter((x) => x.id === it.id && x.size === it.size).reduce((s, x) => s + x.qty, 0);
      return outOfStock(p) || sizeOutOfStock(p, it.size) || (avail != null && sameSizeQty > avail);
    });
    if (badLine) { showToast("Sorry, that item is out of stock"); if (!buyNowItem) setScreen("cart"); return; }

    const order = {
      id: "PP" + Math.floor(100000 + Math.random() * 900000),
      total: checkoutBill.total,
      count: checkoutCount,
      name: coName.trim(),
      contact: coPhone.trim() || coEmail.trim(),
      phone: coPhone.trim() || null,
      email: coEmail.trim().toLowerCase() || null,
      note: coNote.trim() || null,
      ts: Date.now(),
      coupon: checkoutBill.coupon ? { code: checkoutBill.coupon.code, discount: checkoutBill.discount } : null,
      discount: checkoutBill.discount,
      delivery_fee: checkoutBill.deliveryFee,
      giftWrap: checkoutBill.giftWrapFee > 0,
      gift_wrap_fee: checkoutBill.giftWrapFee,
      subtotal: checkoutBill.subtotal,
      gst: checkoutBill.gst,
      ratePct: checkoutBill.ratePct,
      itemsTotal: checkoutBill.itemsTotal,
      saved: checkoutBill.totalSaved,
    };
    const itemsSnapshot = checkoutItems.map((it) => {
      const p = products.find((x) => x.id === it.id);
      return { product_id: it.id, product_name: p ? p.name : "Item", size: it.size, color: it.color, unit_price: p ? p.price : 0, qty: it.qty };
    });
    // snapshot the delivery address so past orders keep the right destination
    const snap = (a) => a ? {
      label: a.label, full_name: a.full_name, phone: a.phone,
      line1: a.line1, line2: a.line2, area: a.area, city: a.city,
      state: a.state, pincode: a.pincode, country: a.country,
    } : null;
    const shipping = snap(defaultAddress);

    // Shared success handoff (clear cart + fields, go to the success screen).
    const finishOrder = (finalOrder) => {
      setOrders((o) => [finalOrder, ...o]);
      setLastOrder(finalOrder);
      if (buyNowItem) setBuyNowItem(null); else setCart([]); // buy-now leaves the cart intact
      setCoupon(null); setCouponMsg("");
      setCoName(""); setCoPhone(""); setCoEmail(""); setCoNote(""); setGiftWrap(false);
      if (session?.user?.id) loadMyOrders();
      // Replace the checkout history entry with success (like buyNow), so pressing Back
      // from the success screen returns to the store — not an emptied checkout page.
      if (typeof window !== "undefined") { try { window.history.replaceState({ screen: "success" }, ""); } catch {} }
      screenRef.current = "success";
      setScreenRaw("success");
    };

    // ----- Online payment (Razorpay) -----
    // The edge function re-prices the order server-side and creates a pending DB
    // order; we only mark success after the signature is verified server-side.
    if (paymentMethod === "online") {
      if (!PAYMENTS.onlineEnabled) { showToast("Online payment isn't available right now"); return; }
      setPlacingOrder(true);
      try {
        const created = await createRazorpayOrder({
          items: checkoutItems.map((it) => ({ product_id: it.id, size: it.size, color: it.color, qty: it.qty })),
          couponCode: order.coupon?.code || null,
          giftWrap: checkoutBill.giftWrapFee > 0,
          contact: { name: order.name, phone: order.phone, email: order.email },
          note: order.note, shipping, userToken: session?.access_token || null, ref: order.id,
        });
        if (!created || !created.razorpayOrderId) {
          setPlacingOrder(false);
          showToast(created?.error === "out_of_stock" ? "Sorry, an item just went out of stock." : "Couldn't start payment. Please try again.");
          return;
        }
        // Display the SERVER-confirmed amounts, never the (possibly stale) client bill.
        const sb = created.bill || {};
        const onlineOrder = {
          ...order, status: "placed", shipping, items: itemsSnapshot, payment_method: "online",
          total: sb.total ?? order.total, subtotal: sb.subtotal ?? order.subtotal, gst: sb.gst ?? order.gst,
          ratePct: sb.ratePct ?? order.ratePct, discount: sb.discount ?? order.discount,
          delivery_fee: sb.deliveryFee ?? order.delivery_fee, gift_wrap_fee: sb.giftWrapFee ?? order.gift_wrap_fee,
        };
        const payResp = await openRazorpayCheckout({
          keyId: created.keyId, orderId: created.razorpayOrderId, amount: created.amount,
          description: `Order ${order.id}`,
          prefill: { name: order.name, email: order.email || "", contact: order.phone || "" },
        });
        if (payResp && payResp.__error === "sdk") { setPlacingOrder(false); showToast("Couldn't open the payment window. Please try again."); return; }
        if (!payResp) { setPlacingOrder(false); showToast("Payment cancelled"); return; }
        const verified = await verifyRazorpayPayment(payResp);
        setPlacingOrder(false);
        if (verified && verified.ok) {
          finishOrder({ ...onlineOrder, payment_status: "paid" });
        } else {
          // Razorpay's handler only fires AFTER the card is charged, so the money
          // was taken. Never re-charge on a verify blip — record it as processing
          // and let the webhook confirm it. Clearing the cart (in finishOrder)
          // is what prevents a double charge on retry.
          finishOrder({ ...onlineOrder, payment_status: "pending" });
          showToast("Payment received — we're confirming it. Track it in My Orders.");
        }
      } catch (e) {
        setPlacingOrder(false);
        showToast("Payment failed. Please try again.");
      }
      return;
    }

    // ----- Cash on delivery / pay later -----
    if (!PAYMENTS.codAvailable) { showToast("Cash on delivery isn't available yet — please pay online."); return; }
    // Wait for the order to be safely recorded before showing success. If it
    // can't be saved, keep the cart + details so the customer can retry.
    setPlacingOrder(true);
    const result = await saveOrderToDb(order, itemsSnapshot, order.phone, order.email, { userId: session?.user?.id || null, shipping });
    setPlacingOrder(false);
    if (!result.ok) {
      showToast(result.offline ? "You appear to be offline — order not placed. Please try again." : "Couldn't place your order. Please try again.");
      return;
    }
    finishOrder({ ...order, status: "placed", shipping, items: itemsSnapshot, payment_method: "cod", payment_status: "pending" });
  };

  const logout = () => {
    if (session?.access_token) authSignOut(session.access_token);
    setSession(null);
    setProfile(null);
    setAddresses([]);
    setMyOrders([]);
    setAdminOrders([]);
    setCart([]);            // don't leave this account's cart/wishlist for the next person
    setFavorites([]);
    setCoupon(null); setCouponMsg("");
    guestMergeRef.current = null;
    setAuth({ role: "guest", id: null });
    setReturnTo(null);
    setLoginEmail(""); setLoginPassword(""); setAuthErr(""); setAuthNotice(""); setAuthMode("login");
    setScreen("home"); // back to the store as a guest, not the login wall
  };

  const writeErrToast = (status, fallback) =>
    showToast(status === 401 || status === 403 ? "Not allowed — log in as admin first" : fallback);

  const saveProduct = async () => {
    if (!form.name.trim() || !form.price) return;
    if (auth.role !== "admin" || !session?.access_token) { showToast("Log in as admin to save"); return; }
    const baseSizes = form.cat === "toys" ? ["Free"] : form.cat === "kids" ? K : ["pants", "shorts"].includes(form.shape) ? W : L;
    const sizes = [...baseSizes, ...(form.customSizes || []).filter((s) => s && !baseSizes.includes(s))];
    const images = form.image.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const body = {
      name: form.name.trim(),
      category: form.cat,
      shape: form.shape,
      price: Number(form.price),
      original_price: form.original ? Number(form.original) : null,
      colors: (form.colors && form.colors.length) ? form.colors : ["#2563EB"],
      sizes,
      trending: !!form.trending,
      tag: form.tag || null,
      images,
      image_url: images[0] || null,
      description: (form.description || "").trim(),
    };
    // Only send stock when the admin set it, so this keeps working on a DB
    // that hasn't added the `stock` column yet.
    if (form.stock !== "" && form.stock != null) body.stock = Number(form.stock);
    // Per-size stock (jsonb `size_stock`). Only filled numeric entries; only sent
    // when non-empty, so inserts keep working before the column exists.
    const sizeStock = {};
    if (form.sizeStock) for (const s of sizes) { const v = form.sizeStock[s]; if (v !== "" && v != null) sizeStock[s] = Number(v); }
    // On edit, always send size_stock (null when cleared) so per-size tracking can
    // be turned off — but only when the row already had it, to stay compatible with
    // a DB that predates the column. On insert, omit when empty.
    if (form.id && (Object.keys(sizeStock).length || form._hadSizeStock)) body.size_stock = Object.keys(sizeStock).length ? sizeStock : null;
    else if (Object.keys(sizeStock).length) body.size_stock = sizeStock;
    setAdminBusy(true);
    try {
      let res;
      if (form.id) {
        res = await authedFetch(SUPABASE_URL + "/rest/v1/products?id=eq." + form.id, {
          method: "PATCH",
          headers: { ...writeHeaders(), Prefer: "return=representation" },
          body: JSON.stringify(body),
        });
      } else {
        res = await authedFetch(SUPABASE_URL + "/rest/v1/products", {
          method: "POST",
          headers: { ...writeHeaders(), Prefer: "return=representation" },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        writeErrToast(res.status, err.message || "Save failed");
        return;
      }
      const rows = await res.json().catch(() => []);
      const saved = Array.isArray(rows) && rows[0] ? mapDbProduct(rows[0]) : null;
      if (saved) {
        setProducts((ps) => form.id ? ps.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...ps]);
      } else {
        await loadProducts({ allowEmpty: true });
      }
      showToast(form.id ? "Product updated" : "Product added");
      setForm(blankForm);
    } catch (e) {
      showToast("Network error — not saved");
    } finally {
      setAdminBusy(false);
    }
  };

  // Upload a profile photo to the `avatars` bucket, then store its URL on the profile.
  // Path must start with the user's id to satisfy the storage RLS policy.
  const uploadAvatar = async (file) => {
    const uid = session?.user?.id;
    if (!uid || !session?.access_token) { showToast("Log in to upload a photo"); return; }
    if (avatarBusy) return; // ignore a second pick while one is in flight
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please choose an image file"); return; }
    if (file.size === 0) { showToast("That file appears to be empty"); return; }
    if (file.size > 3 * 1024 * 1024) { showToast("Image must be under 3 MB"); return; }
    setAvatarBusy(true);
    try {
      const path = uid + "/avatar";
      const up = await authedFetch(SUPABASE_URL + "/storage/v1/object/avatars/" + path, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + session.access_token,
          "content-type": file.type,
          "x-upsert": "true",
          "cache-control": "3600",
        },
        body: file,
      });
      if (!up.ok) {
        showToast(up.status === 401 || up.status === 403 ? "Session expired — please log in again" : "Upload failed — is the 'avatars' bucket set up?");
        return;
      }
      const url = SUPABASE_URL + "/storage/v1/object/public/avatars/" + path + "?v=" + Date.now();
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/profiles?id=eq." + uid, {
        method: "PATCH",
        headers: { ...writeHeaders(), Prefer: "return=representation" },
        body: JSON.stringify({ avatar_url: url }),
      });
      if (!res.ok) {
        showToast(res.status === 401 || res.status === 403 ? "Session expired — please log in again" : "Uploaded, but couldn't save to profile");
        return;
      }
      const rows = await res.json().catch(() => []);
      if (!(Array.isArray(rows) && rows[0])) { showToast("Couldn't save photo — profile not found"); return; }
      setProfile(rows[0]);
      showToast("Photo updated");
    } catch (e) {
      showToast("Network error — photo not uploaded");
    } finally {
      setAvatarBusy(false);
    }
  };

  const editProduct = (p) => setForm({
    id: p.id, name: p.name, cat: p.cat, shape: p.shape,
    price: String(p.price), original: p.original ? String(p.original) : "",
    colors: (p.colors && p.colors.length) ? p.colors : ["#2563EB"], image: (p.images || []).join("\n"), trending: !!p.trending,
    tag: p.tag || "",
    description: p.desc || "",
    stock: p.stock != null ? String(p.stock) : "",
    sizeStock: p.sizeStock ? Object.fromEntries(Object.entries(p.sizeStock).map(([k, v]) => [k, String(v)])) : {},
    _hadSizeStock: !!p.sizeStock,
    customSizes: (p.sizes || []).filter((s) => !(p.cat === "toys" ? ["Free"] : p.cat === "kids" ? K : ["pants", "shorts"].includes(p.shape) ? W : L).includes(s)),
  });

  const deleteProduct = async (id) => {
    if (auth.role !== "admin" || !session?.access_token) { showToast("Log in as admin to delete"); return; }
    setAdminBusy(true);
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/products?id=eq." + id, {
        method: "DELETE",
        headers: writeHeaders(),
      });
      if (!res.ok) { writeErrToast(res.status, "Delete failed"); return; }
      setProducts((ps) => ps.filter((p) => p.id !== id));
      if (form.id === id) setForm(blankForm);
      showToast("Product removed");
    } catch (e) {
      showToast("Network error — not deleted");
    } finally {
      setAdminBusy(false);
    }
  };

  const refreshFromDb = async () => {
    setAdminBusy(true);
    await loadProducts({ allowEmpty: true });
    setAdminBusy(false);
    showToast("Refreshed from database");
  };

  // Admin: upload a product image to the 'products' bucket, return its public URL.
  const uploadProductImage = async (file) => {
    if (auth.role !== "admin" || !session?.access_token) { showToast("Log in as admin"); return null; }
    if (!file || !file.type.startsWith("image/")) { showToast("Choose an image file"); return null; }
    if (file.size > 5 * 1024 * 1024) { showToast("Image must be under 5 MB"); return null; }
    setAdminBusy(true);
    try {
      const path = "p-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const up = await authedFetch(SUPABASE_URL + "/storage/v1/object/products/" + path, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + session.access_token, "content-type": file.type, "cache-control": "3600" },
        body: file,
      });
      if (!up.ok) { showToast(up.status === 401 || up.status === 403 ? "Session expired — log in again" : "Upload failed — is the 'products' bucket set up?"); return null; }
      return SUPABASE_URL + "/storage/v1/object/public/products/" + path;
    } catch (e) {
      showToast("Network error — not uploaded");
      return null;
    } finally {
      setAdminBusy(false);
    }
  };

  // Admin: bulk-import products from CSV text.
  // Headers: name, category, shape, price, original_price, colors, sizes, images,
  //          trending, tag, description, stock, size_stock
  // (colors/sizes separated by | or ; ; images separated by | ; trending = true/yes/1;
  //  size_stock like "S:5|M:0|L:3")
  const importProductsCsv = async (text) => {
    if (auth.role !== "admin" || !session?.access_token) { showToast("Log in as admin"); return; }
    const rows = parseCsv(text);
    if (rows.length < 2) { showToast("CSV looks empty or has no rows"); return; }
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (r, k) => { const i = header.indexOf(k); return i >= 0 ? (r[i] || "").trim() : ""; };
    const VALID_CATS = ["women", "men", "kids", "toys"];
    const VALID_SHAPES = ["dress", "tee", "shirt", "tunic", "jacket", "pants", "shorts", "overall", "toy"];
    let skipped = 0;
    const items = rows.slice(1).map((r) => {
      const name = col(r, "name");
      if (!name) return null;
      const cat = (col(r, "category") || "women").toLowerCase();
      if (!VALID_CATS.includes(cat)) { skipped += 1; return null; }  // unknown category → skip (would be unreachable in the shop)
      let shape = (col(r, "shape") || "tee").toLowerCase();
      if (!VALID_SHAPES.includes(shape)) shape = "tee";              // unknown shape → safe default
      const sizesRaw = col(r, "sizes");
      const sizes = sizesRaw ? sizesRaw.split(/[|;]/).map((s) => s.trim()).filter(Boolean) : (cat === "toys" ? ["Free"] : cat === "kids" ? K : ["pants", "shorts"].includes(shape) ? W : L);
      const colors = (col(r, "colors") || "#2563EB").split(/[|;]/).map((s) => s.trim()).filter(Boolean);
      const images = (col(r, "images") || col(r, "image_url")).split("|").map((s) => s.trim()).filter(Boolean);
      const stockRaw = col(r, "stock");
      // Per-size stock, e.g. "S:5|M:0|L:3" → { S:5, M:0, L:3 }
      const size_stock = {};
      const ssRaw = col(r, "size_stock");
      if (ssRaw) ssRaw.split(/[|;]/).forEach((pair) => { const [k, v] = pair.split(":").map((x) => (x || "").trim()); if (k && v !== "" && !isNaN(Number(v))) size_stock[k] = Number(v); });
      return {
        name, category: cat, shape,
        price: Number(col(r, "price")) || 0,
        original_price: col(r, "original_price") ? Number(col(r, "original_price")) : null,
        colors, sizes, images, image_url: images[0] || null,
        trending: /^(true|yes|1)$/i.test(col(r, "trending")),
        tag: col(r, "tag") || null,
        description: col(r, "description") || "",
        ...(stockRaw !== "" ? { stock: Number(stockRaw) } : {}),
        ...(Object.keys(size_stock).length ? { size_stock } : {}),
      };
    }).filter(Boolean);
    if (!items.length) { showToast(skipped ? `No valid rows — ${skipped} skipped (bad category)` : "No valid rows (each needs a name)"); return; }
    setAdminBusy(true);
    try {
      // Insert row by row so one bad row doesn't fail the whole batch (partial success).
      const results = await Promise.all(items.map(async (item) => {
        try {
          const r = await authedFetch(SUPABASE_URL + "/rest/v1/products", {
            method: "POST", headers: { ...writeHeaders(), Prefer: "return=minimal" },
            body: JSON.stringify(item),
          });
          return r.ok;
        } catch { return false; }
      }));
      const okCount = results.filter(Boolean).length;
      const failCount = results.length - okCount;
      await loadProducts({ allowEmpty: true });
      const parts = [`Imported ${okCount}`];
      if (failCount) parts.push(`${failCount} failed`);
      if (skipped) parts.push(`${skipped} skipped`);
      showToast(parts.join(" · "));
    } catch (e) {
      showToast("Network error — import failed");
    } finally {
      setAdminBusy(false);
    }
  };

  // ----- Delivery addresses (add / edit / delete / set default) -----
  const saveAddress = async (fields, id) => {
    const uid = session?.user?.id;
    if (!uid) { showToast("Log in to save addresses"); return false; }
    setAddrBusy(true);
    try {
      const body = { ...fields };
      let res, savedId = id;
      if (id) {
        res = await authedFetch(SUPABASE_URL + "/rest/v1/addresses?id=eq." + id, { method: "PATCH", headers: { ...writeHeaders(), Prefer: "return=representation" }, body: JSON.stringify(body) });
      } else {
        body.user_id = uid;
        res = await authedFetch(SUPABASE_URL + "/rest/v1/addresses", { method: "POST", headers: { ...writeHeaders(), Prefer: "return=representation" }, body: JSON.stringify(body) });
      }
      if (!res.ok) { showToast("Couldn't save address"); return false; }
      const rows = await res.json().catch(() => []);
      savedId = (Array.isArray(rows) && rows[0]?.id) || savedId;
      // if this one is the default, clear the flag on the others
      if (fields.is_default && savedId) {
        await authedFetch(SUPABASE_URL + "/rest/v1/addresses?user_id=eq." + uid + "&id=neq." + savedId, { method: "PATCH", headers: writeHeaders(), body: JSON.stringify({ is_default: false }) });
      }
      await loadAddresses();
      showToast(id ? "Address updated" : "Address added");
      return true;
    } catch (e) {
      showToast("Network error — not saved");
      return false;
    } finally {
      setAddrBusy(false);
    }
  };

  const deleteAddress = async (id) => {
    if (!session?.user?.id) return;
    setAddrBusy(true);
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/addresses?id=eq." + id, { method: "DELETE", headers: writeHeaders() });
      if (!res.ok) { showToast("Couldn't remove address"); return; }
      await loadAddresses();
      showToast("Address removed");
    } catch (e) {
      showToast("Network error");
    } finally {
      setAddrBusy(false);
    }
  };

  const makeDefaultAddress = async (id) => {
    const uid = session?.user?.id;
    if (!uid) return;
    // Optimistic + authoritative for the UI: flip the flags instantly and keep the
    // list order stable — no busy-disable, no refetch — so every click responds
    // immediately (rapid switches don't get swallowed by an in-flight request).
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    try {
      await authedFetch(SUPABASE_URL + "/rest/v1/addresses?user_id=eq." + uid, { method: "PATCH", headers: writeHeaders(), body: JSON.stringify({ is_default: false }) });
      await authedFetch(SUPABASE_URL + "/rest/v1/addresses?id=eq." + id, { method: "PATCH", headers: writeHeaders(), body: JSON.stringify({ is_default: true }) });
    } catch (e) { /* keep optimistic state; a later load re-syncs from the DB */ }
  };

  // Save the signed-in user's profile fields (name, phone, gender, dob, avatar_url…)
  const saveProfile = async (fields) => {
    const uid = session?.user?.id;
    if (!uid) { showToast("Log in to save your profile"); return false; }
    setProfileBusy(true);
    try {
      const res = await authedFetch(SUPABASE_URL + "/rest/v1/profiles?id=eq." + uid, {
        method: "PATCH",
        headers: { ...writeHeaders(), Prefer: "return=representation" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) { showToast("Couldn't save profile"); return false; }
      const rows = await res.json().catch(() => []);
      if (!(Array.isArray(rows) && rows[0])) { showToast("Couldn't save — profile not found"); return false; }
      setProfile(rows[0]);
      showToast("Profile saved");
      return true;
    } catch (e) {
      showToast("Network error — not saved");
      return false;
    } finally {
      setProfileBusy(false);
    }
  };

  const value = {
    // state
    products, setProducts, screen, setScreen, goBack, auth, setAuth, cart, setCart,
    orders, setOrders, hydrated, favorites, setFavorites, heroIndex, setHeroIndex,
    imgIndex, setImgIndex, authMode, setAuthMode, loginEmail, setLoginEmail,
    loginPassword, setLoginPassword, authErr, setAuthErr, authNotice, setAuthNotice,
    authBusy, session, rememberMe, setRememberMe, adminBusy, returnTo, setReturnTo, profile, setProfile, profileBusy, avatarBusy,
    addresses, addrBusy, defaultAddress,
    myOrders, adminOrders, ordersBusy,
    selProduct, setSelProduct, selectedOrder, setSelectedOrder, openOrder, quickAdd, setQuickAdd,
    selColor, setSelColor, selSize, setSelSize, selCategory, setSelCategory,
    query, setQuery, toast, legalPage, openLegal, coName, setCoName, coPhone, setCoPhone, coEmail, setCoEmail, coNote, setCoNote, giftWrap, setGiftWrap, paymentMethod, setPaymentMethod,
    coupon, couponMsg, setCouponMsg,
    lastOrder, placingOrder, form, setForm, blankForm,
    // derived
    cartCount, bill,
    buyNowItem, setBuyNowItem, checkoutItems, checkoutCount, checkoutBill,
    // actions
    showToast, goToLogin, applySession, handleAuth,
    applyCoupon, removeCoupon,
    requestPasswordReset, setNewPassword, updateAccount, openProduct, closeProduct,
    openQuickAdd, closeQuickAdd,
    toggleFav, isFav, addToCart, buyNow, changeBuyNowQty, changeQty, removeItem, placeOrder, logout,
    saveProduct, editProduct, deleteProduct, refreshFromDb, loadProducts,
    uploadProductImage, importProductsCsv,
    loadProfile, saveProfile, uploadAvatar,
    loadAddresses, saveAddress, deleteAddress, makeDefaultAddress,
    loadMyOrders, loadAdminOrders, updateOrderStatus, cancelRefundOrder,
    productReviews, loadProductReviews, canReview, submitReview,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
