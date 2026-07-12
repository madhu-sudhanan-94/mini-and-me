/* ============================ Order status lifecycle ============================ */
export const ORDER_STEPS = ["placed", "confirmed", "shipped", "delivered"];
export const ALL_STATUSES = [...ORDER_STEPS, "cancelled"];
export const STATUS_LABEL = {
  placed: "Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  // Not a fulfillment stage — a UI-only pill for an online order whose payment
  // was taken but isn't confirmed yet. Excluded from ALL_STATUSES (admin picker).
  confirming: "Confirming payment",
};

export function fmtDate(s) {
  if (!s) return "";
  try { return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}

// Normalize a DB order row OR a local (this-session) order into one shape.
export function normalizeOrder(o) {
  return {
    key: o.id,
    ref: o.ref || o.id,
    total: o.total,
    status: o.status || "placed",
    date: o.created_at || o.ts,
    name: o.customer_name || o.name,
    contact: o.customer_phone || o.customer_email || o.contact,
    items: o.order_items || o.items || [],
    shipping: o.shipping_address || o.shipping || null,
    note: o.note || null,
    // Persisted checkout breakdown (present on orders placed after the 2026-07
    // migration; itemsTotal > 0 signals a real breakdown vs an old order's
    // backfilled zeros). Handles both DB column names and local order fields.
    itemsTotal: o.items_total ?? o.itemsTotal ?? 0,
    subtotal: o.subtotal ?? null,
    gst: o.gst ?? null,
    gstRatePct: o.gst_rate_pct ?? o.ratePct ?? null,
    discount: o.discount ?? 0,
    couponCode: o.coupon_code || o.coupon?.code || null,
    deliveryFee: o.delivery_fee ?? 0,
    giftWrapFee: o.gift_wrap_fee ?? 0,
    giftWrap: o.gift_wrap ?? o.giftWrap ?? false,
    totalSaved: o.total_saved ?? o.saved ?? 0,
    paymentMethod: o.payment_method || o.paymentMethod || null,  // 'online' | 'cod'
    paymentStatus: o.payment_status || o.paymentStatus || null,  // 'pending' | 'paid' | 'failed' | 'refunded'
  };
}

const refOf = (o) => String(o.ref || o.id);

// Merge DB orders with any local this-session orders not yet reflected in the DB
// (e.g. a just-placed order, or one whose sync failed), deduped by ref.
export function mergeOrders(dbOrders, localOrders) {
  const seen = new Set((dbOrders || []).map(refOf));
  const extra = (localOrders || []).filter((o) => !seen.has(refOf(o)));
  return [...extra, ...(dbOrders || [])];
}

export function shipLines(a) {
  if (!a) return "";
  return [a.line1, a.line2, a.area, a.city, a.state, a.pincode, a.country].filter(Boolean).join(", ");
}
