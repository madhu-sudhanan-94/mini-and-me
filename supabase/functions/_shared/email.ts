// Transactional order emails via Resend. Idempotent per (order, kind) using the
// claim_order_email() DB function, so concurrent callers never double-send.
import { db } from "./util.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = Deno.env.get("ORDER_EMAIL_FROM") || "Mini & Me <onboarding@resend.dev>";
const BRAND = "Mini & Me";
const BRAND_COLOR = "#2563EB";

type Kind = "confirmation" | "shipped" | "delivered";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const inr = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN");

function addrLines(a: Record<string, string> | null): string[] {
  if (!a) return [];
  return [
    a.full_name,
    [a.line1, a.line2].filter(Boolean).join(", "),
    [a.area, a.city].filter(Boolean).join(", "),
    [a.state, a.pincode].filter(Boolean).join(" - "),
    a.country,
  ].filter(Boolean);
}

function layout(inner: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
    <div style="background:${BRAND_COLOR};padding:20px 24px;"><span style="color:#fff;font-size:20px;font-weight:800;">${BRAND}</span></div>
    <div style="padding:24px;color:#0f172a;">${inner}</div>
    <div style="padding:16px 24px;border-top:1px solid #eef2f7;color:#94a3b8;font-size:12px;">Thanks for shopping with ${BRAND}. Questions? Just reply to this email.</div>
  </div>
</div>`;
}

function itemsTable(items: Record<string, unknown>[]): string {
  const rows = (items || []).map((it) => `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #eef2f7;font-size:14px;">${esc(it.product_name)}${it.size ? ` <span style="color:#94a3b8;">· ${esc(it.size)}</span>` : ""} <span style="color:#94a3b8;">× ${(it.qty as number) || 1}</span></td>
    <td style="padding:8px 0;border-bottom:1px solid #eef2f7;text-align:right;font-size:14px;">${inr(((it.unit_price as number) || 0) * ((it.qty as number) || 1))}</td>
  </tr>`).join("");
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;">${rows}</table>`;
}

function totalsBlock(o: Record<string, number>): string {
  const line = (label: string, val: string, strong = false) =>
    `<tr><td style="padding:3px 0;color:${strong ? "#0f172a" : "#64748b"};font-weight:${strong ? 700 : 400};font-size:14px;">${label}</td><td style="padding:3px 0;text-align:right;font-weight:${strong ? 700 : 400};font-size:14px;">${val}</td></tr>`;
  let rows = "";
  if (o.subtotal != null) rows += line("Subtotal", inr(o.subtotal));
  if (o.gst) rows += line(`GST (${o.gst_rate_pct || 5}%, incl.)`, inr(o.gst));
  if (o.discount) rows += line("Discount", "−" + inr(o.discount));
  rows += line("Delivery", o.delivery_fee ? inr(o.delivery_fee) : "Free");
  if (o.gift_wrap_fee) rows += line("Gift wrapping", inr(o.gift_wrap_fee));
  rows += line("Total", inr(o.total), true);
  return `<table style="width:100%;border-collapse:collapse;border-top:1px solid #eef2f7;margin-top:6px;">${rows}</table>`;
}

function addressBlock(a: Record<string, string> | null): string {
  const lines = addrLines(a);
  if (!lines.length) return "";
  return `<div style="margin-top:18px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px;">Delivery address</div><div style="font-size:13px;color:#475569;line-height:1.6;">${lines.map(esc).join("<br/>")}</div></div>`;
}

// deno-lint-ignore no-explicit-any
function render(o: any, kind: Kind): { subject: string; html: string } {
  const name = o.customer_name ? esc(String(o.customer_name).split(" ")[0]) : "there";
  const ref = esc(o.ref || o.id);
  if (kind === "shipped") {
    return {
      subject: `Your ${BRAND} order #${ref} has shipped 🚚`,
      html: layout(`<h1 style="font-size:20px;margin:0 0 8px;">Your order is on its way 🚚</h1>
        <p style="color:#475569;font-size:14px;margin:0 0 4px;">Hi ${name}, order <b>#${ref}</b> has shipped and is heading your way.</p>
        ${itemsTable(o.order_items)}${addressBlock(o.shipping_address)}`),
    };
  }
  if (kind === "delivered") {
    return {
      subject: `Your ${BRAND} order #${ref} was delivered ✅`,
      html: layout(`<h1 style="font-size:20px;margin:0 0 8px;">Delivered ✅</h1>
        <p style="color:#475569;font-size:14px;margin:0 0 4px;">Hi ${name}, order <b>#${ref}</b> has been delivered. We hope you love it! 💙</p>
        ${itemsTable(o.order_items)}`),
    };
  }
  return {
    subject: `Order confirmed — ${BRAND} #${ref} 🎉`,
    html: layout(`<h1 style="font-size:20px;margin:0 0 8px;">Order confirmed 🎉</h1>
      <p style="color:#475569;font-size:14px;margin:0 0 4px;">Thanks ${name}! We've received order <b>#${ref}</b> and we'll email you when it ships.</p>
      ${itemsTable(o.order_items)}${totalsBlock(o)}${addressBlock(o.shipping_address)}`),
  };
}

async function claim(orderId: string, kind: string): Promise<boolean> {
  const r = await db("rpc/claim_order_email", { method: "POST", body: JSON.stringify({ p_order: String(orderId), p_kind: kind }) });
  if (!r.ok) { console.error("claim_order_email failed", await r.text()); return false; }
  return (await r.json()) === true;
}

async function release(orderId: string, kind: string): Promise<void> {
  try {
    await db("rpc/release_order_email", { method: "POST", body: JSON.stringify({ p_order: String(orderId), p_kind: kind }) });
  } catch (e) {
    console.error("release_order_email failed", e);
  }
}

// Send the given email for an order exactly once: claim → send → unclaim on
// failure so a later retry (webhook re-delivery / re-verify / admin re-action)
// can re-send. NEVER throws (so it can't break the payment flow), and no-ops if
// email isn't configured or the order has no email address.
export async function sendOrderEmail(orderId: string, kind: Kind): Promise<void> {
  try {
    if (!RESEND_API_KEY || !orderId) return;
    const oRes = await db(`orders?id=eq.${orderId}&select=*,order_items(*)`);
    if (!oRes.ok) { console.error("[email] order lookup failed", await oRes.text()); return; }
    const rows = await oRes.json();
    const o = rows?.[0];
    if (!o || !o.customer_email) return; // nothing to send to
    if (!(await claim(orderId, kind))) return; // already sent / in-flight

    let ok = false;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const { subject, html } = render(o, kind);
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: o.customer_email, subject, html }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      ok = r.ok;
      if (!r.ok) console.error("[email] resend send failed", r.status, await r.text());
    } catch (e) {
      console.error("[email] resend error", e);
    }
    if (!ok) await release(orderId, kind); // let a later retry re-send
  } catch (e) {
    console.error("[email] sendOrderEmail error", e); // never propagate to the caller
  }
}
