-- ============================================================================
-- 2026-07-12 · Admin tooling: shipment tracking + partial-refund accounting
-- Idempotent — run once in the Supabase SQL editor.
--
-- These columns are written only by admins (orders_admin_all) and the
-- service-role edge functions. A customer CAN update an order via the
-- orders_claim_guest policy (claiming a guest order with their own email), so we
-- extend enforce_order_payment_guard below to also block non-admins from setting
-- amount_refunded / tracking_* — otherwise a customer could forge a refund figure
-- that skews the admin sales report, or a bogus tracking link.
-- ============================================================================

alter table public.orders
  add column if not exists tracking_carrier text,   -- courier / carrier name
  add column if not exists tracking_number  text,   -- AWB / consignment number
  add column if not exists tracking_url      text,   -- courier tracking link
  add column if not exists tracking_eta      text,   -- freeform ETA, e.g. "3–5 days"
  add column if not exists amount_refunded    integer; -- running total refunded (₹), incl. partials

-- Re-create the payment guard to ALSO protect the new columns from non-admin
-- clients (admins + service_role still bypass at the top). Superset of the
-- 2026-07-11 version — this definition wins as the later migration.
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
       or new.amount_paid is not null or new.razorpay_order_id is not null
       or new.amount_refunded is not null
       or new.tracking_carrier is not null or new.tracking_number is not null
       or new.tracking_url is not null or new.tracking_eta is not null then
      raise exception 'payment/fulfillment fields can only be set by the store';
    end if;
  elsif tg_op = 'UPDATE' then
    if (new.payment_status is distinct from old.payment_status and new.payment_status = 'paid')
       or new.razorpay_payment_id is distinct from old.razorpay_payment_id
       or new.amount_paid is distinct from old.amount_paid
       or new.razorpay_order_id is distinct from old.razorpay_order_id
       or new.amount_refunded is distinct from old.amount_refunded
       or new.tracking_carrier is distinct from old.tracking_carrier
       or new.tracking_number is distinct from old.tracking_number
       or new.tracking_url is distinct from old.tracking_url
       or new.tracking_eta is distinct from old.tracking_eta then
      raise exception 'payment/fulfillment fields can only be changed by the store';
    end if;
  end if;
  return new;
end; $$;
