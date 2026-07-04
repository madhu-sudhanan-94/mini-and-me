/* ============================ Order status lifecycle ============================ */
export const ORDER_STEPS = ["placed", "confirmed", "shipped", "delivered"];
export const ALL_STATUSES = [...ORDER_STEPS, "cancelled"];
export const STATUS_LABEL = {
  placed: "Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
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
  };
}

export function shipLines(a) {
  if (!a) return "";
  return [a.line1, a.line2, a.area, a.city, a.state, a.pincode, a.country].filter(Boolean).join(", ");
}
