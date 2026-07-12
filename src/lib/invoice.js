/* ============================ Printable receipt ============================ */
import { BRAND } from "../brand.config.js";
import { SUPPORT } from "../content/legal.js";
import { formatINR } from "./format.js";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function fmtDate(ts) {
  try { return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return ""; }
}

// Address (a shipping snapshot object) → array of display lines.
function addrLines(a) {
  if (!a) return [];
  return [
    a.full_name,
    [a.line1, a.line2].filter(Boolean).join(", "),
    [a.area, a.city].filter(Boolean).join(", "),
    [a.state, a.pincode].filter(Boolean).join(" - "),
    a.country,
  ].filter(Boolean);
}

// Build a self-contained, print-friendly HTML document for one order.
export function buildInvoiceHTML(order) {
  const o = order || {};
  const items = o.items || [];
  const subtotal = o.subtotal != null ? o.subtotal : (o.total || 0);
  const gst = o.gst || 0;
  const ratePct = o.ratePct != null ? o.ratePct : 5;
  const discount = o.discount || 0;
  const delivery = o.delivery_fee || 0;
  const giftWrap = o.gift_wrap_fee || 0;
  const billTo = [o.name, o.phone, o.email].filter(Boolean);
  const ship = addrLines(o.shipping);

  const rows = items.map((it, i) => {
    const amount = (it.unit_price || 0) * (it.qty || 0);
    const meta = [it.size, it.color ? "colour" : null].filter(Boolean); // colour is a hex; label generically
    return `<tr>
      <td class="c">${i + 1}</td>
      <td>${esc(it.product_name || "Item")}${it.size ? ` <span class="muted">· ${esc(it.size)}</span>` : ""}</td>
      <td class="r">${it.qty || 0}</td>
      <td class="r">${formatINR(it.unit_price || 0)}</td>
      <td class="r">${formatINR(amount)}</td>
    </tr>`;
  }).join("");

  const totalRow = (label, value, opts = {}) =>
    `<tr class="${opts.strong ? "strong" : ""}"><td colspan="3"></td><td class="r ${opts.muted ? "muted" : ""}">${esc(label)}</td><td class="r ${opts.muted ? "muted" : ""}">${value}</td></tr>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${esc(o.id || "")} — ${esc(BRAND.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 28px; }
  .sheet { max-width: 720px; margin: 0 auto; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 14px; }
  .brand { font-size: 22px; font-weight: 800; color: #2563eb; }
  .muted { color: #64748b; }
  h1 { font-size: 15px; letter-spacing: .12em; text-transform: uppercase; color: #334155; margin: 0; }
  .meta { text-align: right; font-size: 12px; }
  .cols { display: flex; gap: 24px; margin: 18px 0; font-size: 12.5px; }
  .cols > div { flex: 1; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 6px; }
  th { text-align: left; background: #f1f5f9; color: #475569; font-weight: 600; padding: 8px 10px; font-size: 11px; }
  td { padding: 8px 10px; border-bottom: 1px solid #eef2f7; }
  td.r, th.r { text-align: right; }
  td.c { text-align: center; color: #94a3b8; }
  tr.strong td { font-weight: 800; font-size: 13.5px; border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 10px; }
  .note { margin-top: 22px; font-size: 11px; color: #94a3b8; line-height: 1.6; }
  .btns { text-align: center; margin-bottom: 18px; }
  button { font: inherit; font-weight: 600; background: #2563eb; color: #fff; border: 0; border-radius: 999px; padding: 9px 20px; cursor: pointer; }
  @media print { .btns { display: none; } body { padding: 0; } }
</style></head>
<body>
  <div class="sheet">
    <div class="btns"><button onclick="window.print()">Print / Save as PDF</button></div>
    <div class="top">
      <div>
        <div class="brand">${esc(BRAND.name)}</div>
        <div class="muted" style="font-size:12px;margin-top:4px">
          ${esc(SUPPORT.address || "")}<br/>
          ${SUPPORT.gstin ? "GSTIN: " + esc(SUPPORT.gstin) + "<br/>" : ""}
          ${esc(SUPPORT.email || "")} · ${esc(SUPPORT.phone || "")}
        </div>
      </div>
      <div class="meta">
        <h1>Receipt</h1>
        <div class="muted" style="margin-top:6px">
          Invoice&nbsp;No: <b>${esc(o.id || "")}</b><br/>
          Date: ${esc(fmtDate(o.ts))}
        </div>
      </div>
    </div>

    <div class="cols">
      <div>
        <div class="label">Bill to</div>
        ${billTo.map((l) => esc(l)).join("<br/>") || '<span class="muted">—</span>'}
      </div>
      <div>
        <div class="label">Ship to</div>
        ${ship.length ? ship.map((l) => esc(l)).join("<br/>") : '<span class="muted">Same as contact</span>'}
      </div>
    </div>

    <table>
      <thead><tr><th class="c" style="width:34px">#</th><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
      <tbody>
        ${rows || '<tr><td colspan="5" class="muted c">No items</td></tr>'}
        ${totalRow("Subtotal", formatINR(subtotal), { muted: true })}
        ${gst > 0 ? totalRow(`GST (${ratePct}%)`, formatINR(gst), { muted: true }) : ""}
        ${discount > 0 ? totalRow("Discount", "−" + formatINR(discount), { muted: true }) : ""}
        ${totalRow("Delivery", delivery ? formatINR(delivery) : "Free", { muted: true })}
        ${giftWrap > 0 ? totalRow("Gift wrapping", formatINR(giftWrap), { muted: true }) : ""}
        ${totalRow("Grand Total", formatINR(o.total || 0), { strong: true })}
      </tbody>
    </table>

    <p class="note">
      This is a computer-generated receipt and does not require a signature.<br/>
      Thank you for shopping with ${esc(BRAND.name)}.
    </p>
  </div>
</body></html>`;
}

// Open the invoice in a new tab (with a Print / Save-as-PDF button).
export function printInvoice(order) {
  if (typeof window === "undefined") return false;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(buildInvoiceHTML(order));
  w.document.close();
  w.focus();
  return true;
}
