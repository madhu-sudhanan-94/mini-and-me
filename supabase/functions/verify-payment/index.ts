// verify-payment — called by the client right after Razorpay Checkout succeeds.
// Verifies the payment signature with the secret key, then marks the matching
// order 'paid'. Idempotent (safe if the webhook already marked it paid).
import { corsHeaders, db, hmacHex, json, rateLimited, safeEqual } from "../_shared/util.ts";
import { sendOrderEmail } from "../_shared/email.ts";

const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  const rl = await rateLimited(req, "verify-payment", 30, 60);
  if (rl) return rl;

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json().catch(() => ({}));
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ ok: false, error: "missing fields" }, 400);
    }

    const expected = await hmacHex(RZP_KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (!safeEqual(expected, razorpay_signature)) return json({ ok: false, error: "signature mismatch" }, 400);

    const gRes = await db(`orders?razorpay_order_id=eq.${razorpay_order_id}&select=id,total,payment_status,status`);
    if (!gRes.ok) return json({ ok: false, error: "lookup_failed" }, 500);
    const rows = await gRes.json();
    if (!Array.isArray(rows) || !rows.length) return json({ ok: false, error: "order not found" }, 404);
    const order = rows[0];

    // Never resurrect a cancelled order (would re-trigger the stock decrement).
    if (order.payment_status !== "paid" && order.status !== "cancelled") {
      const uRes = await db(`orders?razorpay_order_id=eq.${razorpay_order_id}&status=neq.cancelled`, {
        method: "PATCH",
        body: JSON.stringify({ payment_status: "paid", razorpay_payment_id, amount_paid: order.total }),
      });
      if (!uRes.ok) return json({ ok: false, error: "update failed" }, 500);
    }

    // Order-confirmation email (idempotent; skips if already sent / cancelled).
    // Awaited so the edge runtime doesn't kill it — sendOrderEmail never throws
    // and is timeout-bounded, so it can't break or hang the payment result.
    if (order.status !== "cancelled") await sendOrderEmail(order.id, "confirmation");

    return json({ ok: true, orderId: order.id });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
