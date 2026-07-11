-- ============================================================================
-- 2026-07-11 · Payments (Razorpay online + Cash on Delivery)
-- Idempotent — run once in the Supabase SQL editor.
-- ============================================================================

-- Payment columns on orders --------------------------------------------------
alter table public.orders
  add column if not exists payment_method     text    not null default 'cod',     -- 'online' | 'cod'
  add column if not exists payment_status      text    not null default 'pending', -- 'pending' | 'paid' | 'failed'
  add column if not exists razorpay_order_id   text,
  add column if not exists razorpay_payment_id text,
  add column if not exists amount_paid         integer;

-- Unique (not just indexed): a Razorpay order id maps to exactly one DB order,
-- so verify-payment / the webhook can never flip a second (attacker-planted) row.
create unique index if not exists orders_razorpay_order_uidx
  on public.orders (razorpay_order_id) where razorpay_order_id is not null;

-- Payment guard --------------------------------------------------------------
-- Only the payment system (service_role edge functions) or an admin may mark an
-- order 'paid' or write gateway ids. A normal customer/guest can create a
-- 'pending' order (COD or online) but can NEVER self-mark it paid — this is what
-- makes client-submitted orders safe once real money is involved.
create or replace function public.enforce_order_payment_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare is_admin boolean;
begin
  -- service_role (edge functions) and direct SQL (auth.role() null) bypass.
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
    return new;
  end if;
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') into is_admin;
  if is_admin then return new; end if;

  if tg_op = 'INSERT' then
    if new.payment_status = 'paid' or new.razorpay_payment_id is not null
       or new.amount_paid is not null or new.razorpay_order_id is not null then
      raise exception 'payment fields can only be set by the payment system';
    end if;
  elsif tg_op = 'UPDATE' then
    -- allow claiming a guest order etc.; only block CHANGES to payment fields
    if (new.payment_status is distinct from old.payment_status and new.payment_status = 'paid')
       or new.razorpay_payment_id is distinct from old.razorpay_payment_id
       or new.amount_paid is distinct from old.amount_paid
       or new.razorpay_order_id is distinct from old.razorpay_order_id then
      raise exception 'payment fields can only be changed by the payment system';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists enforce_order_payment_guard on public.orders;
create trigger enforce_order_payment_guard
  before insert or update on public.orders
  for each row execute function public.enforce_order_payment_guard();
