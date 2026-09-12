-- supabase/migrations/20260912030000_market_pilot_flag.sql
-- Purpose: mark the 11 Sep pilot picks so they can never contaminate the standings.
-- Date: 2026-09-12
--
-- Those 30 picks were made before the engine recorded each market's index price, so
-- there is nothing honest to score them against. They stay visible as the first run -
-- with their reasoning intact - but they are excluded from every ranking. Backfilling
-- an index price after the fact would be inventing evidence.
--
-- CR AudioViz AI, LLC · EIN 39-3646201

alter table public.stock_picks add column if not exists pilot boolean not null default false;

update public.stock_picks
   set pilot = true
 where javari_request_id is not null
   and benchmark_entry is null
   and not exists (
     select 1 from public.market_benchmark_prices b
      where b.pick_date = stock_picks.pick_date
        and b.symbol = stock_picks.benchmark_symbol
   );

comment on column public.stock_picks.pilot is
  'True for picks with no index price to be measured against (the 2026-09-11 first run). Excluded from all standings.';
