// release-reservation — the client calls this when the customer DISMISSES the
// Razorpay modal (or the SDK fails to open), to promptly free the stock reserved
// at checkout instead of holding it until the 24h abandoned-order sweep.
//
// Ground truth is Razorpay, never the client: if the payment was actually
// captured we SETTLE the order to paid (+ confirmation email); only a genuinely
// unpaid order is cancelled, and the restore trigger frees its reserved stock.
// On a transient Razorpay error we do NOTHING (the reconcile sweep retries) so a
// paid order is never wrongly released. Safe for guests — gated by knowing the
// razorpay_order_id (a per-checkout secret) and re-checked against Razorpay.
import { corsHeaders, db, json, rateLimited } from "../_shared/util.ts";
import { sendOrderEmail } from "../_shared/email.ts";

const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const rl = await rateLimited(req, "release-reservation", 30, 60);
  if (rl) return rl;

  try {
    const { razorpayOrderId } = await req.json().catch(() => ({}));
    if (!razorpayOrderId) return json({ error: "missing razorpayOrderId" }, 400);

    const gRes = await db(`orders?razorpay_order_id=eq.${razorpayOrderId}&select=id,total,status,payment_status,stock_reserved`);
    if (!gRes.ok) return json({ error: "lookup_failed" }, 500);
    const rows = await gRes.json().catch(() => []);
    const o = Array.isArray(rows) && rows[0];
    if (!o) return json({ ok: true, noop: true });
    // Only act on a still-open, unpaid online order ('failed' too — the
    // payment.failed webhook may have set it before this dismiss call arrives).
    if (o.status === "cancelled" || (o.payment_status !== "pending" && o.payment_status !== "failed")) return json({ ok: true, noop: true });

    // Ask Razorpay whether the payment was actually captured.
    const auth = btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`);
    let captured: string | null = null, unknown = false;
    try {
      const pr = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}/payments`, { headers: { Authorization: `Basic ${auth}` } });
      if (!pr.ok) unknown = true;
      else {
        const pj = await pr.json();
        const cap = (pj.items || []).find((p: { status: string }) => p.status === "captured");
        captured = cap?.id || null;
      }
    } catch { unknown = true; }

    if (captured) {
      // Actually paid → settle, do NOT release.
      const uRes = await db(`orders?id=eq.${o.id}&status=neq.cancelled&payment_status=neq.paid`, {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ payment_status: "paid", razorpay_payment_id: captured, amount_paid: o.total }),
      });
      const changed = uRes.ok ? await uRes.json().catch(() => []) : [];
      if (Array.isArray(changed) && changed.length) await sendOrderEmail(String(o.id), "confirmation");
      return json({ ok: true, settled: true });
    }
    if (unknown) return json({ ok: true, deferred: true }); // API blip — leave it for the sweep

    // Genuinely unpaid → cancel; the restore trigger frees the reserved stock.
    await db(`orders?id=eq.${o.id}&payment_status=in.(pending,failed)&status=neq.cancelled`, {
      method: "PATCH", body: JSON.stringify({ status: "cancelled", payment_status: "failed" }),
    });
    return json({ ok: true, released: true });
  } catch (e) {
    console.error("release-reservation error", e);
    return json({ error: "server_error" }, 500);
  }
});
