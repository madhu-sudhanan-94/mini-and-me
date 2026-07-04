import React, { useState, useEffect } from "react";
import {
  Search, ShoppingCart, ChevronLeft, ChevronRight, Plus, Minus, Trash2,
  User, Home, LayoutGrid, Check, Phone, Mail, LogOut, Package,
  Edit3, X, Star, Shield, ArrowRight, Heart, Sparkles
} from "lucide-react";
import { BRAND } from "./brand.config.js";

// Brand logo mark (defined once in src/brand.config.js)
const Logo = BRAND.logo;

/* ============================ Helpers ============================ */
const ADMIN_EMAIL = "madhusudhanana94@gmail.com";

/* ---------- Supabase (your live database) ---------- */
const SUPABASE_URL = "https://sakzhdoxybxmeepzplkr.supabase.co";
const SUPABASE_KEY = "sb_publishable_6SgjTXE1CdM6dnOPrQtS2A_LVZeC0xj";
const SB_HEADERS = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" };
function mapDbProduct(r) {
  return {
    id: r.id,
    name: r.name,
    cat: r.category,
    shape: r.shape,
    price: r.price,
    original: r.original_price || undefined,
    colors: (r.colors && r.colors.length) ? r.colors : ["#2563EB"],
    sizes: (r.sizes && r.sizes.length) ? r.sizes : ["Free"],
    desc: r.description || "",
    trending: !!r.trending,
    tag: r.tag || undefined,
    images: r.image_url ? [r.image_url] : [],
  };
}
/* ---------- Supabase Auth (real email + password login) ---------- */
const SUPA_AUTH = SUPABASE_URL + "/auth/v1";
const ANON_HEADERS = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };

async function authSignUp(email, password) {
  const res = await fetch(SUPA_AUTH + "/signup", { method: "POST", headers: ANON_HEADERS, body: JSON.stringify({ email, password }) });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}
async function authSignIn(email, password) {
  const res = await fetch(SUPA_AUTH + "/token?grant_type=password", { method: "POST", headers: ANON_HEADERS, body: JSON.stringify({ email, password }) });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}
async function authRefresh(refresh_token) {
  try {
    const res = await fetch(SUPA_AUTH + "/token?grant_type=refresh_token", { method: "POST", headers: ANON_HEADERS, body: JSON.stringify({ refresh_token }) });
    return res.ok ? await res.json().catch(() => null) : null;
  } catch { return null; }
}
async function authSignOut(token) {
  try { await fetch(SUPA_AUTH + "/logout", { method: "POST", headers: { ...ANON_HEADERS, Authorization: "Bearer " + token } }); } catch {}
}
function authErrText(data) {
  return data?.error_description || data?.msg || data?.error || data?.message || "Something went wrong. Please try again.";
}

const formatINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = p < 0 ? 0 : 255, a = Math.abs(p);
  r = Math.round((t - r) * a + r);
  g = Math.round((t - g) * a + g);
  b = Math.round((t - b) * a + b);
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

const CAT_LABEL = { women: "Women", men: "Men", kids: "Kids" };

/* ============================ Persistent storage (safe + optional) ============================ */
const PKEY = "vk_products_v1";
const OKEY = "vk_orders_v1";
const CKEY = "vk_cart_v1";
const FKEY = "vk_favs_v1";
const AKEY = "vk_session_v1";
async function sget(key, shared) {
  try {
    if (typeof window === "undefined" || !window.storage) return null;
    const r = await window.storage.get(key, shared);
    return r ? r.value : null;
  } catch { return null; }
}
async function sset(key, value, shared) {
  try {
    if (typeof window === "undefined" || !window.storage) return;
    await window.storage.set(key, value, shared);
  } catch {}
}

