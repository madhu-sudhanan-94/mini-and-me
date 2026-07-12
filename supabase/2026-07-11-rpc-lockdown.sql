-- ============================================================================
-- 2026-07-11 · Lock down the internal SECURITY DEFINER RPCs
-- Idempotent — run once in the Supabase SQL editor.
--
-- claim_order_email / release_order_email / rate_limit_hit are SECURITY DEFINER
-- (they run as the table owner, bypassing RLS). They are ONLY ever called by the
-- edge functions using the service-role key — never by a browser. By default a
-- function is EXECUTE-able by PUBLIC, so any holder of the publishable anon key
-- could POST /rest/v1/rpc/... to permanently suppress a customer's order emails
-- (claim without sending) or force a 429 on a targeted checkout (rate_limit_hit).
--
-- Revoke EXECUTE from the browser-facing roles and PUBLIC, and grant it back to
-- service_role explicitly (the edge functions call as service_role, so this is
-- non-breaking). PUBLIC's default grant is what we're removing.
-- ============================================================================

revoke execute on function public.claim_order_email(text, text)          from public, anon, authenticated;
revoke execute on function public.release_order_email(text, text)        from public, anon, authenticated;
revoke execute on function public.rate_limit_hit(text, int, int)         from public, anon, authenticated;

grant  execute on function public.claim_order_email(text, text)          to service_role;
grant  execute on function public.release_order_email(text, text)        to service_role;
grant  execute on function public.rate_limit_hit(text, int, int)         to service_role;
