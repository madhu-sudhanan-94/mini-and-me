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
  Preset coupon codes. Each: { code, type: "percent"|"flat", value, label,
  minSubtotal (₹, optional), maxDiscount (₹, cap for percent, optional) }.
  Codes are matched case-insensitively.
*/
export const COUPONS = [
  { code: "SAVE10",  type: "percent", value: 10,  label: "10% off your order",   minSubtotal: 0,    maxDiscount: 500 },
  { code: "FLAT100", type: "flat",    value: 100, label: "₹100 off",             minSubtotal: 500 },
  { code: "WELCOME", type: "percent", value: 15,  label: "15% off (welcome)",    minSubtotal: 0,    maxDiscount: 750 },
];

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
