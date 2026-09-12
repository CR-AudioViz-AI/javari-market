-- supabase/migrations/20260911230000_market_named_models.sql
-- Purpose: Market Oracle becomes a contest between NAMED AI MODELS instead of invented
--   personas (Roy, 11 Sep 2026), all running free through Javari.
-- Date: 2026-09-11
--
-- The six personas had become three models wearing six names: two were switched to
-- Gemini when the Anthropic account ran out of credit, so "ValueHunter vs DividendKing"
-- was one model against itself. Named models make the result mean something: you learn
-- which AI actually reads markets best.
--
-- The personas are retired (is_active = false), not deleted - their 24 picks keep their
-- attribution and stay in the history.
--
-- Each model row now carries what the engine needs to call it through Javari's door:
-- the pinned model id, its output budget and its timeout.
--
-- CR AudioViz AI, LLC · EIN 39-3646201

alter table public.ai_models add column if not exists javari_model      text;
alter table public.ai_models add column if not exists max_output_tokens integer not null default 1600;
alter table public.ai_models add column if not exists timeout_ms        integer not null default 120000;
alter table public.ai_models add column if not exists reasoning_effort  text check (reasoning_effort in ('low','medium','high'));
alter table public.ai_models add column if not exists retired_reason    text;

update public.ai_models
   set is_active = false,
       retired_reason = 'Persona retired 2026-09-11: the six personas ran on only three underlying models, so the contest compared a model with itself.'
 where javari_model is null;

insert into public.ai_models (id, name, display_name, slug, color, provider, specialty, tagline, methodology_description,
                             javari_model, max_output_tokens, timeout_ms, reasoning_effort, is_active)
values
  ('b1000000-0000-0000-0000-000000000001','gpt_oss_120b','GPT-OSS 120B','gpt-oss-120b','#10a37f','OpenAI (open-weight)','Reasoning',
   'OpenAI''s open-weight reasoning model, served free by Groq',
   'Reads the same research pack as every rival and reasons step by step before committing to one pick.',
   'groq:openai/gpt-oss-120b', 2000, 90000, 'medium', true),
  ('b2000000-0000-0000-0000-000000000002','qwen_3_8','Qwen 3.8','qwen-3-8','#8b5cf6','Alibaba','Fast analysis',
   'Alibaba''s Qwen, served free by Groq',
   'Quick, decisive reads of price action and company news.',
   'groq:qwen/qwen3.8-27b', 900, 90000, null, true),
  ('b3000000-0000-0000-0000-000000000003','mistral_large','Mistral Large','mistral-large','#fa520f','Mistral AI','Fundamentals',
   'Mistral''s flagship model',
   'Weighs company fundamentals and sector context against the current price.',
   'mistral:mistral-large-latest', 1600, 120000, null, true),
  ('b4000000-0000-0000-0000-000000000004','glm_5_2','GLM-5.2','glm-5-2','#3b82f6','Z.ai (Zhipu)','Balanced',
   'Z.ai''s GLM-5.2, served through Mistral',
   'Balances momentum against valuation and states its risks plainly.',
   'mistral:zai-glm-5-2', 1800, 120000, null, true),
  ('b5000000-0000-0000-0000-000000000005','magistral_medium','Magistral Medium','magistral-medium','#e11d48','Mistral AI','Deliberate reasoning',
   'Mistral''s reasoning model',
   'Thinks through the downside before the upside, and says what would prove it wrong.',
   'mistral:magistral-medium-latest', 2000, 120000, null, true),
  ('b6000000-0000-0000-0000-000000000006','nemotron_super','Nemotron 3 Super','nemotron-3-super','#76b900','NVIDIA','Deep research',
   'NVIDIA''s Nemotron, free on OpenRouter',
   'Slower and more thorough: digs into the research pack before choosing.',
   'openrouter:nvidia/nemotron-3-super-120b-a12b:free', 2500, 200000, null, true)
on conflict (id) do update set
  display_name = excluded.display_name, slug = excluded.slug, color = excluded.color, provider = excluded.provider,
  specialty = excluded.specialty, tagline = excluded.tagline, methodology_description = excluded.methodology_description,
  javari_model = excluded.javari_model, max_output_tokens = excluded.max_output_tokens, timeout_ms = excluded.timeout_ms,
  reasoning_effort = excluded.reasoning_effort, is_active = true, updated_at = now();

-- What each model was given to read, and the seal over its pick.
alter table public.stock_picks add column if not exists javari_request_id uuid;
alter table public.stock_picks add column if not exists research_sha256   text;
alter table public.stock_picks add column if not exists seal_sha256       text;
alter table public.stock_picks add column if not exists sources           jsonb not null default '[]'::jsonb;

create table if not exists public.market_research_packs (
  pick_date   date not null,
  category    text not null,
  body        text not null,
  sources     jsonb not null default '[]'::jsonb,
  sha256      text not null,
  built_at    timestamptz not null default now(),
  primary key (pick_date, category)
);
alter table public.market_research_packs enable row level security;
revoke all on public.market_research_packs from anon, authenticated;

create table if not exists public.market_pick_attempts (
  id           bigserial primary key,
  pick_date    date not null,
  ai_model_id  uuid not null,
  ok           boolean not null,
  error        text,
  javari_request_id uuid,
  created_at   timestamptz not null default now()
);
alter table public.market_pick_attempts enable row level security;
revoke all on public.market_pick_attempts from anon, authenticated;
create index if not exists market_pick_attempts_idx on public.market_pick_attempts (pick_date, ai_model_id);
