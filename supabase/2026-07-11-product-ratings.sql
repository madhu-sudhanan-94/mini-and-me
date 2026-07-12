-- ============================================================================
-- 2026-07-11 · Per-product rating aggregate (for catalog thumbnails)
-- Idempotent — run once in the Supabase SQL editor.
-- ============================================================================

-- avg rating + review count per product, from the public reviews table.
create or replace view public.product_ratings as
  select product_id,
         round(avg(rating)::numeric, 1) as avg,
         count(*)::int                  as count
  from public.reviews
  group by product_id;

-- Public read (aggregates only — no PII).
grant select on public.product_ratings to anon, authenticated;
