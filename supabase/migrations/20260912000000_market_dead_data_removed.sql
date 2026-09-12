-- supabase/migrations/20260912000000_market_dead_data_removed.sql
-- Purpose: remove the retired parallel pick system and its dead data (Roy, 11 Sep 2026:
--   "get rid of all dead data"), and give weekly calibration reports a real home.
-- Date: 2026-09-12
--
-- What is being removed and why:
--   market_oracle_picks            62 picks from Dec 2025, all still "PENDING" - nothing
--                                  ever scored them. Its only writer is retired.
--   market_oracle_consensus_picks  52 rows naming models that no longer compete
--                                  (gemini, gpt4, perplexity); the site was showing
--                                  nine-month-old agreement as if it were current.
--   market_oracle_calibrations     4 rows for those same retired models.
--   market_oracle_ai_models        empty; the live contest uses ai_models.
--   market_oracle_learning_queue   empty; written to, never read.
--   battle_history                 empty, unreferenced.
--   market_recover_progress        empty, unreferenced.
--   stock_quotes_cache             empty; prices come from lib/market/prices.
--
-- The live contest (stock_picks + ai_models) is untouched. Rows are copied into
-- market_retired_2025 first, so nothing is lost - it can be inspected or restored.
--
-- CR AudioViz AI, LLC · EIN 39-3646201

create table if not exists public.market_retired_2025 (
  id          bigserial primary key,
  source      text not null,
  row_data    jsonb not null,
  archived_at timestamptz not null default now()
);
alter table public.market_retired_2025 enable row level security;
revoke all on public.market_retired_2025 from anon, authenticated;

insert into public.market_retired_2025 (source, row_data)
select 'market_oracle_picks', to_jsonb(t) from public.market_oracle_picks t
where not exists (select 1 from public.market_retired_2025 where source = 'market_oracle_picks');
insert into public.market_retired_2025 (source, row_data)
select 'market_oracle_consensus_picks', to_jsonb(t) from public.market_oracle_consensus_picks t
where not exists (select 1 from public.market_retired_2025 where source = 'market_oracle_consensus_picks');
insert into public.market_retired_2025 (source, row_data)
select 'market_oracle_calibrations', to_jsonb(t) from public.market_oracle_calibrations t
where not exists (select 1 from public.market_retired_2025 where source = 'market_oracle_calibrations');

drop table if exists public.market_oracle_picks cascade;
drop table if exists public.market_oracle_consensus_picks cascade;
drop table if exists public.market_oracle_consensus_stats cascade;
drop table if exists public.market_oracle_calibrations cascade;
drop table if exists public.market_oracle_ai_models cascade;
drop table if exists public.market_oracle_learning_queue cascade;
drop table if exists public.market_oracle_factor_outcomes cascade;
drop table if exists public.market_oracle_subscriptions cascade;
drop table if exists public.battle_history cascade;
drop table if exists public.market_recover_progress cascade;
drop table if exists public.stock_quotes_cache cascade;

-- Weekly calibration reports, which the retired queue used to swallow.
create table if not exists public.market_weekly_reports (
  week_ending        date primary key,
  calibration_report jsonb not null,
  summary            jsonb not null,
  created_at         timestamptz not null default now()
);
alter table public.market_weekly_reports enable row level security;
revoke all on public.market_weekly_reports from anon, authenticated;
drop policy if exists public_read_weekly_reports on public.market_weekly_reports;
create policy public_read_weekly_reports on public.market_weekly_reports for select to anon, authenticated using (true);
