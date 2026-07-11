# Payments setup — Razorpay + Supabase Edge Functions

The code is built and ready. These are the one-time steps to make it live. You
can do **all of it in Razorpay test mode** before your KYC is approved.

Project ref (from your Supabase URL): **`sakzhdoxybxmeepzplkr`**

---

## 1. Razorpay account + test keys
1. Sign up at https://razorpay.com and open the **Dashboard**.
2. Toggle to **Test Mode** (top of the dashboard).
3. Settings → **API Keys** → **Generate Test Key** → copy the **Key Id**
   (`rzp_test_…`) and **Key Secret**. (You'll only see the secret once.)

## 2. Install + link the Supabase CLI
```bash
brew install supabase/tap/supabase
supabase login                                   # opens a browser
supabase link --project-ref sakzhdoxybxmeepzplkr
```

## 3. Set the secrets (server-only — never in the app code)
```bash
supabase secrets set \
  RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx \
  RAZORPAY_KEY_SECRET=your_test_secret
# RAZORPAY_WEBHOOK_SECRET is set in step 5, after you create the webhook.
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do
not set them.

## 4. Deploy the functions
```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-payment
supabase functions deploy razorpay-webhook
```
(`supabase/config.toml` already sets `verify_jwt = false` for these three, since
guests must be able to check out and Razorpay calls the webhook without a JWT.)

## 5. Create the webhook
1. Razorpay Dashboard → Settings → **Webhooks** → **Add New Webhook**.
2. URL: `https://sakzhdoxybxmeepzplkr.supabase.co/functions/v1/razorpay-webhook`
3. Active events: **`payment.captured`** and **`payment.failed`**.
4. Set a **Secret** (any strong random string), save, then register it:
```bash
supabase secrets set RAZORPAY_WEBHOOK_SECRET=the_secret_you_just_set
```

## 6. Run the database migrations (in order)
The online path writes the order breakdown (subtotal/gst/discount/…), so those
columns must exist first. In the Supabase **SQL editor**, run any you haven't yet
(all idempotent — safe to re-run):
1. `supabase/2026-07-11-feature-migration.sql` — order breakdown + reviews (likely already applied)
2. `supabase/2026-07-11-security-hardening.sql` — RLS hardening (likely already applied)
3. `supabase/2026-07-11-payments-migration.sql` — **new:** payment columns + guard trigger

Until the breakdown columns exist, online checkout falls back to a core insert
but online orders won't carry the itemised breakdown.

## 7. Test
- Open checkout → **Pay online** → use a Razorpay
  [test card](https://razorpay.com/docs/payments/payments/test-card-details/)
  (e.g. `4111 1111 1111 1111`, any future expiry/CVV) or test UPI `success@razorpay`.
- Confirm the order shows `payment_status = 'paid'` in the `orders` table, and
  that the webhook also fires (Dashboard → Webhooks → recent deliveries).
- **Cash on delivery** needs none of the above — it records a `pending` order.

## 8. Go live
1. Complete Razorpay **KYC** (PAN, bank account, business docs).
2. Generate **live keys** (`rzp_live_…`) and re-run step 3 with them.
3. Recreate the webhook in **Live Mode** and re-run step 5.
4. Redeploy is not needed — the functions read keys from secrets.

---

### How it's secured
- The **amount is recomputed server-side** from the `products` table in
  `create-razorpay-order` — the client cannot dictate the price.
- The `key_secret` never leaves Supabase; only the public `key_id` reaches the
  browser.
- The **payment-guard trigger** blocks any normal customer/guest from marking
  their own order `paid` or writing gateway ids — only the edge functions
  (service role) or an admin can. `razorpay_order_id` is uniquely indexed, so a
  payment can only ever confirm the one order it belongs to.
- **Stock is validated server-side**, and the order is attributed only to the
  user id proven by the caller's access token (never a client-supplied id).
- Payments are confirmed by **HMAC signature** (client `verify-payment`) and by
  the **webhook** as the durable backstop.

### Keep in sync
`supabase/functions/_shared/pricing.ts` mirrors `src/shop.config.js` +
`src/lib/format.js`. If you change delivery/gift-wrap/coupon/GST values, update
both, or the server total will diverge from the cart.
