// reconcile-orders — closes the "card charged but order stuck pending" gap and
// cleans up abandoned checkouts. Ground truth is always Razorpay, never a client
// claim. Two modes, chosen by the caller's token:
//
//   • ADMIN token → sweep ALL unpaid (pending/failed) online orders. For each: if
//     Razorpay shows a captured payment, settle it to 'paid' (the confirm trigger
//     then decrements stock) and send the confirmation email; else, if the order
//     is older than ABANDON_HOURS with no capture, cancel it (an abandoned
//     checkout — it never became paid, so no stock was decremented).
//
//   • USER token → settle only THIS user's captured-but-pending orders so a
//     verify-payment blip can't leave a paying customer's order invisible in
//     "My Orders". Never cancels (cleanup is the admin's job).
//
// verify_jwt is disabled (see config.toml); we verify the token ourselves.
import { corsHeaders, db, json, rateLimited } from "../_shared/util.ts";
import { sendOrderEmail } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

const ABANDON_HOURS = 24; // pending online orders older than this (with no capture) are abandoned
const MAX_ORDERS = 50;    // bound the Razorpay calls per invocation

// Resolve the token's user, and whether they're an admin. Never trust a client
// claim — only the verified token subject + the profiles.role we look up.
async function whoAmI(token?: string | null): Promise<{ uid: string | null; admin: boolean }> {
  if (!token) return { uid: null, admin: false };
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return { uid: null, admin: false };
    const u = await r.json();
    if (!u?.id) return { uid: null, admin: false };
    const p = await db(`profiles?id=eq.${u.id}&select=role`);
    const rows = await p.json().catch(() => []);
    const admin = Array.isArray(rows) && rows[0]?.role === "admin";
    return { uid: u.id, admin };
  } catch {
    return { uid: null, admin: false };
  }
}

// Ask Razorpay about this order's payments. TRI-STATE so we never conflate "the
// API failed" with "there is definitively no capture" — cancelling an abandoned
// order on the latter is fine, but doing it on the former would cancel a paid
// order with no refund. On "unknown" the caller must leave the order untouched
// so a later sweep (or the webhook) can retry.
//   { state: "captured", payId } — a payment was captured
//   { state: "none" }            — Razorpay answered 2xx with no captured payment
//   { state: "unknown" }         — the lookup failed (non-2xx / network / parse)
type CaptureStatus = { state: "captured"; payId: string } | { state: "none" } | { state: "unknown" };
async function captureStatus(auth: string, rzpOrderId: string): Promise<CaptureStatus> {
  try {
    const pr = await fetch(`https://api.razorpay.com/v1/orders/${rzpOrderId}/payments`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!pr.ok) return { state: "unknown" };
    const pj = await pr.json();
    const cap = (pj.items || []).find((p: { status: string }) => p.status === "captured");
    return cap?.id ? { state: "captured", payId: cap.id } : { state: "none" };
  } catch {
    return { state: "unknown" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const rl = await rateLimited(req, "reconcile-orders", 30, 60);
  if (rl) return rl;

  try {
    const { userToken } = await req.json().catch(() => ({}));
    const { uid, admin } = await whoAmI(userToken);
    // A known caller is required: guests (user_id null) rely on the webhook.
    if (!admin && !uid) return json({ error: "not_authorized" }, 403);

    // Unpaid online orders that reached Razorpay (have an order id). 'failed' is
    // included so a payment.failed order (which reserved stock at checkout) is
    // reclaimed too — otherwise its reserved stock would leak.
    let path = `orders?payment_method=eq.online&payment_status=in.(pending,failed)&status=neq.cancelled&razorpay_order_id=not.is.null&select=id,total,created_at,razorpay_order_id&order=created_at.asc&limit=${MAX_ORDERS}`;
    if (!admin) path += `&user_id=eq.${uid}`;

    const gRes = await db(path);
    if (!gRes.ok) return json({ error: "lookup_failed" }, 500);
    const orders = await gRes.json().catch(() => []);
    if (!Array.isArray(orders) || !orders.length) return json({ ok: true, settled: 0, cancelled: 0 });

    const auth = btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`);
    const cutoff = Date.now() - ABANDON_HOURS * 3600 * 1000;
    let settled = 0, cancelled = 0;

    for (const o of orders) {
      const cap = await captureStatus(auth, o.razorpay_order_id);
      if (cap.state === "captured") {
        // Settle. Guards keep it idempotent + never resurrect a cancelled order;
        // return=representation tells us if a row actually flipped to paid, so we
        // only count + email on a real change (not on an already-paid no-op).
        const uRes = await db(`orders?id=eq.${o.id}&status=neq.cancelled&payment_status=neq.paid`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ payment_status: "paid", razorpay_payment_id: cap.payId, amount_paid: o.total }),
        });
        const changed = uRes.ok ? await uRes.json().catch(() => []) : [];
        if (Array.isArray(changed) && changed.length) {
          settled++;
          await sendOrderEmail(String(o.id), "confirmation"); // idempotent
        }
      } else if (cap.state === "none" && admin && new Date(o.created_at).getTime() < cutoff) {
        // Abandoned: Razorpay 2xx-CONFIRMED no capture AND older than the window.
        // Cancel it (it never became paid, so no stock was decremented). On
        // "unknown" we do nothing — a transient API error must never cancel a
        // possibly-paid order.
        const cRes = await db(`orders?id=eq.${o.id}&payment_status=in.(pending,failed)&status=neq.cancelled`, {
          method: "PATCH",
          body: JSON.stringify({ status: "cancelled", payment_status: "failed" }),
        });
        if (cRes.ok) cancelled++;
      }
    }

    return json({ ok: true, settled, cancelled });
  } catch (e) {
    console.error("reconcile-orders error", e);
    return json({ error: "server_error" }, 500);
  }
});
