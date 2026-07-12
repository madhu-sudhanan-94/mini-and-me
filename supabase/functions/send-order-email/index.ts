// send-order-email — admin-triggered shipped/delivered notifications. The
// order-confirmation email is sent server-side from verify-payment/webhook, not
// here. Admin-gated by token.
import { background, corsHeaders, db, json } from "../_shared/util.ts";
import { sendOrderEmail } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function isAdmin(token?: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` } });
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

  try {
    const { orderId, kind, userToken } = await req.json().catch(() => ({}));
    if (!orderId || (kind !== "shipped" && kind !== "delivered")) return json({ error: "bad request" }, 400);
    if (!(await isAdmin(userToken))) return json({ error: "not_authorized" }, 403);
    background(sendOrderEmail(orderId, kind));
    return json({ ok: true });
  } catch (e) {
    console.error("send-order-email error", e);
    return json({ error: "server_error" }, 500);
  }
});
