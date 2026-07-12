// refund-order — admin cancels an order. For a paid online order it issues a
// Razorpay refund and marks it cancelled+refunded (the DB trigger then restores
// stock). For COD/unpaid orders it just marks cancelled. Admin-gated by token.
import { corsHeaders, db, json, rateLimited } from "../_shared/util.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

// Verify the caller's token belongs to an admin (never trust a client claim).
async function isAdmin(token?: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return false;
    const u = await r.json();
    if (!u?.id) return false;
    const p = await db(`profiles?id=eq.${u.id}&select=role`);
    const rows = await p.json();
    return Array.isArray(rows) && rows[0]?.role === "admin";
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const rl = await rateLimited(req, "refund-order", 30, 60);
  if (rl) return rl;

  try {
    const { orderId, userToken } = await req.json().catch(() => ({}));
    if (!orderId) return json({ error: "missing orderId" }, 400);
    if (!(await isAdmin(userToken))) return json({ error: "not_authorized" }, 403);

    const gRes = await db(`orders?id=eq.${orderId}&select=id,total,amount_paid,payment_method,payment_status,razorpay_order_id,razorpay_payment_id,status`);
    if (!gRes.ok) return json({ error: "lookup_failed" }, 500);
    const rows = await gRes.json();
    if (!Array.isArray(rows) || !rows.length) return json({ error: "order not found" }, 404);
    const o = rows[0];
    if (o.status === "cancelled") return json({ ok: true, alreadyCancelled: true, refunded: o.payment_status === "refunded" });

    const auth = btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`);
    let refunded = false;

    if (o.payment_method === "online") {
      // Find the actually-captured payment. Prefer the stored id when the order
      // is marked paid; otherwise ask Razorpay (covers the captured-but-pending
      // window where verify-payment blipped / the webhook hasn't landed).
      let paymentId = o.payment_status === "paid" ? o.razorpay_payment_id : null;
      let amount = (o.amount_paid ?? o.total) * 100;
      if (!paymentId && o.razorpay_order_id) {
        const pr = await fetch(`https://api.razorpay.com/v1/orders/${o.razorpay_order_id}/payments`, { headers: { Authorization: `Basic ${auth}` } });
        if (pr.ok) {
          const pj = await pr.json();
          const cap = (pj.items || []).find((p: { status: string }) => p.status === "captured");
          if (cap) { paymentId = cap.id; amount = cap.amount; }
        }
      }
      if (paymentId) {
        // Idempotent: skip the refund if this payment is already fully refunded
        // (e.g. a retry after the DB PATCH failed). Otherwise issue the refund.
        const gp = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, { headers: { Authorization: `Basic ${auth}` } });
        const pdata = gp.ok ? await gp.json() : null;
        const alreadyRefunded = pdata && (pdata.amount_refunded ?? 0) >= (pdata.amount ?? amount);
        if (!alreadyRefunded) {
          const rRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
            method: "POST",
            headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
            body: JSON.stringify({ amount, speed: "normal" }),
          });
          if (!rRes.ok) { console.error("razorpay refund failed", await rRes.text()); return json({ error: "refund_failed" }, 502); }
        }
        refunded = true;
      }
    }

    // Cancel (+ mark refunded when money was returned). Service role bypasses the
    // guard; the DB trigger restores stock for orders that were actually paid.
    const patch = refunded ? { status: "cancelled", payment_status: "refunded" } : { status: "cancelled" };
    const uRes = await db(`orders?id=eq.${orderId}`, { method: "PATCH", body: JSON.stringify(patch) });
    if (!uRes.ok) { console.error("order cancel-update failed", await uRes.text()); return json({ error: "update_failed" }, 500); }
    return json({ ok: true, refunded });
  } catch (e) {
    console.error("refund-order error", e);
    return json({ error: "server_error" }, 500);
  }
});
