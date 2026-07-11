-- ============================================================
-- Mini & Me — feature migration (2026-07-11)
-- Brings the database up to date with features shipped since the base schema:
--   • full order breakdown (items total, GST split, coupon/discount,
--     delivery, gift wrap, savings, billing address)
--   • product ratings & reviews table
-- Idempotent + additive — safe to run multiple times, and safe on a live DB.
-- Run in the Supabase SQL editor:  https://supabase.com/dashboard/project/_/sql/new
-- (Base tables live in schema.sql; this file only ADDS to them.)
-- ============================================================

-- ------------------------------------------------------------
-- orders: persist the full checkout breakdown.
-- The app already computes ALL of these in placeOrder(); until now only
-- `total`, `shipping_address` and `note` were saved, so OrderDetail had to
-- re-derive the breakdown from fixed shop rates (and got it wrong when a
-- coupon or gift wrap was involved). These columns store the real numbers.
-- ------------------------------------------------------------
alter table public.orders add column if not exists items_total    integer not null default 0;     -- goods total before adjustments (₹, GST-incl)
alter table public.orders add column if not exists subtotal       integer not null default 0;     -- taxable value (goods total − GST) (₹)
alter table public.orders add column if not exists gst            integer not null default 0;     -- GST amount within the total (₹)
alter table public.orders add column if not exists gst_rate_pct   numeric(5,2);                    -- GST rate applied (e.g. 5.00, 12.00)
alter table public.orders add column if not exists discount       integer not null default 0;     -- coupon discount (₹)
alter table public.orders add column if not exists coupon_code    text;                            -- applied coupon, e.g. 'SAVE10'
alter table public.orders add column if not exists delivery_fee   integer not null default 0;     -- delivery charge (₹, 0 = free)
alter table public.orders add column if not exists gift_wrap      boolean not null default false; -- gift wrapping chosen?
alter table public.orders add column if not exists gift_wrap_fee  integer not null default 0;     -- gift wrap charge (₹)
alter table public.orders add column if not exists total_saved    integer not null default 0;     -- 'you saved ₹X' (MRP savings + discount)
alter table public.orders add column if not exists billing_address jsonb;                          -- set when billing ≠ delivery

-- ------------------------------------------------------------
-- reviews (product ratings + comments).
-- Currently kept in localStorage ('mm_reviews'), so ratings never leave the
-- device and the block always shows "No reviews yet". This is the shared table.
-- Read is public; a signed-in user may post ONE product only if they have a
-- DELIVERED order containing it (verified-buyer reviews). Admins moderate.
-- ------------------------------------------------------------
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id bigint references public.products(id) on delete cascade,
  user_id    uuid   references auth.users(id) on delete set null,
  name       text,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews
  for select using (true);

-- Insert gated on the reviewer owning a DELIVERED order for that product.
-- (For an open "anyone signed-in can review" policy instead, replace the
--  EXISTS clause with just `auth.uid() = user_id`.)
drop policy if exists "reviews_insert_delivered_buyer" on public.reviews;
create policy "reviews_insert_delivered_buyer" on public.reviews
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.user_id = auth.uid()
        and o.status = 'delivered'
        and oi.product_id = reviews.product_id
    )
  );

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete using (auth.uid() = user_id);

drop policy if exists "reviews_admin_all" on public.reviews;
create policy "reviews_admin_all" on public.reviews
  for all
  using      (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists reviews_product_idx on public.reviews (product_id);

-- ------------------------------------------------------------
-- Already covered by schema.sql — NO change needed:
--   • Toys category     → `products.category` is free text ('toys' works).
--   • Custom sizes      → stored in `products.sizes` text[].
--   • Per-size stock    → `products.size_stock jsonb` already exists.
--   • Order note        → `orders.note` already exists (but isn't displayed yet — see code changes).
-- ============================================================
