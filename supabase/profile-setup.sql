-- ============================================================
-- Mini & Me — Profile feature schema
-- Run once in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/sakzhdoxybxmeepzplkr/sql/new
-- Safe to re-run (uses IF NOT EXISTS / drop-then-create).
-- ============================================================

-- ---------- Phase 1: extra profile fields ----------
alter table public.profiles add column if not exists gender     text;
alter table public.profiles add column if not exists dob        date;
alter table public.profiles add column if not exists avatar_url text;

-- Let a signed-in user read & update THEIR OWN profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- SECURITY: the RLS above lets a user edit their own profile row, which would
-- include the `role` column → self-promotion to admin. Column-level grants
-- restrict WHICH columns a signed-in user may write, so `role` stays untouchable
-- (it's set only by the signup trigger / service role).
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, gender, dob, avatar_url) on public.profiles to authenticated;

-- ---------- Phase 2: delivery addresses ----------
create table if not exists public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text not null default 'Home',   -- Home / Work / Other
  full_name  text,
  phone      text,
  line1      text not null,                   -- flat / house no.
  line2      text,                            -- street
  area       text,                            -- area / landmark
  city       text not null,
  state      text not null,
  pincode    text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- country (added after initial release; backfills existing rows to 'India')
alter table public.addresses add column if not exists country text not null default 'India';

alter table public.addresses enable row level security;

drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own" on public.addresses
  for select using (auth.uid() = user_id);

drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own" on public.addresses
  for insert with check (auth.uid() = user_id);

drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own" on public.addresses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own" on public.addresses
  for delete using (auth.uid() = user_id);

-- ---------- Phase 3: avatars storage bucket ----------
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_user_write" on storage.objects;
create policy "avatars_user_write" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- Phase 4: let users read their own orders ----------
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- ---------- Phase: orders (shipping snapshot, ref, status, admin access) ----------
alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders add column if not exists ref text;         -- human order ref (e.g. PP123456)
-- status column already exists; values used: placed → confirmed → shipped → delivered → cancelled

-- signed-in customers can insert their own orders (guest anon-insert policy, if any, stays as-is)
drop policy if exists "orders_insert_self" on public.orders;
create policy "orders_insert_self" on public.orders
  for insert with check (auth.uid() = user_id);

-- admins can read & manage ALL orders + items
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all" on public.order_items
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- signed-in customers can insert items for their own order
drop policy if exists "order_items_insert_self" on public.order_items;
create policy "order_items_insert_self" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- Guest (anonymous) checkout — version-controlled instead of relying on an
-- off-repo policy. Guests may only create user-less orders.
drop policy if exists "orders_insert_guest" on public.orders;
create policy "orders_insert_guest" on public.orders
  for insert to anon with check (user_id is null);

drop policy if exists "order_items_insert_guest" on public.order_items;
create policy "order_items_insert_guest" on public.order_items
  for insert to anon with check (true);

-- ---------- Products: multiple images + admin image-upload bucket ----------
alter table public.products add column if not exists images text[];

insert into storage.buckets (id, name, public)
  values ('products', 'products', true)
  on conflict (id) do nothing;

drop policy if exists "products_public_read" on storage.objects;
create policy "products_public_read" on storage.objects
  for select using (bucket_id = 'products');

drop policy if exists "products_admin_write" on storage.objects;
create policy "products_admin_write" on storage.objects
  for insert with check (bucket_id = 'products' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "products_admin_update" on storage.objects;
create policy "products_admin_update" on storage.objects
  for update using (bucket_id = 'products' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------- Cart & wishlist synced per user + claim guest orders ----------
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  cart       jsonb not null default '[]',
  favorites  jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;

drop policy if exists "user_state_own" on public.user_state;
create policy "user_state_own" on public.user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Let a signed-in user claim their own guest orders (user_id null + matching email).
-- Both emails must be non-empty so a null/empty email can never match another.
drop policy if exists "orders_claim_guest" on public.orders;
create policy "orders_claim_guest" on public.orders
  for update
  using (
    user_id is null
    and customer_email is not null
    and (auth.jwt() ->> 'email') is not null
    and lower(customer_email) = lower(auth.jwt() ->> 'email')
  )
  with check (auth.uid() = user_id);
