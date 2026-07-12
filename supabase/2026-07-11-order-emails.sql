-- ============================================================================
-- 2026-07-11 · Order emails (idempotency support)
-- Idempotent — run once in the Supabase SQL editor.
-- ============================================================================

-- Which transactional emails have already been sent for an order.
alter table public.orders
  add column if not exists emails_sent text[] not null default '{}';

-- Atomically claim an email kind for an order. Returns true if THIS call claimed
-- it (caller should send), false if it was already sent — so concurrent
-- verify-payment + webhook can't both send the confirmation.
create or replace function public.claim_order_email(p_order uuid, p_kind text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.orders set emails_sent = array_append(emails_sent, p_kind)
    where id = p_order and not (p_kind = any(emails_sent));
  get diagnostics n = row_count;
  return n > 0;
end; $$;

-- Release a claim (used when the send fails) so a later retry can re-send.
create or replace function public.release_order_email(p_order uuid, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.orders set emails_sent = array_remove(emails_sent, p_kind)
    where id = p_order;
end; $$;