/* ============================ Garment illustration ============================ */
function Garment({ shape, color, className = "", style = {} }) {
  const dark = shade(color, -0.17);
  const light = shade(color, 0.22);
  const s = {
    filter: "drop-shadow(0 8px 10px rgba(2,6,23,0.14))",
    ...style,
  };
  let body = null;

  if (shape === "dress") {
    body = (
      <>
        <path d="M40 20 L42 30 M60 20 L58 30" stroke={dark} strokeWidth="3.2" strokeLinecap="round" opacity="0.6" />
        <path d="M34 28 C42 40 58 40 66 28 L70 72 L88 112 Q50 123 12 112 L30 72 Z" fill={color} />
        <path d="M50 40 L50 72" stroke={light} strokeWidth="1.6" opacity="0.4" />
        <path d="M30 72 Q50 80 70 72" stroke={dark} strokeWidth="2" fill="none" opacity="0.45" />
        <path d="M12 112 Q50 123 88 112" stroke={dark} strokeWidth="2.4" fill="none" opacity="0.4" />
      </>
    );
  } else if (shape === "tee") {
    body = (
      <>
        <path d="M30 40 L14 54 L22 64 L30 53 Z" fill={color} />
        <path d="M70 40 L86 54 L78 64 L70 53 Z" fill={color} />
        <path d="M30 40 L70 40 L73 100 L27 100 Z" fill={color} />
        <path d="M40 40 C44 49 56 49 60 40" stroke={dark} strokeWidth="2.4" fill="none" opacity="0.55" />
        <path d="M50 49 L50 100" stroke={light} strokeWidth="1.4" opacity="0.35" />
      </>
    );
  } else if (shape === "shirt") {
    body = (
      <>
        <path d="M30 42 L12 66 L20 76 L30 62 Z" fill={color} />
        <path d="M70 42 L88 66 L80 76 L70 62 Z" fill={color} />
        <path d="M30 42 L70 42 L73 106 L27 106 Z" fill={color} />
        <path d="M44 42 L50 52 L40 48 Z" fill={dark} opacity="0.8" />
        <path d="M56 42 L50 52 L60 48 Z" fill={dark} opacity="0.8" />
        <path d="M50 52 L50 106" stroke={dark} strokeWidth="1.6" opacity="0.5" />
        <circle cx="50" cy="64" r="1.7" fill={dark} opacity="0.7" />
        <circle cx="50" cy="78" r="1.7" fill={dark} opacity="0.7" />
        <circle cx="50" cy="92" r="1.7" fill={dark} opacity="0.7" />
        <rect x="33" y="62" width="11" height="12" rx="1.5" fill={dark} opacity="0.18" />
      </>
    );
  } else if (shape === "tunic") {
    body = (
      <>
        <path d="M30 38 L14 58 L22 68 L30 55 Z" fill={color} />
        <path d="M70 38 L86 58 L78 68 L70 55 Z" fill={color} />
        <path d="M30 38 L70 38 L72 114 L28 114 Z" fill={color} />
        <path d="M44 38 C46 47 54 47 56 38" stroke={dark} strokeWidth="2.2" fill="none" opacity="0.55" />
        <path d="M50 44 L50 64" stroke={dark} strokeWidth="1.6" opacity="0.5" />
        <path d="M50 47 L46 56 M50 47 L54 56" stroke={dark} strokeWidth="1.2" opacity="0.4" />
        <path d="M30 100 L30 114 M70 100 L70 114" stroke={dark} strokeWidth="1.6" opacity="0.3" />
      </>
    );
  } else if (shape === "jacket") {
    body = (
      <>
        <path d="M30 42 L12 66 L20 76 L30 62 Z" fill={color} />
        <path d="M70 42 L88 66 L80 76 L70 62 Z" fill={color} />
        <path d="M30 42 L49 42 L47 106 L28 106 Z" fill={color} />
        <path d="M70 42 L51 42 L53 106 L72 106 Z" fill={color} />
        <path d="M40 42 L49 42 L44 56 Z" fill={dark} opacity="0.75" />
        <path d="M60 42 L51 42 L56 56 Z" fill={dark} opacity="0.75" />
        <path d="M50 44 L50 106" stroke={dark} strokeWidth="2" strokeDasharray="2 3" opacity="0.7" />
      </>
    );
  } else if (shape === "pants" || shape === "shorts") {
    const legBottom = shape === "shorts" ? 78 : 110;
    body = (
      <>
        <path d={`M28 32 L72 32 L72 44 L60 ${legBottom} L52 ${legBottom} L50 64 L48 ${legBottom} L40 ${legBottom} L28 44 Z`} fill={color} />
        <path d="M28 44 L72 44" stroke={dark} strokeWidth="2" opacity="0.5" />
        <rect x="28" y="30" width="44" height="4" rx="2" fill={dark} opacity="0.55" />
        <path d="M40 50 L40 60" stroke={light} strokeWidth="1.4" opacity="0.4" />
        <path d="M60 50 L60 60" stroke={light} strokeWidth="1.4" opacity="0.4" />
      </>
    );
  } else if (shape === "overall") {
    body = (
      <>
        <path d="M40 40 L34 24 M60 40 L66 24" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M40 40 L60 40 L60 58 L40 58 Z" fill={color} />
        <path d="M30 58 L70 58 L68 98 L52 98 L50 74 L48 98 L32 98 Z" fill={color} />
        <rect x="30" y="56" width="40" height="4" rx="2" fill={dark} opacity="0.5" />
        <circle cx="45" cy="48" r="2" fill={dark} opacity="0.6" />
        <circle cx="55" cy="48" r="2" fill={dark} opacity="0.6" />
      </>
    );
  }

  return (
    <svg viewBox="0 0 100 120" className={className} style={s} role="img" aria-hidden="true">
      {body}
    </svg>
  );
}

