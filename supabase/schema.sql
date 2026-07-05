-- ============================================================
-- Mini & Me — COMPLETE database setup (tables + security)
-- Run this ONCE in the Supabase SQL editor. It is self-contained and
-- idempotent, so it is the ONLY file you need for a fresh project:
--   https://supabase.com/dashboard/project/_/sql/new
-- (profile-setup.sql is kept for older projects but is superseded by this file.)
--
-- Every table below has RLS enabled AND its policies defined in the same file,
-- so a fresh database is never left with an RLS-locked, inaccessible table.
-- ============================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ============================================================
-- profiles (one row per auth user)
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  phone      text,
  role       text not null default 'customer',   -- 'customer' | 'admin' (set by trigger/service role only)
  gender     text,
  dob        date,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'customer')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- After deploy, promote your admin account once:
--   update public.profiles set role = 'admin' where email = 'madhusudhanana94@gmail.com';

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- SECURITY: the update policy would let a user write any column, incl. `role`
-- (self-promotion to admin). Column-level grants restrict WHICH columns a
-- signed-in user may write, so `role` stays untouchable.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, gender, dob, avatar_url) on public.profiles to authenticated;

-- ============================================================
-- products
-- ============================================================
create table if not exists public.products (
  id             bigint generated always as identity primary key,
  name           text not null,
  category       text not null default 'women',   -- women | men | kids
  shape          text,                            -- dress | tee | shirt | ...
  price          integer not null default 0,      -- selling price (₹, GST-inclusive)
  original_price integer,                          -- MRP for strike-through (optional)
  colors         text[] not null default '{}',
  sizes          text[] not null default '{}',
  images         text[] not null default '{}',
  image_url      text,
  description    text default '',
  trending       boolean not null default false,
  tag            text,                            -- e.g. 'new'
  stock          integer,                         -- null = not tracked (always available); 0 = out of stock
  created_at     timestamptz not null default now()
);
alter table public.products enable row level security;

-- Anyone may read the catalogue; only admins may write it.
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================
-- orders + line items
-- ============================================================
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,  -- null = guest order
  customer_name    text,
  customer_phone   text,
  customer_email   text,
  total            integer not null default 0,
  status           text not null default 'placed',  -- placed → confirmed → shipped → delivered → cancelled
  ref              text,                             -- human-readable order ref (e.g. PP123456)
  shipping_address jsonb,
  created_at       timestamptz not null default now()
);
alter table public.orders enable row level security;

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   bigint,
  product_name text,
  size         text,
  color        text,
  unit_price   integer not null default 0,
  qty          integer not null default 1,
  created_at   timestamptz not null default now()
);
alter table public.order_items enable row level security;

-- Signed-in customers: insert / read / delete their OWN orders.
-- (delete-own lets the app roll back an order if its line-items insert fails.)
drop policy if exists "orders_insert_self" on public.orders;
create policy "orders_insert_self" on public.orders
  for insert with check (auth.uid() = user_id);

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "orders_delete_own" on public.orders;
create policy "orders_delete_own" on public.orders
  for delete using (auth.uid() = user_id);

-- Guest (anonymous) checkout — may only create user-less orders.
drop policy if exists "orders_insert_guest" on public.orders;
create policy "orders_insert_guest" on public.orders
  for insert to anon with check (user_id is null);

-- Let a signed-in user claim their own guest orders (user_id null + matching email).
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

-- Admins: read & manage ALL orders + items.
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "order_items_insert_self" on public.order_items;
create policy "order_items_insert_self" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_items_insert_guest" on public.order_items;
create policy "order_items_insert_guest" on public.order_items
  for insert to anon with check (true);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all" on public.order_items
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================
-- delivery addresses
-- ============================================================
create table if not exists public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text not null default 'Home',
  full_name  text,
  phone      text,
  line1      text not null,
  line2      text,
  area       text,
  city       text not null,
  state      text not null,
  pincode    text not null,
  country    text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.addresses enable row level security;

drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own" on public.addresses for select using (auth.uid() = user_id);
drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own" on public.addresses for insert with check (auth.uid() = user_id);
drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own" on public.addresses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own" on public.addresses for delete using (auth.uid() = user_id);

-- ============================================================
-- per-user cart + wishlist sync
-- ============================================================
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

-- ============================================================
-- storage buckets: avatars (per-user) + products (admin)
-- ============================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars_user_write" on storage.objects;
create policy "avatars_user_write" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "products_public_read" on storage.objects;
create policy "products_public_read" on storage.objects for select using (bucket_id = 'products');
drop policy if exists "products_admin_write" on storage.objects;
create policy "products_admin_write" on storage.objects for insert with check (bucket_id = 'products' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "products_admin_update" on storage.objects;
create policy "products_admin_update" on storage.objects for update using (bucket_id = 'products' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
