/*
  ============================================================
  SHOP CONFIG — commerce knobs (the "admin-level" settings).
  Edit here to change delivery pricing and coupon codes.
  (A future admin screen can read/write these from the DB; for
  now they live in one file so they're easy to change.)
  ============================================================
*/
export const SHOP = {
  // Cart subtotal (₹) at/above which delivery is FREE.
  freeDeliveryThreshold: 1000,
  // Delivery charge (₹) applied below the threshold.
  deliveryFee: 99,
  // Flat fee (₹) for optional gift wrapping at checkout.
  giftWrapFee: 30,
};

/*
  ============================================================
  CATEGORY TILES — the "Shop by category" row on the Home screen.
  Order here = order shown. `key` must match a product's `cat`.
  `image` is the tile photo (any URL or /public path); leave it
  "" to fall back to the first product photo in that category.
  ============================================================
*/
export const CATEGORIES = [
  { key: "kids",  label: "Kids",  image: "" },
  { key: "women", label: "Women", image: "" },
  { key: "men",   label: "Men",   image: "" },
  { key: "toys",  label: "Toys",  image: "" },
];

/*
  Preset coupon codes. Each: { code, type: "percent"|"flat", value, label,
  minSubtotal (₹, optional), maxDiscount (₹, cap for percent, optional) }.
  Codes are matched case-insensitively.
*/
// No coupons active for now. Add entries here to re-enable the coupon box.
export const COUPONS = [];

// Whether to show the "Have a coupon?" box at checkout (auto-hidden when empty).
export const COUPONS_ENABLED = COUPONS.length > 0;

// Find a coupon by code (case-insensitive). Returns the coupon or null.
export function findCoupon(code) {
  const c = (code || "").trim().toUpperCase();
  return COUPONS.find((x) => x.code === c) || null;
}

// Discount (₹) a coupon yields on a given subtotal. 0 if not applicable.
export function couponDiscount(coupon, subtotal) {
  if (!coupon || subtotal < (coupon.minSubtotal || 0)) return 0;
  let d = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) d = Math.min(d, coupon.maxDiscount);
  return Math.min(d, subtotal);
}
