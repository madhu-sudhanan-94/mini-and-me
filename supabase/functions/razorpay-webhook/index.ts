// razorpay-webhook — the source of truth for payment state. Razorpay calls this
// server-to-server, so it survives the customer closing the tab mid-payment.
// Configure it in Razorpay Dashboard → Settings → Webhooks with events
// payment.captured and payment.failed, and set RAZORPAY_WEBHOOK_SECRET to match.
import { db, hmacHex, json, safeEqual } from "../_shared/util.ts";

const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);

  try {
    const raw = await req.text(); // must hash the RAW body, before JSON.parse
    const sig = req.headers.get("x-razorpay-signature") || "";
    const expected = await hmacHex(WEBHOOK_SECRET, raw);
    if (!safeEqual(expected, sig)) return json({ ok: false, error: "bad signature" }, 400);

    const evt = JSON.parse(raw);
    const entity = evt?.payload?.payment?.entity;
    const orderId = entity?.order_id;
    if (!orderId) return json({ ok: true, ignored: true });

    // status=neq.cancelled: never resurrect a cancelled/refunded order.
    if (evt.event === "payment.captured") {
      await db(`orders?razorpay_order_id=eq.${orderId}&payment_status=neq.paid&status=neq.cancelled`, {
        method: "PATCH",
        body: JSON.stringify({
          payment_status: "paid",
          razorpay_payment_id: entity.id,
          amount_paid: entity.amount ? Math.round(entity.amount / 100) : null,
        }),
      });
    } else if (evt.event === "payment.failed") {
      await db(`orders?razorpay_order_id=eq.${orderId}&payment_status=eq.pending&status=neq.cancelled`, {
        method: "PATCH",
        body: JSON.stringify({ payment_status: "failed", razorpay_payment_id: entity.id }),
      });
    }

    return json({ ok: true });
  } catch (e) {
    console.error("razorpay-webhook error", e);
    return json({ ok: false, error: "server_error" }, 500);
  }
});
