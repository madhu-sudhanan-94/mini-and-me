import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ADMIN_EMAIL, SUPABASE_URL, SUPABASE_KEY, SB_HEADERS, mapDbProduct,
  authSignUp, authSignIn, authRefresh, authSignOut, authErrText,
} from "./lib/supabase.js";
import { PKEY, OKEY, CKEY, FKEY, AKEY, sget, sset } from "./lib/storage.js";
import { INITIAL_PRODUCTS, L, W, K } from "./data/products.js";

// Temporary demo phone login. Real SMS OTP needs a paid provider (roadmap).
const DEMO_OTP = "1234";

/*
  StoreProvider holds ALL of the app's state and actions (what used to live in
  the single App component). Screens/components read it with the useStore() hook,
  so each screen can live in its own file without prop-drilling.
*/
const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [screen, setScreen] = useState("home"); // open on the store; login only when needed
  const [auth, setAuth] = useState({ role: "guest", id: null });
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [imgIndex, setImgIndex] = useState(0);

  const [loginTab, setLoginTab] = useState("email"); // email | phone
  const [loginPhone, setLoginPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpErr, setOtpErr] = useState("");
  const [authMode, setAuthMode] = useState("login"); // login | signup
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [session, setSession] = useState(null); // { access_token, refresh_token, user }
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
  const [selColor, setSelColor] = useState(null);
  const [selSize, setSelSize] = useState(null);

  const [selCategory, setSelCategory] = useState("women");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [legalPage, setLegalPage] = useState("privacy"); // which policy the Legal screen shows

  // checkout
  const [coName, setCoName] = useState("");
  const [coPhone, setCoPhone] = useState("");
  const [coEmail, setCoEmail] = useState("");
  const [lastOrder, setLastOrder] = useState(null);

  // admin form
  const blankForm = { id: null, name: "", cat: "women", shape: "dress", price: "", original: "", color: "#2563EB", image: "", trending: false };
  const [form, setForm] = useState(blankForm);

  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0] || null;

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => {
    const p = products.find((x) => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

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

  // Load live products from Supabase (falls back to samples if unreachable)
  const loadProducts = async ({ allowEmpty = false } = {}) => {
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/products?select=*&order=id.asc", { headers: SB_HEADERS });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && (rows.length || allowEmpty)) setProducts(rows.map(mapDbProduct));
      }
    } catch (e) { /* offline / not hosted yet — keep local sample data */ }
  };
  useEffect(() => { loadProducts(); }, []);

  // Load the signed-in user's profile row whenever the session changes
  const loadProfile = async () => {
    const uid = session?.user?.id;
    if (!uid) { setProfile(null); return; }
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/profiles?id=eq." + uid + "&select=*", { headers: writeHeaders() });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]) setProfile(rows[0]);
      }
    } catch (e) { /* offline — keep whatever we have */ }
  };
  useEffect(() => { loadProfile(); }, [session?.user?.id]);

  // Load the signed-in user's delivery addresses (default first)
  const loadAddresses = async () => {
    const uid = session?.user?.id;
    if (!uid) { setAddresses([]); return; }
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/addresses?user_id=eq." + uid + "&select=*&order=is_default.desc,created_at.desc", { headers: writeHeaders() });
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
      const res = await fetch(SUPABASE_URL + "/rest/v1/orders?user_id=eq." + uid + "&select=*,order_items(*)&order=created_at.desc", { headers: writeHeaders() });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) setMyOrders(rows);
      }
    } catch (e) { /* offline */ }
  };
  useEffect(() => { loadMyOrders(); }, [session?.user?.id]);

  // Admin: read & manage ALL orders
  const loadAdminOrders = async () => {
    if (auth.role !== "admin" || !session?.access_token) return;
    setOrdersBusy(true);
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/orders?select=*,order_items(*)&order=created_at.desc", { headers: writeHeaders() });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) setAdminOrders(rows);
      }
    } catch (e) { /* offline */ }
    finally { setOrdersBusy(false); }
  };
  const updateOrderStatus = async (id, status) => {
    if (auth.role !== "admin" || !session?.access_token) return;
    setOrdersBusy(true);
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/orders?id=eq." + id, {
        method: "PATCH",
        headers: { ...writeHeaders(), Prefer: "return=representation" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { showToast("Couldn't update status"); return; }
      setAdminOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
      showToast("Order marked " + status);
    } catch (e) { showToast("Network error"); }
    finally { setOrdersBusy(false); }
  };

  // Restore a saved login session on load (refresh the token so it stays valid)
  useEffect(() => {
    (async () => {
      const raw = await sget(AKEY, false);
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
          await sset(AKEY, "", false);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => { if (hydrated) sset(PKEY, JSON.stringify(products), true); }, [products, hydrated]);
  useEffect(() => { if (hydrated) sset(OKEY, JSON.stringify(orders), true); }, [orders, hydrated]);
  useEffect(() => { if (hydrated) sset(CKEY, JSON.stringify(cart), false); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) sset(FKEY, JSON.stringify(favorites), false); }, [favorites, hydrated]);
  useEffect(() => { if (hydrated) sset(AKEY, session ? JSON.stringify(session) : "", false); }, [session, hydrated]);

  // Auto-rotate the home hero
  useEffect(() => {
    if (screen !== "home") return;
    const t = setInterval(() => setHeroIndex((i) => i + 1), 4000);
    return () => clearInterval(t);
  }, [screen]);

  /* ---------- actions ---------- */
  // Send a guest to the login screen, remembering where to bring them back
  const goToLogin = (target) => {
    setReturnTo(target || null);
    setAuthErr(""); setAuthNotice(""); setAuthMode("login");
    setLoginTab("email"); setOtp(""); setOtpSent(false); setOtpErr("");
    setScreen("login");
  };

  /* ---------- demo phone login (temporary, code 1234) ---------- */
  const sendPhoneOtp = () => {
    setOtpErr("");
    const digits = loginPhone.replace(/\D/g, "");
    if (digits.length < 8) { setOtpErr("Enter a valid phone number."); return; }
    setOtp("");
    setOtpSent(true);
  };
  const resetPhoneLogin = () => { setOtpSent(false); setOtp(""); setOtpErr(""); };

  const openLegal = (key) => { setLegalPage(key); setScreen("legal"); };
  const verifyPhoneOtp = () => {
    if (otp !== DEMO_OTP) { setOtpErr("Incorrect code. For this demo, use " + DEMO_OTP + "."); return; }
    const phone = loginPhone.trim();
    setAuth({ role: "customer", id: phone, uid: null });
    setLoginPhone(""); setOtp(""); setOtpSent(false); setOtpErr("");
    const dest = returnTo || "home";
    setReturnTo(null);
    setScreen(dest);
  };

  const applySession = (data) => {
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

  const openProduct = (p) => {
    setSelProduct(p);
    setSelColor(p.colors[0]);
    setSelSize(p.sizes[0]);
    setImgIndex(0);
  };
  const closeProduct = () => setSelProduct(null);
  const toggleFav = (id) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const isFav = (id) => favorites.includes(id);

  const addToCart = (p, size, color) => {
    setCart((prev) => {
      const i = prev.findIndex((x) => x.id === p.id && x.size === size && x.color === color);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + 1 };
        return copy;
      }
      return [...prev, { id: p.id, size, color, qty: 1 }];
    });
    showToast(`Added ${p.name} (${size})`);
  };

  const changeQty = (idx, d) => {
    setCart((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + d };
      if (copy[idx].qty <= 0) copy.splice(idx, 1);
      return copy;
    });
  };
  const removeItem = (idx) => setCart((prev) => prev.filter((_, i) => i !== idx));

  const saveOrderToDb = async (order, items, phone, email, extra = {}) => {
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/orders", {
        method: "POST",
        headers: { ...writeHeaders(), Prefer: "return=representation" },
        body: JSON.stringify({
          customer_name: order.name, customer_phone: phone, customer_email: email,
          total: order.total, status: "placed",
          ref: order.id,
          user_id: extra.userId || null,
          shipping_address: extra.shipping || null,
        }),
      });
      if (!res.ok) { showToast("Order saved on this device — couldn't sync to the server"); return; }
      const rows = await res.json();
      const dbId = rows && rows[0] && rows[0].id;
      if (!dbId || !items.length) return;
      await fetch(SUPABASE_URL + "/rest/v1/order_items", {
        method: "POST",
        headers: writeHeaders(),
        body: JSON.stringify(items.map((it) => ({ ...it, order_id: dbId }))),
      });
      if (extra.userId) loadMyOrders();
    } catch (e) { showToast("Order saved on this device — couldn't sync to the server"); }
  };

  const placeOrder = () => {
    if (!coName.trim() || (!coPhone.trim() && !coEmail.trim())) return;
    const order = {
      id: "PP" + Math.floor(100000 + Math.random() * 900000),
      total: cartTotal,
      count: cartCount,
      name: coName.trim(),
      contact: coPhone.trim() || coEmail.trim(),
      ts: Date.now(),
    };
    const itemsSnapshot = cart.map((it) => {
      const p = products.find((x) => x.id === it.id);
      return { product_id: it.id, product_name: p ? p.name : "Item", size: it.size, color: it.color, unit_price: p ? p.price : 0, qty: it.qty };
    });
    // snapshot the delivery address onto the order so past orders keep the right destination
    const a = defaultAddress;
    const shipping = a ? {
      label: a.label, full_name: a.full_name, phone: a.phone,
      line1: a.line1, line2: a.line2, area: a.area, city: a.city,
      state: a.state, pincode: a.pincode, country: a.country,
    } : null;
    saveOrderToDb(order, itemsSnapshot, coPhone.trim() || null, coEmail.trim() || null, { userId: session?.user?.id || null, shipping });
    setOrders((o) => [{ ...order, status: "placed", shipping, items: itemsSnapshot }, ...o]);
    setLastOrder(order);
    setCart([]);
    setCoName(""); setCoPhone(""); setCoEmail("");
    setScreen("success");
  };

  const logout = () => {
    if (session?.access_token) authSignOut(session.access_token);
    setSession(null);
    setProfile(null);
    setAddresses([]);
    setMyOrders([]);
    setAdminOrders([]);
    setAuth({ role: "guest", id: null });
    setReturnTo(null);
    setLoginEmail(""); setLoginPassword(""); setAuthErr(""); setAuthNotice(""); setAuthMode("login");
    setLoginTab("email"); setLoginPhone(""); setOtp(""); setOtpSent(false); setOtpErr("");
    setScreen("home"); // back to the store as a guest, not the login wall
  };

  const writeErrToast = (status, fallback) =>
    showToast(status === 401 || status === 403 ? "Not allowed — log in as admin first" : fallback);

  const saveProduct = async () => {
    if (!form.name.trim() || !form.price) return;
    if (auth.role !== "admin" || !session?.access_token) { showToast("Log in as admin to save"); return; }
    const sizes = form.cat === "kids" ? K : ["pants", "shorts"].includes(form.shape) ? W : L;
    const body = {
      name: form.name.trim(),
      category: form.cat,
      shape: form.shape,
      price: Number(form.price),
      original_price: form.original ? Number(form.original) : null,
      colors: form.id ? [form.color, ...((form._colors || []).slice(1))] : [form.color],
      sizes,
      trending: !!form.trending,
      image_url: form.image.trim() || null,
    };
    setAdminBusy(true);
    try {
      let res;
      if (form.id) {
        res = await fetch(SUPABASE_URL + "/rest/v1/products?id=eq." + form.id, {
          method: "PATCH",
          headers: { ...writeHeaders(), Prefer: "return=representation" },
          body: JSON.stringify(body),
        });
      } else {
        body.description = "Added by admin.";
        res = await fetch(SUPABASE_URL + "/rest/v1/products", {
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
      const up = await fetch(SUPABASE_URL + "/storage/v1/object/avatars/" + path, {
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
      const res = await fetch(SUPABASE_URL + "/rest/v1/profiles?id=eq." + uid, {
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
    color: p.colors[0], _colors: p.colors, image: (p.images && p.images[0]) || "", trending: !!p.trending,
  });

  const deleteProduct = async (id) => {
    if (auth.role !== "admin" || !session?.access_token) { showToast("Log in as admin to delete"); return; }
    setAdminBusy(true);
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/products?id=eq." + id, {
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

  // ----- Delivery addresses (add / edit / delete / set default) -----
  const saveAddress = async (fields, id) => {
    const uid = session?.user?.id;
    if (!uid) { showToast("Log in to save addresses"); return false; }
    setAddrBusy(true);
    try {
      const body = { ...fields };
      let res, savedId = id;
      if (id) {
        res = await fetch(SUPABASE_URL + "/rest/v1/addresses?id=eq." + id, { method: "PATCH", headers: { ...writeHeaders(), Prefer: "return=representation" }, body: JSON.stringify(body) });
      } else {
        body.user_id = uid;
        res = await fetch(SUPABASE_URL + "/rest/v1/addresses", { method: "POST", headers: { ...writeHeaders(), Prefer: "return=representation" }, body: JSON.stringify(body) });
      }
      if (!res.ok) { showToast("Couldn't save address"); return false; }
      const rows = await res.json().catch(() => []);
      savedId = (Array.isArray(rows) && rows[0]?.id) || savedId;
      // if this one is the default, clear the flag on the others
      if (fields.is_default && savedId) {
        await fetch(SUPABASE_URL + "/rest/v1/addresses?user_id=eq." + uid + "&id=neq." + savedId, { method: "PATCH", headers: writeHeaders(), body: JSON.stringify({ is_default: false }) });
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
      const res = await fetch(SUPABASE_URL + "/rest/v1/addresses?id=eq." + id, { method: "DELETE", headers: writeHeaders() });
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
    setAddrBusy(true);
    try {
      await fetch(SUPABASE_URL + "/rest/v1/addresses?user_id=eq." + uid, { method: "PATCH", headers: writeHeaders(), body: JSON.stringify({ is_default: false }) });
      await fetch(SUPABASE_URL + "/rest/v1/addresses?id=eq." + id, { method: "PATCH", headers: writeHeaders(), body: JSON.stringify({ is_default: true }) });
      await loadAddresses();
    } catch (e) { /* ignore */ }
    finally { setAddrBusy(false); }
  };

  // Save the signed-in user's profile fields (name, phone, gender, dob, avatar_url…)
  const saveProfile = async (fields) => {
    const uid = session?.user?.id;
    if (!uid) { showToast("Log in to save your profile"); return false; }
    setProfileBusy(true);
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/profiles?id=eq." + uid, {
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
    products, setProducts, screen, setScreen, auth, setAuth, cart, setCart,
    orders, setOrders, hydrated, favorites, setFavorites, heroIndex, setHeroIndex,
    imgIndex, setImgIndex, authMode, setAuthMode, loginEmail, setLoginEmail,
    loginPassword, setLoginPassword, authErr, setAuthErr, authNotice, setAuthNotice,
    loginTab, setLoginTab, loginPhone, setLoginPhone, otp, setOtp, otpSent, otpErr,
    authBusy, session, adminBusy, returnTo, setReturnTo, profile, setProfile, profileBusy, avatarBusy,
    addresses, addrBusy, defaultAddress,
    myOrders, adminOrders, ordersBusy,
    selProduct, setSelProduct,
    selColor, setSelColor, selSize, setSelSize, selCategory, setSelCategory,
    query, setQuery, toast, legalPage, openLegal, coName, setCoName, coPhone, setCoPhone, coEmail, setCoEmail,
    lastOrder, form, setForm, blankForm,
    // derived
    cartCount, cartTotal,
    // actions
    showToast, goToLogin, sendPhoneOtp, verifyPhoneOtp, resetPhoneLogin, applySession, handleAuth, openProduct, closeProduct,
    toggleFav, isFav, addToCart, changeQty, removeItem, placeOrder, logout,
    saveProduct, editProduct, deleteProduct, refreshFromDb, loadProducts,
    loadProfile, saveProfile, uploadAvatar,
    loadAddresses, saveAddress, deleteAddress, makeDefaultAddress,
    loadMyOrders, loadAdminOrders, updateOrderStatus,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
