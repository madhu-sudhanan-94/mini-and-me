// Server-side pricing — MIRRORS src/shop.config.js + src/lib/format.js.
// IMPORTANT: if you change delivery/gift-wrap/coupon/GST values in those client
// files, update them here too, or the server total will diverge from the cart.

export const SHOP = { freeDeliveryThreshold: 1000, deliveryFee: 99, giftWrapFee: 30 };
export const GST_RATE = 0.05;

type Coupon = { code: string; type: "percent" | "flat"; value: number; minSubtotal: number; maxDiscount?: number };

const COUPONS: Coupon[] = [
  { code: "SAVE10", type: "percent", value: 10, minSubtotal: 0, maxDiscount: 500 },
  { code: "FLAT100", type: "flat", value: 100, minSubtotal: 500 },
  { code: "WELCOME", type: "percent", value: 15, minSubtotal: 0, maxDiscount: 750 },
];

export function findCoupon(code?: string | null): Coupon | null {
  const c = (code || "").trim().toUpperCase();
  return COUPONS.find((x) => x.code === c) || null;
}

export function couponDiscount(coupon: Coupon | null, subtotal: number): number {
  if (!coupon || subtotal < (coupon.minSubtotal || 0)) return 0;
  let d = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) d = Math.min(d, coupon.maxDiscount);
  return Math.min(d, subtotal);
}

export function gstBreakdown(totalIncl: number, rate = GST_RATE) {
  const gst = Math.round(totalIncl - totalIncl / (1 + rate));
  return { subtotal: totalIncl - gst, gst, ratePct: Math.round(rate * 100) };
}

export function computeTotals(
  { itemsTotal, couponCode, giftWrap }: { itemsTotal: number; couponCode?: string | null; giftWrap?: boolean },
) {
  const coupon = findCoupon(couponCode);
  const { subtotal, gst, ratePct } = gstBreakdown(itemsTotal);
  const discount = couponDiscount(coupon, itemsTotal);
  const qualifiesFree = itemsTotal >= SHOP.freeDeliveryThreshold;
  const deliveryFee = itemsTotal === 0 || qualifiesFree ? 0 : SHOP.deliveryFee;
  const giftWrapFee = giftWrap && itemsTotal > 0 ? SHOP.giftWrapFee : 0;
  const total = Math.max(0, itemsTotal - discount + deliveryFee + giftWrapFee);
  return { itemsTotal, subtotal, gst, ratePct, discount, couponCode: coupon?.code || null, deliveryFee, giftWrapFee, total };
}
