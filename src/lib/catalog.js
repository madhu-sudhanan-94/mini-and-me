/* ==================== Shop listing helpers: sort + colour filter ==================== */

// Sort options for the shop grid. "Best selling" uses `trending` as a proxy
// (no real sales data yet); "Newest" uses the `new` tag then id.
export const SORTS = [
  { key: "featured",    label: "Featured" },
  { key: "bestselling", label: "Best selling" },
  { key: "newest",      label: "Newest" },
  { key: "price-low",   label: "Price: Low to High" },
  { key: "price-high",  label: "Price: High to Low" },
  { key: "az",          label: "Alphabetically, A–Z" },
  { key: "za",          label: "Alphabetically, Z–A" },
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
