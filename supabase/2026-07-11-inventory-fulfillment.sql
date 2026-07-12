-- ============================================================================
-- 2026-07-11 · Inventory + fulfillment linkage
-- Idempotent — run once in the Supabase SQL editor.
--
--   1. When an order becomes paid, auto-advance status 'placed' → 'confirmed'
--      (links payment_status to fulfillment status).
--   2. When an order becomes paid, decrement product stock + per-size size_stock.
--   3. When a PAID order is cancelled, restore the stock it consumed.
-- All run in the DB so every path (verify-payment, webhook, admin) is covered
-- atomically. Untracked stock (null) is left untouched.
--
-- Known limitations (deferred):
--   • No stock RESERVATION: two orders can both pass the create-time stock check
--     on the last unit and both reach 'paid' (the second decrement clamps at 0);
--     a later cancel then over-restores. Fix = reservation or storing the actual
--     decremented qty per order.
--   • COD does not decrement stock (nothing marks a COD order 'paid'). Moot while
--     COD is disabled; wire a decrement on confirm/deliver when COD is enabled.
-- ============================================================================

-- 0) the stock triggers below reference these product columns; add them if this
--    DB predates them (older databases were missing size_stock). ---------------
alter table public.products
  add column if not exists stock      integer,
  add column if not exists size_stock jsonb;

-- 1) paid → confirmed (BEFORE UPDATE so it just adjusts the row) --------------
create or replace function public.orders_confirm_on_paid()
returns trigger language plpgsql as $$
begin
  -- Cancelled is terminal — never let an order move back out of 'cancelled'
  -- (it's already refunded + stock restored; reopening would oversell).
  if old.status = 'cancelled' and new.status is distinct from 'cancelled' then
    new.status := 'cancelled';
  end if;
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid'
     and new.status = 'placed' then
    new.status := 'confirmed';
  end if;
  return new;
end; $$;

drop trigger if exists orders_confirm_on_paid on public.orders;
create trigger orders_confirm_on_paid
  before update on public.orders
  for each row execute function public.orders_confirm_on_paid();

-- 2) decrement stock when an order becomes paid -------------------------------
create or replace function public.orders_decrement_stock()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    -- total product stock — only for lines whose size is NOT tracked per-size
    -- (mirrors stockFor(): size_stock is authoritative for listed sizes, total
    -- stock is only the fallback for sizes absent from size_stock).
    for r in select oi.product_id, sum(oi.qty)::int qty
             from public.order_items oi join public.products p on p.id = oi.product_id
             where oi.order_id = new.id
               and (oi.size is null or p.size_stock is null or not (p.size_stock ? oi.size))
             group by oi.product_id loop
      update public.products set stock = greatest(0, coalesce(stock, 0) - r.qty)
        where id = r.product_id and stock is not null;
    end loop;
    -- per-size stock
    for r in select product_id, size, sum(qty)::int qty from public.order_items
             where order_id = new.id and size is not null group by product_id, size loop
      update public.products
        set size_stock = jsonb_set(size_stock, array[r.size],
              to_jsonb(greatest(0, coalesce((size_stock ->> r.size)::int, 0) - r.qty)))
        where id = r.product_id and size_stock ? r.size;
    end loop;
  end if;
  return new;
end; $$;

drop trigger if exists orders_decrement_stock on public.orders;
create trigger orders_decrement_stock
  after update on public.orders
  for each row execute function public.orders_decrement_stock();

-- 3) restore stock when a PAID order is cancelled -----------------------------
create or replace function public.orders_restore_stock()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled'
     and old.payment_status = 'paid' then
    -- mirror the decrement: only lines whose size is NOT tracked per-size
    for r in select oi.product_id, sum(oi.qty)::int qty
             from public.order_items oi join public.products p on p.id = oi.product_id
             where oi.order_id = new.id
               and (oi.size is null or p.size_stock is null or not (p.size_stock ? oi.size))
             group by oi.product_id loop
      update public.products set stock = coalesce(stock, 0) + r.qty
        where id = r.product_id and stock is not null;
    end loop;
    for r in select product_id, size, sum(qty)::int qty from public.order_items
             where order_id = new.id and size is not null group by product_id, size loop
      update public.products
        set size_stock = jsonb_set(size_stock, array[r.size],
              to_jsonb(coalesce((size_stock ->> r.size)::int, 0) + r.qty))
        where id = r.product_id and size_stock ? r.size;
    end loop;
  end if;
  return new;
end; $$;

drop trigger if exists orders_restore_stock on public.orders;
create trigger orders_restore_stock
  after update on public.orders
  for each row execute function public.orders_restore_stock();
