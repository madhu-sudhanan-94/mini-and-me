/* ============================ Supabase: config, data mapping, auth ============================ */

export const ADMIN_EMAIL = "madhusudhanana94@gmail.com";

/* ---------- Connection (your live database) ---------- */
export const SUPABASE_URL = "https://sakzhdoxybxmeepzplkr.supabase.co";
export const SUPABASE_KEY = "sb_publishable_6SgjTXE1CdM6dnOPrQtS2A_LVZeC0xj";
export const SB_HEADERS = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" };
export const ANON_HEADERS = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
const SUPA_AUTH = SUPABASE_URL + "/auth/v1";

// Map a Supabase products row → the shape the UI uses
export function mapDbProduct(r) {
  return {
    id: r.id,
    name: r.name,
    cat: r.category,
    shape: r.shape,
    price: r.price,
    original: r.original_price || undefined,
    colors: (r.colors && r.colors.length) ? r.colors : ["#2563EB"],
    sizes: (r.sizes && r.sizes.length) ? r.sizes : ["Free"],
    desc: r.description || "",
    trending: !!r.trending,
    tag: r.tag || undefined,
    images: r.image_url ? [r.image_url] : [],
  };
}

/* ---------- Auth (real email + password login) ---------- */
export async function authSignUp(email, password) {
  const res = await fetch(SUPA_AUTH + "/signup", { method: "POST", headers: ANON_HEADERS, body: JSON.stringify({ email, password }) });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}
export async function authSignIn(email, password) {
  const res = await fetch(SUPA_AUTH + "/token?grant_type=password", { method: "POST", headers: ANON_HEADERS, body: JSON.stringify({ email, password }) });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}
export async function authRefresh(refresh_token) {
  try {
    const res = await fetch(SUPA_AUTH + "/token?grant_type=refresh_token", { method: "POST", headers: ANON_HEADERS, body: JSON.stringify({ refresh_token }) });
    return res.ok ? await res.json().catch(() => null) : null;
  } catch { return null; }
}
export async function authSignOut(token) {
  try { await fetch(SUPA_AUTH + "/logout", { method: "POST", headers: { ...ANON_HEADERS, Authorization: "Bearer " + token } }); } catch {}
}
export function authErrText(data) {
  return data?.error_description || data?.msg || data?.error || data?.message || "Something went wrong. Please try again.";
}
