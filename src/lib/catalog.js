/* ==================== Shop listing helpers: sort + colour filter ==================== */
import { CAT_LABEL } from "./format.js";

// Sort options for the shop grid. "Best selling" uses `trending` as a proxy
// (no real sales data yet); "Newest" uses the `new` tag then id.
export const SORTS = [
  { key: "featured",    label: "Featured" },
  { key: "bestselling", label: "Best selling" },
  { key: "newest",      label: "Newest" },
  { key: "price-low",   label: "Low to High" },
  { key: "price-high",  label: "High to Low" },
  { key: "az",          label: "A to Z" },
];

export function sortProducts(list, sort) {
  const a = [...list];
  switch (sort) {
    case "price-low":   return a.sort((x, y) => x.price - y.price);
    case "price-high":  return a.sort((x, y) => y.price - x.price);
    case "newest":      return a.sort((x, y) => (y.tag === "new" ? 1 : 0) - (x.tag === "new" ? 1 : 0) || y.id - x.id);
    case "az":          return a.sort((x, y) => x.name.localeCompare(y.name));
    case "za":          return a.sort((x, y) => y.name.localeCompare(x.name));
    case "bestselling": return a.sort((x, y) => (y.trending ? 1 : 0) - (x.trending ? 1 : 0) || x.id - y.id);
    default:            return a.sort((x, y) => (y.trending ? 1 : 0) - (x.trending ? 1 : 0)); // featured
  }
}

// Colour families for the colour filter. Every product colour (an arbitrary hex)
// is mapped to the nearest family so shoppers filter by "Blue", not exact hex.
export const COLOR_FAMILIES = [
  { key: "black",  label: "Black",  hex: "#111827" },
  { key: "grey",   label: "Grey",   hex: "#9CA3AF" },
  { key: "white",  label: "White",  hex: "#F3F4F6" },
  { key: "red",    label: "Red",    hex: "#DC2626" },
  { key: "pink",   label: "Pink",   hex: "#EC4899" },
  { key: "orange", label: "Orange", hex: "#F97316" },
  { key: "yellow", label: "Yellow", hex: "#FACC15" },
  { key: "green",  label: "Green",  hex: "#16A34A" },
  { key: "teal",   label: "Teal",   hex: "#0D9488" },
  { key: "blue",   label: "Blue",   hex: "#2563EB" },
  { key: "purple", label: "Purple", hex: "#7C3AED" },
  { key: "brown",  label: "Brown",  hex: "#92400E" },
];
const FAMILY_BY_KEY = Object.fromEntries(COLOR_FAMILIES.map((f) => [f.key, f]));
export const familyLabel = (key) => (FAMILY_BY_KEY[key] || {}).label || key;

function hexToRgb(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Nearest colour-family key for a hex value (simple RGB distance).
export function colorFamily(hex) {
  if (!hex || String(hex)[0] !== "#") return "grey";
  const [r, g, b] = hexToRgb(hex);
  let best = "grey", bestD = Infinity;
  for (const f of COLOR_FAMILIES) {
    const [fr, fg, fb] = hexToRgb(f.hex);
    const d = (r - fr) ** 2 + (g - fg) ** 2 + (b - fb) ** 2;
    if (d < bestD) { bestD = d; best = f.key; }
  }
  return best;
}

// Set of colour-family keys a product covers.
export function productFamilies(p) {
  return new Set((p.colors || []).map(colorFamily));
}

// ---- Stock helpers. stock null/undefined = not tracked (always available). ----
// Per-size stock: p.sizeStock = { S: 3, M: 0, ... } (optional). When present it's
// authoritative per size; a size not listed falls back to product-level p.stock.
export const hasSizeStock = (p) => !!(p && p.sizeStock && typeof p.sizeStock === "object" && Object.keys(p.sizeStock).length);

// Units available for a specific size. null = not tracked (treat as unlimited).
export function stockFor(p, size) {
  if (hasSizeStock(p)) {
    if (typeof p.sizeStock[size] === "number") return p.sizeStock[size];
    if (typeof p?.stock === "number") return p.stock;   // Total stock is the fallback
    if ((p.sizes || []).includes(size)) return 0;        // per-size list is authoritative → an unlisted offered size is sold out
    return null;
  }
  return typeof p?.stock === "number" ? p.stock : null;
}
export const sizeOutOfStock = (p, size) => { const s = stockFor(p, size); return typeof s === "number" && s <= 0; };
export const sizeLowStock = (p, size) => { const s = stockFor(p, size); return typeof s === "number" && s > 0 && s <= 5; };
// First size that isn't sold out (used to pre-select a buyable size on open).
export const firstInStockSize = (p) => (p?.sizes || []).find((s) => !sizeOutOfStock(p, s)) || (p?.sizes || [])[0] || null;

export const isTracked = (p) => typeof p?.stock === "number" || hasSizeStock(p);
export const outOfStock = (p) => {
  if (hasSizeStock(p)) {
    const sizes = (p.sizes && p.sizes.length) ? p.sizes : Object.keys(p.sizeStock);
    return sizes.every((s) => sizeOutOfStock(p, s));
  }
  return typeof p?.stock === "number" && p.stock <= 0;
};
// Product-level low-stock nudge; per-size low stock is surfaced per selected size.
export const lowStock = (p) => {
  if (hasSizeStock(p)) return false;
  return typeof p?.stock === "number" && p.stock > 0 && p.stock <= 5;
};

// Full-text-ish search across name, description, category, type/shape, tag and
// colour names. Every whitespace-separated term must match somewhere, so
// "blue dress" narrows to blue dresses. Results are ranked: name hits first,
// then trending, then alphabetical.
function searchHaystack(p) {
  return [
    p.name, p.desc, p.shape, p.tag, CAT_LABEL[p.cat] || p.cat, p.cat,
    ...(p.colors || []).map((c) => familyLabel(colorFamily(c))),
  ].filter(Boolean).join(" ").toLowerCase();
}
export function searchProducts(list, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const matched = (list || []).filter((p) => {
    const hay = searchHaystack(p);
    return terms.every((t) => hay.includes(t));
  });
  return matched.sort((x, y) => {
    const nx = x.name.toLowerCase().includes(q) ? 1 : 0;
    const ny = y.name.toLowerCase().includes(q) ? 1 : 0;
    if (nx !== ny) return ny - nx;
    const tx = x.trending ? 1 : 0, ty = y.trending ? 1 : 0;
    if (tx !== ty) return ty - tx;
    return x.name.localeCompare(y.name);
  });
}