/* ============================ Product image (photo, illustration fallback) ============================ */
function ProductImage({ p, color, index = 0 }) {
  const [failed, setFailed] = useState(false);
  const src = p.images ? p.images[index] : null;
  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Garment shape={p.shape} color={color || p.colors[0]} className="h-[80%]" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={p.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

/* ============================ Catalog ============================ */
const L = ["S", "M", "L", "XL", "XXL"];
const W = ["28", "30", "32", "34", "36"];
const K = ["2Y", "4Y", "6Y", "8Y"];

const INITIAL_PRODUCTS = [
  // ---------------- WOMEN ----------------
  { id: 1, images: ["https://images.unsplash.com/photo-1678801868819-4e17d4ea7cde?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1601762603339-fd61e28b698a?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Anarkali Floral Dress", cat: "women", shape: "dress", price: 1899, original: 2499, colors: ["#D9466E", "#7C3AED", "#0EA5E9"], sizes: L, trending: true, desc: "Flowy floral anarkali made for festive evenings." },
  { id: 2, images: ["https://images.unsplash.com/photo-1571513722275-4b41940f54b8?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1601762603339-fd61e28b698a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Indigo Denim Jacket", cat: "women", shape: "jacket", price: 1499, original: 1999, colors: ["#3B5BA5", "#1E293B", "#2563EB"], sizes: L, desc: "Classic indigo denim with a relaxed fit." },
  { id: 3, images: ["https://images.unsplash.com/photo-1601762603339-fd61e28b698a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Cotton Kurti", cat: "women", shape: "tunic", price: 799, original: 1099, colors: ["#0E9F8E", "#E11D48", "#F59E0B"], sizes: L, trending: true, desc: "Breathable everyday kurti in soft cotton." },
  { id: 4, images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "High-Waist Mom Jeans", cat: "women", shape: "pants", price: 1299, original: 1799, colors: ["#3949AB", "#111827"], sizes: W, desc: "High-rise mom jeans with a vintage wash." },
  { id: 5, images: ["https://images.unsplash.com/photo-1574015974293-817f0ebebb74?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1678801868819-4e17d4ea7cde?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Chiffon Maxi Dress", cat: "women", shape: "dress", price: 2199, colors: ["#FB7185", "#0EA5E9", "#10B981"], sizes: L, desc: "Lightweight chiffon maxi that flows beautifully." },
  { id: 6, images: ["https://images.unsplash.com/photo-1678801868819-4e17d4ea7cde?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1601762603339-fd61e28b698a?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Bandhani Saree", cat: "women", shape: "dress", price: 2499, original: 3299, colors: ["#DB2777", "#7C3AED", "#F59E0B"], sizes: ["Free"], trending: true, desc: "Traditional bandhani saree in vivid hues." },
  { id: 7, images: ["https://images.unsplash.com/photo-1558769132-cb1aea458c5e?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1678801868819-4e17d4ea7cde?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Ribbed Crop Top", cat: "women", shape: "tee", price: 599, colors: ["#F59E0B", "#111827", "#E5E7EB"], sizes: L, tag: "new", desc: "Stretchy ribbed crop for easy layering." },
  { id: 8, images: ["https://images.unsplash.com/photo-1571513722275-4b41940f54b8?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1601762603339-fd61e28b698a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "A-Line Midi Dress", cat: "women", shape: "dress", price: 1599, original: 2099, colors: ["#1E3A8A", "#0EA5E9", "#DB2777"], sizes: L, desc: "Clean A-line midi for work or weekends." },
  { id: 9, images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Palazzo Pants", cat: "women", shape: "pants", price: 899, colors: ["#4D7C0F", "#111827", "#0EA5E9"], sizes: L, desc: "Wide-leg palazzos, breezy and comfortable." },
  { id: 10, images: ["https://images.unsplash.com/photo-1601762603339-fd61e28b698a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Wrap Dress", cat: "women", shape: "dress", price: 1799, colors: ["#6D28D9", "#DB2777", "#0EA5E9"], sizes: L, trending: true, desc: "Flattering wrap dress that ties to fit." },

  // ---------------- MEN ----------------
  { id: 11, images: ["https://images.unsplash.com/photo-1507680434567-5739c80be1ac?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Oxford Shirt", cat: "men", shape: "shirt", price: 1199, original: 1599, colors: ["#60A5FA", "#E5E7EB", "#1E293B"], sizes: L, trending: true, desc: "Crisp oxford shirt for smart-casual days." },
  { id: 12, images: ["https://images.unsplash.com/photo-1622519407650-3df9883f76a5?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Slim-Fit Jeans", cat: "men", shape: "pants", price: 1499, original: 1999, colors: ["#1E3A8A", "#111827", "#3B82F6"], sizes: W, desc: "Slim-fit stretch denim that moves with you." },
  { id: 13, images: ["https://images.unsplash.com/photo-1618886614638-80e3c103d31a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Cotton Kurta", cat: "men", shape: "tunic", price: 999, original: 1399, colors: ["#E5E7EB", "#0E9F8E", "#1E293B"], sizes: L, desc: "Handsome cotton kurta for festive wear." },
  { id: 14, images: ["https://images.unsplash.com/photo-1622519407650-3df9883f76a5?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Graphic T-Shirt", cat: "men", shape: "tee", price: 599, colors: ["#111827", "#DC2626", "#2563EB"], sizes: L, tag: "new", desc: "Soft cotton tee with a bold print." },
  { id: 15, images: ["https://images.unsplash.com/photo-1507680434567-5739c80be1ac?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Linen Casual Shirt", cat: "men", shape: "shirt", price: 1399, colors: ["#84CC16", "#0EA5E9", "#E5E7EB"], sizes: L, trending: true, desc: "Airy linen shirt for warm weather." },
  { id: 16, images: ["https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Bomber Jacket", cat: "men", shape: "jacket", price: 2299, original: 2999, colors: ["#4D7C0F", "#111827", "#1D4ED8"], sizes: L, desc: "Street-ready bomber with ribbed cuffs." },
  { id: 17, images: ["https://images.unsplash.com/photo-1622519407650-3df9883f76a5?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Chino Trousers", cat: "men", shape: "pants", price: 1299, colors: ["#A16207", "#1E293B", "#0E7490"], sizes: W, desc: "Versatile chinos in a tailored cut." },
  { id: 18, images: ["https://images.unsplash.com/photo-1622519407650-3df9883f76a5?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Polo T-Shirt", cat: "men", shape: "tee", price: 799, original: 1099, colors: ["#1E3A8A", "#DC2626", "#15803D"], sizes: L, desc: "Classic pique polo, easy and neat." },
  { id: 19, images: ["https://images.unsplash.com/photo-1618886614638-80e3c103d31a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Denim Jacket", cat: "men", shape: "jacket", price: 1899, colors: ["#3B82F6", "#1E293B"], sizes: L, trending: true, desc: "Rugged denim jacket, a wardrobe staple." },
  { id: 20, images: ["https://images.unsplash.com/photo-1622519407650-3df9883f76a5?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Henley T-Shirt", cat: "men", shape: "tee", price: 699, colors: ["#7F1D1D", "#111827", "#0E7490"], sizes: L, desc: "Button-placket henley in soft jersey." },

  // ---------------- KIDS ----------------
  { id: 21, images: ["https://images.unsplash.com/photo-1578897367107-2828e351c8a8?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1590480598135-3be152c87913?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Frock Party Dress", cat: "kids", shape: "dress", price: 899, original: 1199, colors: ["#EC4899", "#A855F7", "#F59E0B"], sizes: K, trending: true, desc: "Twirly party frock for little stars." },
  { id: 22, images: ["https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1611428813653-aa606c998586?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Dungaree Set", cat: "kids", shape: "overall", price: 799, colors: ["#3B82F6", "#DC2626", "#0E9F8E"], sizes: K, tag: "new", desc: "Playful dungarees built for adventures." },
  { id: 23, images: ["https://images.unsplash.com/photo-1611428813653-aa606c998586?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1578897367107-2828e351c8a8?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Cartoon T-Shirt", cat: "kids", shape: "tee", price: 399, colors: ["#FACC15", "#3B82F6", "#EF4444"], sizes: K, trending: true, desc: "Fun cartoon tee in soft cotton." },
  { id: 24, images: ["https://images.unsplash.com/photo-1590480598135-3be152c87913?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1611428813653-aa606c998586?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Ethnic Kurta Set", cat: "kids", shape: "tunic", price: 999, original: 1299, colors: ["#F97316", "#0E9F8E", "#DB2777"], sizes: K, desc: "Festive kurta set for celebrations." },
  { id: 25, images: ["https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1578897367107-2828e351c8a8?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1590480598135-3be152c87913?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Denim Shorts", cat: "kids", shape: "shorts", price: 499, colors: ["#3B82F6", "#1E293B"], sizes: K, desc: "Comfy denim shorts for playtime." },
  { id: 26, images: ["https://images.unsplash.com/photo-1578897367107-2828e351c8a8?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1590480598135-3be152c87913?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Tutu Dress", cat: "kids", shape: "dress", price: 699, colors: ["#C084FC", "#F472B6", "#38BDF8"], sizes: K, trending: true, desc: "Fluffy tutu dress made for spinning." },
  { id: 27, images: ["https://images.unsplash.com/photo-1611428813653-aa606c998586?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1578897367107-2828e351c8a8?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Striped T-Shirt", cat: "kids", shape: "tee", price: 349, colors: ["#EF4444", "#3B82F6", "#22C55E"], sizes: K, desc: "Everyday striped tee, soft and durable." },
  { id: 28, images: ["https://images.unsplash.com/photo-1578897367107-2828e351c8a8?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1590480598135-3be152c87913?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Pinafore Dress", cat: "kids", shape: "dress", price: 749, original: 999, colors: ["#F59E0B", "#EC4899", "#0EA5E9"], sizes: K, desc: "Sweet pinafore that layers over tops." },
  { id: 29, images: ["https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1578897367107-2828e351c8a8?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1590480598135-3be152c87913?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Track Pants", cat: "kids", shape: "pants", price: 599, colors: ["#6B7280", "#1E293B", "#2563EB"], sizes: K, desc: "Stretchy track pants for active kids." },
  { id: 30, images: ["https://images.unsplash.com/photo-1590480598135-3be152c87913?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?fm=jpg&q=70&w=600&auto=format&fit=crop", "https://images.unsplash.com/photo-1611428813653-aa606c998586?fm=jpg&q=70&w=600&auto=format&fit=crop"], name: "Floral Romper", cat: "kids", shape: "overall", price: 649, colors: ["#FB7185", "#F59E0B", "#34D399"], sizes: K, desc: "Breezy floral romper for sunny days." },
];

const DOT =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Ccircle cx='2' cy='2' r='1.4' fill='%23ffffff' fill-opacity='0.16'/%3E%3C/svg%3E\")";
// Layer the dot pattern OVER a CSS gradient in one background-image (avoids overriding a Tailwind gradient class).
const C = BRAND.colors;
const panelBlue = { backgroundImage: `${DOT}, linear-gradient(135deg, ${C.brand[600]}, ${C.accent[500]})` };
const panelBlueDeep = { backgroundImage: `${DOT}, linear-gradient(135deg, ${C.brand[700]}, ${C.brand[500]})` };
const heroBlue = { backgroundImage: `${DOT}, linear-gradient(135deg, ${C.brand[600]}, ${C.accent[400]})` };

/* ============================ App ============================ */
export default function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [screen, setScreen] = useState("home"); // open on the store; login only when needed
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
  const [adminBusy, setAdminBusy] = useState(false);
  const [returnTo, setReturnTo] = useState(null); // screen to return to after logging in

  const [selProduct, setSelProduct] = useState(null);
  const [selColor, setSelColor] = useState(null);
  const [selSize, setSelSize] = useState(null);
  const [productBack, setProductBack] = useState("home");

  const [selCategory, setSelCategory] = useState("women");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  // checkout
  const [coName, setCoName] = useState("");
  const [coPhone, setCoPhone] = useState("");
  const [coEmail, setCoEmail] = useState("");
  const [lastOrder, setLastOrder] = useState(null);

  // admin form
  const blankForm = { id: null, name: "", cat: "women", shape: "dress", price: "", original: "", color: "#2563EB", image: "", trending: false };
  const [form, setForm] = useState(blankForm);

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
    setScreen("login");
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

  const saveOrderToDb = async (order, items, phone, email) => {
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/orders", {
        method: "POST",
        headers: { ...SB_HEADERS, Prefer: "return=representation" },
        body: JSON.stringify({ customer_name: order.name, customer_phone: phone, customer_email: email, total: order.total, status: "placed", user_id: null }),
      });
      if (!res.ok) return;
      const rows = await res.json();
      const dbId = rows && rows[0] && rows[0].id;
      if (!dbId || !items.length) return;
      await fetch(SUPABASE_URL + "/rest/v1/order_items", {
        method: "POST",
        headers: SB_HEADERS,
        body: JSON.stringify(items.map((it) => ({ ...it, order_id: dbId }))),
      });
    } catch (e) { /* offline — order is still saved locally */ }
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
    saveOrderToDb(order, itemsSnapshot, coPhone.trim() || null, coEmail.trim() || null);
    setOrders((o) => [order, ...o]);
    setLastOrder(order);
    setCart([]);
    setCoName(""); setCoPhone(""); setCoEmail("");
    setScreen("success");
  };

  const logout = () => {
    if (session?.access_token) authSignOut(session.access_token);
    setSession(null);
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

  /* ---------- small UI pieces ---------- */
  const PriceTag = ({ p, size = "base" }) => (
    <div className="flex items-baseline gap-1.5">
      <span className={`font-bold text-slate-900 ${size === "lg" ? "text-2xl" : "text-[15px]"}`}>{formatINR(p.price)}</span>
      {p.original && <span className={`text-slate-400 line-through ${size === "lg" ? "text-sm" : "text-[11px]"}`}>{formatINR(p.original)}</span>}
    </div>
  );

  const ProductCard = ({ p, wide }) => (
    <div
      onClick={() => openProduct(p)}
      className={`text-left bg-white rounded-2xl p-2.5 shadow-xs hover:shadow-md transition active:scale-[0.98] cursor-pointer ${wide ? "w-40 shrink-0" : ""}`}
    >
      <div className="relative rounded-xl bg-linear-to-br from-accent-50 to-brand-100 h-32 overflow-hidden">
        <ProductImage p={p} color={p.colors[0]} />
        {p.original && <span className="absolute z-10 top-1.5 left-1.5 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">SALE</span>}
        {p.tag === "new" && <span className="absolute z-10 top-1.5 left-1.5 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">NEW</span>}
        <button onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }} className="absolute z-10 top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center active:scale-90 transition">
          <Heart size={14} className={isFav(p.id) ? "text-rose-500" : "text-slate-400"} fill={isFav(p.id) ? "currentColor" : "none"} />
        </button>
      </div>
      <p className="mt-2 text-[13px] font-semibold text-slate-800 truncate">{p.name}</p>
      <div className="mt-0.5"><PriceTag p={p} /></div>
    </div>
  );

  const BottomNav = () => {
    const Item = ({ icon: Icon, label, target, badge }) => {
      const active = screen === target;
      return (
        <button onClick={() => setScreen(target)} className="relative flex flex-col items-center gap-0.5 flex-1 py-1">
          <Icon size={21} className={active ? "text-brand-600" : "text-slate-400"} />
          <span className={`text-[10px] ${active ? "text-brand-600 font-semibold" : "text-slate-400"}`}>{label}</span>
          {badge > 0 && <span className="absolute top-0 right-7 bg-brand-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{badge}</span>}
        </button>
      );
    };
    return (
      <div className="lg:hidden border-t border-slate-100 bg-white px-3 py-1.5 flex">
        <Item icon={Home} label="Home" target="home" />
        <Item icon={LayoutGrid} label="Shop" target="category" />
        <Item icon={ShoppingCart} label="Cart" target="cart" badge={cartCount} />
        <Item icon={User} label="Account" target="account" />
      </div>
    );
  };

  const DesktopNav = () => {
    const link = (active) => `px-3 py-2 rounded-lg text-sm font-semibold transition ${active ? "text-brand-600 bg-brand-50" : "text-slate-600 hover:bg-slate-100"}`;
    return (
      <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-8 py-3 items-center gap-5">
        <button onClick={() => setScreen("home")} className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={panelBlue}><Logo size={18} className="text-white" /></div>
          <span className="font-extrabold text-lg text-slate-900">{BRAND.name}</span>
        </button>
        <nav className="flex items-center gap-1">
          <button onClick={() => setScreen("home")} className={link(screen === "home")}>Home</button>
          {["women", "men", "kids"].map((c) => (
            <button key={c} onClick={() => { setSelCategory(c); setScreen("category"); }} className={link(screen === "category" && selCategory === c)}>{CAT_LABEL[c]}</button>
          ))}
          <button onClick={() => setScreen("favorites")} className={link(screen === "favorites")}>Favourites</button>
        </nav>
        <div className="flex-1 max-w-sm ml-auto">
          <div className="flex items-center bg-slate-100 rounded-full px-4 py-2">
            <Search size={17} className="text-slate-400" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setScreen("home"); }} placeholder="Search dresses, kurtas, jeans…" className="flex-1 ml-2 outline-hidden text-sm bg-transparent" />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setScreen("cart")} className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <ShoppingCart size={20} className="text-slate-700" />
            {cartCount > 0 && <span className="absolute top-0.5 right-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">{cartCount}</span>}
          </button>
          <button onClick={() => setScreen("account")} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center"><User size={20} className="text-slate-700" /></button>
        </div>
      </header>
    );
  };

  /* ---------- screens ---------- */
  const renderLogin = () => (
    <div className="flex flex-col min-h-full">
      <div className="relative pb-12 rounded-b-[2.5rem]" style={panelBlue}>
        <div className="px-6 pt-2">
          <button onClick={() => { const dest = returnTo || "home"; setReturnTo(null); setScreen(dest); }} aria-label="Back" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft size={20} className="text-white" />
          </button>
        </div>
        <div className="px-6 pt-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5">
            <Logo size={26} className="text-white" />
          </div>
          <h1 className="text-white text-3xl font-extrabold leading-tight">{BRAND.name}</h1>
          <p className="text-brand-100 mt-1.5 text-sm">{BRAND.tagline}</p>
        </div>
      </div>

      <div className="px-6 -mt-6">
        <div className="bg-white rounded-3xl shadow-xl p-5">
          <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
            <button className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 bg-white shadow-sm text-brand-600">
              <Mail size={15} /> Email
            </button>
            <button disabled className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 text-slate-400 cursor-not-allowed">
              <Phone size={15} /> Phone <span className="text-[9px] font-bold bg-slate-200 text-slate-500 rounded-sm px-1 py-0.5">SOON</span>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (!authBusy) handleAuth(); }}>
            <input value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setAuthErr(""); }} type="email" autoComplete="email" placeholder="you@email.com" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
            <input value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setAuthErr(""); }} type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} placeholder="Password (min 6 characters)" className="w-full mt-2.5 border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />

            {authErr && <p className="text-red-500 text-xs mt-2.5">{authErr}</p>}
            {authNotice && (
              <div className="mt-2.5 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <Check size={15} className="text-brand-600 shrink-0 mt-0.5" />
                <p className="text-xs text-brand-700">{authNotice}</p>
              </div>
            )}

            <button type="submit" disabled={authBusy} className="w-full mt-4 bg-linear-to-r from-brand-600 to-accent-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-brand-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
              {authBusy ? "Please wait…" : (<>{authMode === "signup" ? "Create account" : "Log in"} <ArrowRight size={18} /></>)}
            </button>
          </form>

          <button onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthErr(""); setAuthNotice(""); }} className="w-full mt-3 text-brand-600 text-sm font-semibold py-1.5">
            {authMode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
          </button>

          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button onClick={() => { setReturnTo(null); setAuth({ role: "guest", id: null }); setScreen("home"); }} className="w-full text-slate-500 text-sm font-medium py-2">
            Skip for now →
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4 px-4">
          Admin? Log in with your admin email to manage products.
        </p>
      </div>
    </div>
  );

  const renderHome = () => {
    const featured = products.filter((p) => p.trending).slice(0, 5);
    const heroP = featured.length ? featured[heroIndex % featured.length] : products[0];
    const trending = products.filter((p) => p.trending);
    const newIn = [...products.filter((p) => p.tag === "new"), ...products.filter((p) => p.tag !== "new")].slice(0, 6);
    const cats = ["women", "men", "kids"];
    const catColor = { women: "from-rose-400 to-pink-500", men: "from-brand-500 to-indigo-500", kids: "from-amber-400 to-orange-500" };
    const results = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    return (
      <div className="pb-4">
        <div className="lg:hidden px-5 pt-2 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs">Welcome back 👋</p>
            <p className="font-extrabold text-slate-900 text-lg">{BRAND.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setScreen("favorites")} className="relative w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center">
              <Heart size={19} className="text-slate-700" />
              {favorites.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{favorites.length}</span>}
            </button>
            <button onClick={() => setScreen("cart")} className="relative w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center">
              <ShoppingCart size={19} className="text-slate-700" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{cartCount}</span>}
            </button>
          </div>
        </div>

        <div className="lg:hidden px-5 mt-4">
          <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-xs">
            <Search size={18} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dresses, kurtas, jeans…" className="flex-1 ml-3 outline-hidden text-sm bg-transparent" />
          </div>
        </div>

        {query.trim() ? (
          <div className="px-5 mt-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">Results for “{query}”</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
            {results.length === 0 && <p className="text-slate-400 text-sm py-10 text-center">No matches. Try another search.</p>}
          </div>
        ) : (
          <>
            {/* Hero carousel */}
            <div className="px-5 mt-5">
              <button onClick={() => openProduct(heroP)} className="w-full text-left relative rounded-3xl overflow-hidden p-5 h-52 lg:h-80 flex flex-col justify-end" style={heroBlue}>
                <ProductImage p={heroP} color="#ffffff" />
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
                <span className="absolute top-4 left-4 z-10 bg-white/25 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">✨ Featured</span>
                <h3 className="text-white text-2xl font-extrabold relative z-10 leading-tight max-w-[70%] drop-shadow-sm">{heroP.name}</h3>
                <div className="flex items-baseline gap-2 mt-1 relative z-10">
                  <span className="text-white text-xl font-bold drop-shadow-sm">{formatINR(heroP.price)}</span>
                  {heroP.original && <span className="text-brand-100 line-through text-sm">{formatINR(heroP.original)}</span>}
                </div>
              </button>
              {featured.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {featured.map((_, i) => (
                    <span key={i} onClick={() => setHeroIndex(i)} className={`h-1.5 rounded-full cursor-pointer transition-all ${i === heroIndex % featured.length ? "w-5 bg-brand-600" : "w-1.5 bg-slate-300"}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Category cards */}
            <div className="mt-6 px-5">
              <h3 className="font-bold text-slate-900 text-lg mb-3">Shop by category</h3>
              <div className="grid grid-cols-3 gap-3 lg:gap-5">
                {cats.map((c) => {
                  const n = products.filter((p) => p.cat === c).length;
                  return (
                    <button key={c} onClick={() => { setSelCategory(c); setScreen("category"); }} className={`rounded-2xl p-3 h-24 lg:h-40 lg:p-5 flex flex-col justify-between bg-linear-to-br ${catColor[c]} shadow-md active:scale-95 transition`}>
                      <Package size={20} className="text-white" />
                      <div className="text-left">
                        <p className="text-white font-bold text-sm leading-none">{CAT_LABEL[c]}</p>
                        <p className="text-white/80 text-[10px] mt-1">{n} items</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trending */}
            <div className="mt-6">
              <div className="px-5 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Trending now</h3>
                <button onClick={() => { setSelCategory("women"); setScreen("category"); }} className="text-brand-600 text-sm font-semibold">See all</button>
              </div>
              <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
                {trending.map((p) => <ProductCard key={p.id} p={p} wide />)}
              </div>
            </div>

            {/* Promo banner */}
            <div className="px-5 mt-5">
              <div className="rounded-2xl p-4 flex items-center gap-3 bg-linear-to-r from-violet-500 to-fuchsia-500 shadow-md">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Sparkles size={22} className="text-white" /></div>
                <div>
                  <p className="text-white font-bold">Festive Sale is live</p>
                  <p className="text-white/85 text-xs">Up to 40% off across the store</p>
                </div>
              </div>
            </div>

            {/* New in */}
            <div className="mt-6 px-5">
              <h3 className="font-bold text-slate-900 text-lg mb-3">New in</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {newIn.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCategory = () => {
    const cats = ["women", "men", "kids"];
    const list = products.filter((p) => p.cat === selCategory);
    return (
      <div className="pb-4">
        <div className="px-5 pt-2 flex items-center gap-3">
          <button onClick={() => setScreen("home")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
          <h2 className="text-xl font-bold text-slate-900">Shop</h2>
        </div>
        <div className="flex gap-2 px-5 mt-4 overflow-x-auto no-scrollbar">
          {cats.map((c) => (
            <button key={c} onClick={() => setSelCategory(c)} className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selCategory === c ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-white text-slate-500 shadow-xs"}`}>
              {CAT_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-5 mt-4">
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    );
  };

  const renderProductModal = () => {
    const p = selProduct;
    if (!p) return null;
    const imgs = p.images || [];
    return (
      <div className="absolute lg:fixed inset-0 z-40 flex flex-col lg:items-center lg:justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={closeProduct} />
        <div className="relative mt-auto lg:mt-0 bg-slate-50 rounded-t-4xl lg:rounded-4xl max-h-[94%] lg:max-h-[88vh] w-full lg:w-[460px] lg:max-w-[92vw] flex flex-col overflow-hidden shadow-2xl" style={{ animation: "vkUp .25s ease" }}>
          {/* Image carousel */}
          <div className="relative h-72 lg:h-80 bg-linear-to-br from-accent-100 to-brand-200 shrink-0">
            <ProductImage key={imgIndex} p={p} color={selColor} index={imgIndex} />
            <button onClick={closeProduct} className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center"><X size={18} /></button>
            <button onClick={() => toggleFav(p.id)} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center active:scale-90 transition">
              <Heart size={18} className={isFav(p.id) ? "text-rose-500" : "text-slate-500"} fill={isFav(p.id) ? "currentColor" : "none"} />
            </button>
            {imgs.length > 1 && (
              <>
                <button onClick={() => setImgIndex((i) => (i - 1 + imgs.length) % imgs.length)} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"><ChevronLeft size={18} /></button>
                <button onClick={() => setImgIndex((i) => (i + 1) % imgs.length)} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"><ChevronRight size={18} /></button>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {imgs.map((_, i) => (
                    <span key={i} onClick={() => setImgIndex(i)} className={`h-1.5 rounded-full cursor-pointer transition-all ${i === imgIndex ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2 no-scrollbar">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">{CAT_LABEL[p.cat]}</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{p.name}</h2>
            <div className="mt-2"><PriceTag p={p} size="lg" /></div>
            <p className="text-slate-500 text-sm mt-3 leading-relaxed">{p.desc}</p>

            <p className="text-sm font-semibold text-slate-800 mt-5 mb-2">Colour</p>
            <div className="flex gap-3">
              {p.colors.map((c) => (
                <button key={c} onClick={() => setSelColor(c)} className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${selColor === c ? "border-brand-500" : "border-transparent"}`} style={{ outline: "1px solid #e2e8f0" }}>
                  <span className="w-7 h-7 rounded-full" style={{ background: c }} />
                </button>
              ))}
            </div>

            <p className="text-sm font-semibold text-slate-800 mt-5 mb-2">Size</p>
            <div className="flex gap-2 flex-wrap">
              {p.sizes.map((s) => (
                <button key={s} onClick={() => setSelSize(s)} className={`min-w-[48px] px-3 py-2.5 rounded-xl text-sm font-semibold ${selSize === s ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" : "bg-slate-100 text-slate-500"}`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Add to cart */}
          <div className="p-4 border-t border-slate-100 bg-white shrink-0">
            <button onClick={() => addToCart(p, selSize, selColor)} className="w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2">
              <ShoppingCart size={19} /> Add to cart · {formatINR(p.price)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFavorites = () => {
    const favs = products.filter((p) => favorites.includes(p.id));
    return (
      <div className="pb-4">
        <div className="px-5 pt-2 flex items-center gap-3">
          <button onClick={() => setScreen("home")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
          <h2 className="text-2xl font-extrabold text-slate-900">Favourites</h2>
        </div>
        {favs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-8 mt-24">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-4"><Heart size={32} className="text-rose-400" /></div>
            <p className="font-bold text-slate-800 text-lg">No favourites yet</p>
            <p className="text-slate-400 text-sm mt-1">Tap the heart on any item to save it here.</p>
            <button onClick={() => setScreen("home")} className="mt-5 bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl">Browse items</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-5 mt-4">
            {favs.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    );
  };

  const renderCart = () => (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("home")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">My cart</h2>
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-4"><ShoppingCart size={32} className="text-brand-500" /></div>
          <p className="font-bold text-slate-800 text-lg">Your cart is empty</p>
          <p className="text-slate-400 text-sm mt-1">Find something you'll love.</p>
          <button onClick={() => setScreen("home")} className="mt-5 bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl">Start shopping</button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto lg:overflow-visible px-5 mt-3 space-y-3">
            {cart.map((item, idx) => {
              const p = products.find((x) => x.id === item.id);
              if (!p) return null;
              return (
                <div key={idx} className="bg-white rounded-2xl p-3 shadow-xs flex gap-3">
                  <div className="relative w-20 h-20 rounded-xl bg-linear-to-br from-accent-50 to-brand-100 overflow-hidden shrink-0">
                    <ProductImage p={p} color={item.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-slate-800 text-[15px] truncate pr-2">{p.name}</p>
                      <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 size={17} /></button>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Size {item.size}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center bg-slate-100 rounded-full">
                        <button onClick={() => changeQty(idx, -1)} className="w-7 h-7 flex items-center justify-center"><Minus size={14} /></button>
                        <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => changeQty(idx, 1)} className="w-7 h-7 flex items-center justify-center"><Plus size={14} /></button>
                      </div>
                      <span className="font-bold text-slate-900">{formatINR(p.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-5 border-t border-slate-100 bg-white">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Total</span>
              <span className="text-2xl font-extrabold text-slate-900">{formatINR(cartTotal)}</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Inclusive of all taxes</p>
            <button onClick={() => setScreen("checkout")} className="w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/30">Check out</button>
          </div>
        </>
      )}
    </div>
  );

  const renderCheckout = () => (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("cart")} className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">Checkout</h2>
      </div>

      <div className="flex-1 px-6 pt-5">
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex justify-between items-center mb-5">
          <span className="text-sm text-brand-700 font-medium">{cartCount} item{cartCount !== 1 ? "s" : ""} · to pay</span>
          <span className="font-extrabold text-brand-700 text-lg">{formatINR(cartTotal)}</span>
        </div>

        <p className="text-sm font-semibold text-slate-800 mb-3">Where should we send your order updates?</p>
        <label className="block text-xs text-slate-500 mb-1">Full name</label>
        <input value={coName} onChange={(e) => setCoName(e.target.value)} placeholder="Your name" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 mb-4" />

        <label className="block text-xs text-slate-500 mb-1">Phone number</label>
        <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-brand-500 mb-4">
          <span className="text-slate-500 text-sm pr-2 border-r border-slate-200">+91</span>
          <input value={coPhone} onChange={(e) => setCoPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="Mobile number" className="flex-1 py-3 px-3 outline-hidden text-sm" />
        </div>

        <div className="flex items-center gap-3 my-1 text-slate-300 text-xs"><div className="flex-1 h-px bg-slate-200" />or<div className="flex-1 h-px bg-slate-200" /></div>

        <label className="block text-xs text-slate-500 mb-1 mt-2">Email</label>
        <input value={coEmail} onChange={(e) => setCoEmail(e.target.value)} type="email" placeholder="you@email.com" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
        <p className="text-[11px] text-slate-400 mt-2">Add at least one — a phone number or an email.</p>
      </div>

      <div className="p-5 border-t border-slate-100">
        {auth.role === "guest" ? (
          <>
            <button onClick={() => goToLogin("checkout")} className="w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2">
              <User size={18} /> Log in to place order
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">Please log in or create an account to complete your order.</p>
          </>
        ) : (
          <button onClick={placeOrder} disabled={!coName.trim() || (!coPhone.trim() && !coEmail.trim())} className="w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/30 disabled:opacity-50">
            Place order · {formatINR(cartTotal)}
          </button>
        )}
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-24 h-24 rounded-full bg-linear-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-6">
          <Check size={44} className="text-white" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Order placed!</h2>
        <p className="text-slate-500 text-sm mt-2">Thanks{lastOrder ? ", " + lastOrder.name : ""}. We'll send updates to <span className="font-semibold text-slate-700">{lastOrder?.contact}</span>.</p>
        <div className="bg-slate-50 rounded-2xl px-6 py-4 mt-6 w-full">
          <p className="text-xs text-slate-400">Order ID</p>
          <p className="font-bold text-slate-800 text-lg">{lastOrder?.id}</p>
        </div>
        <button onClick={() => setScreen("home")} className="mt-6 w-full bg-brand-600 text-white font-semibold py-3.5 rounded-xl">Continue shopping</button>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="pb-4">
      <div className="rounded-b-[2.5rem] pb-8" style={panelBlue}>
        <div className="px-6 pt-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {auth.role === "admin" ? <Shield size={28} className="text-white" /> : <User size={28} className="text-white" />}
          </div>
          <div>
            <p className="text-white font-bold text-lg">{auth.role === "guest" ? "Guest user" : auth.role === "admin" ? "Administrator" : "Customer"}</p>
            <p className="text-brand-100 text-sm">{auth.id || "Not signed in"}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-2.5">
        {auth.role === "admin" && (
          <button onClick={() => setScreen("admin")} className="w-full bg-white rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center"><Shield size={19} className="text-brand-600" /></div>
            <span className="flex-1 text-left font-semibold text-slate-800">Admin dashboard</span>
            <ChevronRight size={20} className="text-slate-300" />
          </button>
        )}
        {[
          { icon: Package, label: "My orders", note: orders.length + " placed" },
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

  const renderAdmin = () => {
    const stats = [
      { label: "Products", value: products.length },
      { label: "Orders", value: orders.length },
      { label: "Revenue", value: formatINR(orders.reduce((s, o) => s + o.total, 0)) },
    ];
    return (
      <div className="flex flex-col min-h-full bg-slate-50">
        <div className="rounded-b-3xl" style={panelBlueDeep}>
          <div className="px-5 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setScreen("account")} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><ChevronLeft size={18} className="text-white" /></button>
              <div>
                <p className="text-white font-bold text-lg">Admin</p>
                <p className="text-brand-100 text-[11px]">{auth.id}</p>
              </div>
            </div>
            <button onClick={logout} className="text-white/90"><LogOut size={20} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2 px-5 pb-5">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <p className="text-white font-bold text-base leading-tight">{s.value}</p>
                <p className="text-brand-100 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Add / edit form */}
          <div className="bg-white rounded-2xl p-4 shadow-xs mb-4">
            <p className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              {form.id ? <><Edit3 size={16} className="text-brand-600" /> Edit product</> : <><Plus size={16} className="text-brand-600" /> Add product</>}
            </p>
            <div className="flex gap-3 items-center mb-3">
              <div className="w-16 h-16 rounded-xl bg-linear-to-br from-accent-50 to-brand-100 flex items-center justify-center shrink-0">
                <Garment shape={form.shape} color={form.color} className="h-[80%]" />
              </div>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="flex-1 border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} className="border border-slate-200 rounded-lg py-2.5 px-2 text-sm outline-hidden">
                <option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option>
              </select>
              <select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })} className="border border-slate-200 rounded-lg py-2.5 px-2 text-sm outline-hidden">
                {["dress", "tee", "shirt", "tunic", "jacket", "pants", "shorts", "overall"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="Price ₹" className="border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500" />
              <input value={form.original} onChange={(e) => setForm({ ...form, original: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="MRP ₹ (optional)" className="border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500" />
            </div>
            <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} type="url" placeholder="Image URL (optional)" className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-hidden focus:border-brand-500 mb-2" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Colour</span>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-9 h-9 rounded-lg border border-slate-200 bg-white" />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" checked={form.trending} onChange={(e) => setForm({ ...form, trending: e.target.checked })} className="w-4 h-4 accent-brand-600" />
                Show in Trending
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={saveProduct} disabled={adminBusy} className="flex-1 bg-brand-600 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-60">{adminBusy ? "Saving…" : (form.id ? "Save changes" : "Add product")}</button>
              {form.id && <button onClick={() => setForm(blankForm)} className="px-4 border border-slate-200 rounded-lg text-sm text-slate-500">Cancel</button>}
            </div>
          </div>

          {/* Product list */}
          <p className="font-bold text-slate-800 mb-2 px-1">All products ({products.length})</p>
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-2.5 shadow-xs flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-linear-to-br from-accent-50 to-brand-100 flex items-center justify-center shrink-0">
                  <Garment shape={p.shape} color={p.colors[0]} className="h-[80%]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{CAT_LABEL[p.cat]} · {formatINR(p.price)}</p>
                </div>
                <button onClick={() => editProduct(p)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><Edit3 size={15} /></button>
                <button onClick={() => deleteProduct(p.id)} disabled={adminBusy} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 disabled:opacity-50"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          <button onClick={refreshFromDb} disabled={adminBusy} className="w-full mt-5 mb-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60">
            Refresh from database
          </button>
        </div>
      </div>
    );
  };

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

  /* ---------- screen switch ---------- */
  const showNav = ["home", "category", "account", "cart", "favorites"].includes(screen);
  let content = null;
  if (screen === "login") content = renderLogin();
  else if (screen === "home") content = renderHome();
  else if (screen === "category") content = renderCategory();
  else if (screen === "favorites") content = renderFavorites();
  else if (screen === "cart") content = renderCart();
  else if (screen === "checkout") content = renderCheckout();
  else if (screen === "success") content = renderSuccess();
  else if (screen === "account") content = renderAccount();
  else if (screen === "admin") content = renderAdmin();

  const showChrome = screen !== "login";
  const deskWidth = ["home", "category", "favorites"].includes(screen) ? "lg:max-w-6xl" : screen === "admin" ? "lg:max-w-4xl" : "lg:max-w-2xl";
  return (
    <div className="min-h-screen bg-slate-300 lg:bg-slate-50 flex justify-center sm:py-6 lg:py-0 font-sans">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}@keyframes vkUp{from{transform:translateY(100%);opacity:.7}to{transform:translateY(0);opacity:1}}`}</style>
      <div className="relative w-full max-w-[430px] lg:max-w-none bg-slate-50 sm:rounded-[2.5rem] lg:rounded-none sm:shadow-2xl lg:shadow-none overflow-hidden lg:overflow-visible flex flex-col h-screen sm:h-[880px] lg:h-auto lg:min-h-screen">
        {showChrome && <DesktopNav />}
        <div className="flex-1 overflow-y-auto no-scrollbar lg:overflow-visible">
          <div className={`lg:mx-auto lg:w-full lg:px-6 ${deskWidth}`}>{content}</div>
        </div>
        {showNav && <BottomNav />}
        {renderProductModal()}

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
