-- ============================================================================
-- 2026-07-11 · Security hardening (defense-in-depth)
-- Idempotent — safe to run/re-run in the Supabase SQL editor.
--
-- Closes two findings from the pre-ship audit:
--   1. order_items_insert_guest was `with check (true)` — ANY anonymous caller
--      could inject line items into ANY order (incl. a signed-in user's).
--      Constrain guest item inserts to user-less orders, mirroring
--      orders_insert_guest (user_id is null).
--   2. profiles.role was protected ONLY by a column-level GRANT. Add a trigger
--      backstop so `role` can never be changed by a normal (anon/authenticated)
--      request even if that grant is ever lost by a future migration.
-- ============================================================================

-- 1) Guest order-items inserts must reference a user-less (guest) order ---------
drop policy if exists "order_items_insert_guest" on public.order_items;
create policy "order_items_insert_guest" on public.order_items
  for insert to anon with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id is null
    )
  );

-- 2) profiles.role immutability backstop ---------------------------------------
-- A normal client request (auth.role() = 'anon' | 'authenticated') may never
-- change role. service_role (server-side) and direct SQL in this editor
-- (auth.role() is null) stay free to promote an admin.
create or replace function public.enforce_profile_role_immutable()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.role() in ('anon', 'authenticated') then
    raise exception 'profiles.role can only be changed by an administrator';
  end if;
  return new;
end; $$;

drop trigger if exists enforce_profile_role_immutable on public.profiles;
create trigger enforce_profile_role_immutable
  before update on public.profiles
  for each row execute function public.enforce_profile_role_immutable();
