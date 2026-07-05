/* ============================ Formatting & colour helpers ============================ */

export const formatINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

// Prices are tax-inclusive. Split an inclusive total into subtotal + GST.
// Set GST_RATE to your effective rate (apparel is 5% under ₹1000, 12% at/above).
export const GST_RATE = 0.05;
export function gstBreakdown(totalIncl, rate = GST_RATE) {
  const gst = Math.round(totalIncl - totalIncl / (1 + rate));
  return { subtotal: totalIncl - gst, gst, total: totalIncl, ratePct: Math.round(rate * 100) };
}

export function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
}

export const CAT_LABEL = { women: "Women", men: "Men", kids: "Kids" };

// Lighten (p > 0) or darken (p < 0) a #rrggbb hex by fraction p (0..1)
export function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = p < 0 ? 0 : 255, a = Math.abs(p);
  r = Math.round((t - r) * a + r);
  g = Math.round((t - g) * a + g);
  b = Math.round((t - b) * a + b);
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}
