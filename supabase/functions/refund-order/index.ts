// refund-order — admin refunds an order. Two modes:
//   • FULL (no `amount`): cancel the order and refund whatever is still
//     refundable at Razorpay (captured − already-refunded), then mark it
//     cancelled+refunded (the DB trigger restores stock). If a partial refund
//     was already done out-of-band in the Razorpay dashboard, only the remainder
//     is refunded — and if nothing remains, it still cancels cleanly instead of
//     failing. For COD/unpaid orders it just marks cancelled.
//   • PARTIAL (`amount` in ₹): refund that amount (capped at the remaining
//     refundable) WITHOUT cancelling, tracking the running total in
//     amount_refunded. Online paid orders only.
// Admin-gated by token.
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
    const { orderId, userToken, amount } = await req.json().catch(() => ({}));
    if (!orderId) return json({ error: "missing orderId" }, 400);
    if (!(await isAdmin(userToken))) return json({ error: "not_authorized" }, 403);

    // Partial refund when a positive `amount` (₹) is supplied; else full cancel.
    const partial = amount != null;
    const requestedPaise = partial ? Math.round(Number(amount) * 100) : null;
    if (partial && (!Number.isFinite(requestedPaise as number) || (requestedPaise as number) <= 0)) {
      return json({ error: "bad_amount" }, 400);
    }

    const gRes = await db(`orders?id=eq.${orderId}&select=id,total,amount_paid,amount_refunded,payment_method,payment_status,razorpay_order_id,razorpay_payment_id,status`);
    if (!gRes.ok) return json({ error: "lookup_failed" }, 500);
    const rows = await gRes.json();
    if (!Array.isArray(rows) || !rows.length) return json({ error: "order not found" }, 404);
    const o = rows[0];
    if (o.status === "cancelled") return json({ ok: true, alreadyCancelled: true, refunded: o.payment_status === "refunded" });

    const auth = btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`);
    const rzp = (path: string, init: RequestInit = {}) =>
      fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers: { Authorization: `Basic ${auth}`, ...(init.headers || {}) } });

    // Resolve the captured payment + its authoritative amounts (handles the
    // captured-but-pending window and any out-of-band dashboard refund).
    let paymentId: string | null = o.payment_status === "paid" ? o.razorpay_payment_id : null;
    if (!paymentId && o.razorpay_order_id) {
      const pr = await rzp(`/orders/${o.razorpay_order_id}/payments`);
      if (pr.ok) {
        const pj = await pr.json();
        const cap = (pj.items || []).find((p: { status: string }) => p.status === "captured");
        if (cap) paymentId = cap.id;
      }
    }

    let capturedPaise = 0, refundedPaise = 0;
    if (paymentId) {
      const gp = await rzp(`/payments/${paymentId}`);
      const pdata = gp.ok ? await gp.json() : null;
      capturedPaise = pdata?.amount ?? ((o.amount_paid ?? o.total) * 100);
      // Fall back to the KNOWN prior refund total (not 0) if the GET blips —
      // else a full cancel over-requests and a repeat partial clobbers the total.
      refundedPaise = pdata?.amount_refunded ?? ((o.amount_refunded ?? 0) * 100);
    }
    const remainingPaise = Math.max(0, capturedPaise - refundedPaise);

    // ---- PARTIAL refund: refund `amount`, don't cancel ----
    if (partial) {
      if (o.payment_method !== "online" || !paymentId) return json({ error: "not_refundable" }, 409);
      const refundPaise = Math.min(requestedPaise as number, remainingPaise);
      if (refundPaise <= 0) return json({ error: "nothing_to_refund" }, 409);
      const rRes = await rzp(`/payments/${paymentId}/refund`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: refundPaise, speed: "normal" }),
      });
      if (!rRes.ok) { console.error("razorpay partial refund failed", await rRes.text()); return json({ error: "refund_failed" }, 502); }
      const totalRefundedRupees = Math.round((refundedPaise + refundPaise) / 100);
      const uRes = await db(`orders?id=eq.${orderId}`, { method: "PATCH", body: JSON.stringify({ amount_refunded: totalRefundedRupees }) });
      if (!uRes.ok) console.error("partial-refund amount_refunded update failed", await uRes.text());
      return json({ ok: true, partial: true, refundedNow: Math.round(refundPaise / 100), amountRefunded: totalRefundedRupees });
    }

    // ---- FULL cancel (+ refund the remainder) ----
    let refunded = false, totalRefundedRupees: number | null = null;
    if (o.payment_method === "online" && paymentId) {
      if (remainingPaise > 0) {
        const rRes = await rzp(`/payments/${paymentId}/refund`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: remainingPaise, speed: "normal" }),
        });
        if (!rRes.ok) { console.error("razorpay refund failed", await rRes.text()); return json({ error: "refund_failed" }, 502); }
      }
      // Either we just refunded the remainder, or it was already fully refunded
      // out-of-band — in both cases the payment is now fully returned.
      refunded = true;
      totalRefundedRupees = Math.round(capturedPaise / 100);
    }

    // Cancel (+ mark refunded when money was returned). Service role bypasses the
    // guard; the DB trigger restores stock for orders that were actually paid.
    const patch: Record<string, unknown> = refunded
      ? { status: "cancelled", payment_status: "refunded", amount_refunded: totalRefundedRupees }
      : { status: "cancelled" };
    const uRes = await db(`orders?id=eq.${orderId}`, { method: "PATCH", body: JSON.stringify(patch) });
    if (!uRes.ok) { console.error("order cancel-update failed", await uRes.text()); return json({ error: "update_failed" }, 500); }
    return json({ ok: true, refunded, amountRefunded: totalRefundedRupees });
  } catch (e) {
    console.error("refund-order error", e);
    return json({ error: "server_error" }, 500);
  }
});
