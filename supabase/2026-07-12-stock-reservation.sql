-- ============================================================================
-- 2026-07-12 · Stock reservation (prevent last-unit oversell)
-- Idempotent — run once in the Supabase SQL editor.
--
-- MODEL CHANGE: previously stock decremented when an order became 'paid'
-- (orders_decrement_stock), so two buyers could both pass the create-time check
-- on the last unit and both reach 'paid' (the 2nd decrement silently clamped at
-- 0 → oversell). Now stock is RESERVED atomically the moment the order is created
-- (create-razorpay-order → reserve_order_stock), so the 2nd concurrent buyer's
-- reservation fails and their checkout is rejected. Stock is restored when the
-- order is cancelled (payment dismissed/failed → release-reservation, admin
-- cancel/refund, or the abandoned-order sweep).
-- ============================================================================

-- Flag: did this order decrement stock (via reservation)? Drives the restore.
alter table public.orders
  add column if not exists stock_reserved boolean not null default false;

-- Atomically reserve stock for every line of an order. Guarded decrements +
-- row locks serialize concurrent callers, so the last unit can be reserved once.
-- RAISES 'insufficient_stock' (rolling back all decrements) if any TRACKED line
-- is short; untracked (null) stock is unlimited and never fails. Mirrors the
-- per-size-vs-total logic of stockFor()/the old decrement trigger.
create or replace function public.reserve_order_stock(p_order bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r record; n int;
begin
  -- total-stock lines (size not tracked per-size for this product).
  -- order by product_id so concurrent reservations lock rows in the same order
  -- (deadlock avoidance).
  for r in
    select oi.product_id, sum(oi.qty)::int qty
    from public.order_items oi join public.products p on p.id = oi.product_id
    where oi.order_id = p_order
      and (oi.size is null or p.size_stock is null or not (p.size_stock ? oi.size))
    group by oi.product_id
    order by oi.product_id
  loop
    update public.products set stock = stock - r.qty
      where id = r.product_id and stock is not null and stock >= r.qty;
    get diagnostics n = row_count;
    if n = 0 and exists (select 1 from public.products where id = r.product_id and stock is not null) then
      raise exception 'insufficient_stock' using errcode = 'P0001';
    end if;
  end loop;
  -- per-size lines (same consistent lock order)
  for r in
    select product_id, size, sum(qty)::int qty
    from public.order_items
    where order_id = p_order and size is not null
    group by product_id, size
    order by product_id, size
  loop
    update public.products
      set size_stock = jsonb_set(size_stock, array[r.size],
            to_jsonb((size_stock ->> r.size)::int - r.qty))
      where id = r.product_id and size_stock ? r.size
        and coalesce((size_stock ->> r.size)::int, 0) >= r.qty;
    get diagnostics n = row_count;
    if n = 0 and exists (select 1 from public.products where id = r.product_id and size_stock ? r.size) then
      raise exception 'insufficient_stock' using errcode = 'P0001';
    end if;
  end loop;
  update public.orders set stock_reserved = true where id = p_order;
end $$;

-- Only the service-role edge functions may reserve (never a browser directly,
-- which could deplete stock for an arbitrary order).
revoke execute on function public.reserve_order_stock(bigint) from public, anon, authenticated;
grant  execute on function public.reserve_order_stock(bigint) to service_role;

-- Keep decrement-on-paid, but ONLY for orders that did NOT reserve at checkout
-- (legacy / in-flight orders created before this migration). Reserved orders
-- already decremented at creation, so guarding on stock_reserved prevents a
-- double-decrement while still covering any pre-reservation order that pays now.
create or replace function public.orders_decrement_stock()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid'
     and not coalesce(old.stock_reserved, false) then
    for r in select oi.product_id, sum(oi.qty)::int qty
             from public.order_items oi join public.products p on p.id = oi.product_id
             where oi.order_id = new.id
               and (oi.size is null or p.size_stock is null or not (p.size_stock ? oi.size))
             group by oi.product_id loop
      update public.products set stock = greatest(0, coalesce(stock, 0) - r.qty)
        where id = r.product_id and stock is not null;
    end loop;
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

-- Restore stock when an order that reserved it is cancelled. Superset of the old
-- condition (old.payment_status='paid') so pre-reservation orders still restore.
create or replace function public.orders_restore_stock()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled'
     and (old.stock_reserved or old.payment_status = 'paid') then
    -- mirror the reservation: only lines whose size is NOT tracked per-size
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
