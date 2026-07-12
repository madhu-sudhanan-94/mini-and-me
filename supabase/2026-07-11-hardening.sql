-- ============================================================================
-- 2026-07-11 · Hardening: edge-function rate limiting + one review per buyer
-- Idempotent — run once in the Supabase SQL editor.
-- ============================================================================

-- 1) Rate limiting (fixed-window counter, keyed by IP + function) -------------
-- NOTE: one row accumulates per (function,IP) and is never purged. Harmless at
-- this scale; to bound it later, schedule (pg_cron) a periodic
--   delete from public.rate_limits where window_start < now() - interval '1 day';
create table if not exists public.rate_limits (
  key          text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;  -- service-role only

-- Returns true if this hit is ALLOWED (at/under the limit for the current
-- window), false if the limit is exceeded. Resets the counter when the window
-- has elapsed.
create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.rate_limits (key, count, window_start)
    values (p_key, 1, now())
  on conflict (key) do update set
    count = case when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                 then 1 else public.rate_limits.count + 1 end,
    window_start = case when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                 then now() else public.rate_limits.window_start end
  returning count into n;
  return n <= p_max;
end; $$;

-- 2) One review per buyer per product ----------------------------------------
-- Remove any existing duplicates (keep the most recent) before the constraint.
delete from public.reviews r using public.reviews r2
  where r.product_id = r2.product_id and r.user_id = r2.user_id and r.user_id is not null
    and (r.created_at < r2.created_at or (r.created_at = r2.created_at and r.id < r2.id));

-- Non-partial: a partial index (where user_id is not null) can't be inferred as
-- the ON CONFLICT arbiter for the client upsert (Postgres raises 42P10). NULL
-- user_ids stay distinct under a normal unique index, so any legacy null-user
-- rows are still allowed — same effect the partial version intended.
drop index if exists public.reviews_product_user_uidx;
create unique index reviews_product_user_uidx on public.reviews (product_id, user_id);
