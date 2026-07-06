/* ============================ Persistent storage (safe + optional) ============================ */
// Thin wrapper around an optional window.storage host; no-ops in a plain browser.
export const PKEY = "vk_products_v1";
export const OKEY = "vk_orders_v1";
export const CKEY = "vk_cart_v1";
export const FKEY = "vk_favs_v1";
export const AKEY = "vk_session_v1";

export async function sget(key, shared) {
  try {
    if (typeof window === "undefined" || !window.storage) return null;
    const r = await window.storage.get(key, shared);
    return r ? r.value : null;
  } catch { return null; }
}

export async function sset(key, value, shared) {
  try {
    if (typeof window === "undefined" || !window.storage) return;
    await window.storage.set(key, value, shared);
  } catch {}
}

/* ---- Login session persistence in the real browser, with a "Remember me" choice ----
   Remember ON  → localStorage, kept for up to 30 days (rolling — renewed each visit)
   Remember OFF → sessionStorage (session is cleared when the browser/tab closes) */
export const REMEMBER_DAYS = 30;
const REMEMBER_MS = REMEMBER_DAYS * 24 * 60 * 60 * 1000;
const RKEY = "vk_remember_v1"; // "1" | "0"
const ls = () => { try { return window.localStorage; } catch { return null; } };
const ss = () => { try { return window.sessionStorage; } catch { return null; } };

export function getRemember() {
  try { return (ls()?.getItem(RKEY) ?? "1") !== "0"; } catch { return true; }
}
export function saveSessionLocal(session, remember) {
  try {
    ls()?.setItem(RKEY, remember ? "1" : "0");
    if (!session) { ls()?.removeItem(AKEY); ss()?.removeItem(AKEY); return; }
    if (remember) {
      // stamp a fresh 30-day expiry every time we save (rolling window)
      const wrap = JSON.stringify({ s: session, exp: Date.now() + REMEMBER_MS });
      ls()?.setItem(AKEY, wrap); ss()?.removeItem(AKEY);
    } else {
      // sessionStorage clears itself when the browser closes → no expiry needed
      ss()?.setItem(AKEY, JSON.stringify({ s: session, exp: 0 })); ls()?.removeItem(AKEY);
    }
  } catch {}
}
export function loadSessionLocal() {
  try {
    const raw = ls()?.getItem(AKEY) || ss()?.getItem(AKEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.exp && Date.now() > obj.exp) { clearSessionLocal(); return null; } // >30 days idle → expired
    const s = obj && obj.s ? obj.s : obj; // tolerate a pre-expiry stored shape
    return s ? JSON.stringify(s) : null;
  } catch { return null; }
}
export function clearSessionLocal() {
  try { ls()?.removeItem(AKEY); ss()?.removeItem(AKEY); } catch {}
}
