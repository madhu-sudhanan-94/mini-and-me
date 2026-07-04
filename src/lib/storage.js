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
