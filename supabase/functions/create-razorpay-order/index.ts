// create-razorpay-order — the authoritative order + amount is computed HERE,
// from the products table, so the client can never dictate the price. Verifies
// stock, verifies the caller's identity from their token (never trusts a
// client-supplied user id), creates a Razorpay order + a matching 'pending' DB
// order, and returns the ids + server breakdown the client needs.
import { corsHeaders, db, json } from "../_shared/util.ts";
import { computeTotals } from "../_shared/pricing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

// Resolve the authenticated user id from the caller's Supabase access token.
// We NEVER trust a client-supplied userId — only the verified token subject, so
// an order can't be attributed to a victim.
async function verifiedUserId(token?: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u?.id || null;
  } catch {
    return null;
  }
}

// Available stock for a size, mirroring src/lib/catalog.js: per-size stock wins
// when present, else product-level stock; null = untracked (no limit).
function available(p: { stock?: number | null; size_stock?: Record<string, number> | null }, size?: string | null): number | null {
  if (p.size_stock && typeof p.size_stock === "object" && size != null && p.size_stock[size] != null) {
    return Number(p.size_stock[size]);
  }
  return typeof p.stock === "number" ? p.stock : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { items, couponCode, giftWrap, contact, note, shipping, userToken, ref } = body || {};
    if (!Array.isArray(items) || items.length === 0) return json({ error: "no items" }, 400);

    const userId = await verifiedUserId(userToken);

    const ids = [...new Set(items.map((i: { product_id: number }) => i.product_id))].filter((x) => x != null);
    if (!ids.length) return json({ error: "no valid products" }, 400);

    // select=* so a DB missing the optional stock/size_stock columns doesn't 400;
    // available() below just treats absent stock as untracked.
    const pRes = await db(`products?id=in.(${ids.join(",")})&select=*`);
    if (!pRes.ok) { console.error("product lookup failed", await pRes.text()); return json({ error: "product lookup failed" }, 500); }
    const products = await pRes.json();
    const pById = new Map(products.map((p: { id: number }) => [p.id, p]));

    // Total requested qty per (product,size) — checked against stock below.
    const wantBySize = new Map<string, number>();
    for (const it of items) {
      const k = `${it.product_id}|${it.size ?? ""}`;
      wantBySize.set(k, (wantBySize.get(k) || 0) + Math.max(1, Math.floor(Number(it.qty) || 1)));
    }

    let itemsTotal = 0;
    const orderItems: Record<string, unknown>[] = [];
    for (const it of items) {
      const p = pById.get(it.product_id) as { id: number; name: string; price: number; stock?: number | null; size_stock?: Record<string, number> | null } | undefined;
      if (!p) return json({ error: `unknown product ${it.product_id}` }, 400);
      const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
      const avail = available(p, it.size);
      const wanted = wantBySize.get(`${it.product_id}|${it.size ?? ""}`) || qty;
      if (avail != null && wanted > avail) return json({ error: "out_of_stock", productId: p.id }, 409);
      itemsTotal += p.price * qty;
      orderItems.push({ product_id: p.id, product_name: p.name, size: it.size || null, color: it.color || null, unit_price: p.price, qty });
    }

    const t = computeTotals({ itemsTotal, couponCode, giftWrap: !!giftWrap });
    if (t.total <= 0) return json({ error: "invalid amount" }, 400);
    const amount = t.total * 100; // Razorpay works in paise

    // 1) Razorpay order
    const auth = btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`);
    const rRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency: "INR", receipt: ref || undefined, notes: { ref: ref || "" } }),
    });
    if (!rRes.ok) { console.error("razorpay order failed", await rRes.text()); return json({ error: "payment_init_failed" }, 502); }
    const rOrder = await rRes.json();

    // 2) Pending DB order (service role → bypasses RLS + payment guard). Full
    // breakdown first; fall back to core columns if the feature migration isn't
    // applied (mirrors saveOrderToDb's degradation ladder).
    const core = {
      ref: ref || null, total: t.total, status: "placed", user_id: userId,
      customer_name: contact?.name || null, customer_phone: contact?.phone || null, customer_email: contact?.email || null,
      note: note || null, shipping_address: shipping || null,
      payment_method: "online", payment_status: "pending", razorpay_order_id: rOrder.id,
    };
    const full = {
      ...core,
      items_total: t.itemsTotal, subtotal: t.subtotal, gst: t.gst, gst_rate_pct: t.ratePct,
      discount: t.discount, coupon_code: t.couponCode, delivery_fee: t.deliveryFee,
      gift_wrap: !!giftWrap, gift_wrap_fee: t.giftWrapFee,
    };
    const insert = (row: Record<string, unknown>) => db("orders", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
    let oRes = await insert(full);
    if (!oRes.ok) oRes = await insert(core);
    if (!oRes.ok) { console.error("db order insert failed", await oRes.text()); return json({ error: "order_save_failed" }, 500); }
    const [dbOrder] = await oRes.json();

    if (orderItems.length) {
      const iRes = await db("order_items", { method: "POST", body: JSON.stringify(orderItems.map((i) => ({ ...i, order_id: dbOrder.id }))) });
      if (!iRes.ok) { await db(`orders?id=eq.${dbOrder.id}`, { method: "DELETE" }).catch(() => {}); return json({ error: "order_save_failed" }, 500); }
    }

    // Return the SERVER breakdown so the client displays exactly what was charged.
    return json({
      keyId: RZP_KEY_ID, razorpayOrderId: rOrder.id, amount, currency: "INR", dbOrderId: dbOrder.id, ref,
      bill: {
        total: t.total, itemsTotal: t.itemsTotal, subtotal: t.subtotal, gst: t.gst, ratePct: t.ratePct,
        discount: t.discount, couponCode: t.couponCode, deliveryFee: t.deliveryFee, giftWrapFee: t.giftWrapFee,
      },
    });
  } catch (e) {
    console.error("create-razorpay-order error", e);
    return json({ error: "server_error" }, 500);
  }
});
