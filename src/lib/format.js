/* ============================ Formatting & colour helpers ============================ */

export const formatINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

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
