/* Razorpay client helpers — talk to the Supabase edge functions and open the
   Razorpay Checkout modal. No secret keys here; the key_id comes back from the
   create-razorpay-order function. */
import { SUPABASE_URL, SUPABASE_KEY } from "./supabase.js";
import { BRAND } from "../brand.config.js";

const FN = (name) => `${SUPABASE_URL}/functions/v1/${name}`;
const FN_HEADERS = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" };

// Ask the edge function to price the order server-side + create a Razorpay order.
export async function createRazorpayOrder(payload) {
  try {
    const res = await fetch(FN("create-razorpay-order"), { method: "POST", headers: FN_HEADERS, body: JSON.stringify(payload) });
    return await res.json().catch(() => ({ error: "bad response" }));
  } catch {
    return { error: "network" };
  }
}

// Verify a completed payment server-side (signature check → mark order paid).
export async function verifyRazorpayPayment(payload) {
  try {
    const res = await fetch(FN("verify-payment"), { method: "POST", headers: FN_HEADERS, body: JSON.stringify(payload) });
    return await res.json().catch(() => ({ ok: false }));
  } catch {
    return { ok: false };
  }
}

let sdkPromise = null;
function loadSdk() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => { sdkPromise = null; resolve(false); };
    document.body.appendChild(s);
  });
  return sdkPromise;
}

// Opens Razorpay Checkout. Resolves with:
//   - the success response ({ razorpay_payment_id, razorpay_order_id, razorpay_signature })
//   - null if the customer dismisses the modal
//   - { __error: "sdk" } if the SDK/CDN could not load (distinct from a dismiss)
export async function openRazorpayCheckout({ keyId, orderId, amount, description, prefill }) {
  const ok = await loadSdk();
  if (!ok || !window.Razorpay) return { __error: "sdk" };
  return new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    const rzp = new window.Razorpay({
      key: keyId,
      order_id: orderId,
      amount,
      currency: "INR",
      name: BRAND.name,
      description: description || "",
      prefill: prefill || {},
      theme: { color: "#2563EB" },
      handler: (resp) => done(resp),
      modal: { ondismiss: () => done(null) },
    });
    rzp.open();
  });
}
