# Market Oracle AI - Setup & Deployment Guide

**Last Updated:** December 14, 2025

---

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)
- API keys for AI providers

---

## 1. Clone Repository

```bash
git clone https://github.com/CR-AudioViz-AI/crav-market-oracle.git
cd crav-market-oracle
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Environment Setup

Copy the template:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your keys:

```bash
# ===================
# SUPABASE
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===================
# AI PROVIDERS
# ===================
# OpenAI (Required)
OPENAI_API_KEY=sk-...

# Anthropic Claude (Optional - adds balanced analysis)
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini (Optional - adds technical analysis)
# IMPORTANT: Use model "gemini-pro-latest" NOT "gemini-1.5-flash"
GEMINI_API_KEY=AIza...

# Perplexity (Optional - adds real-time web data)
PERPLEXITY_API_KEY=pplx-...

# ===================
# MARKET DATA
# ===================
ALPHA_VANTAGE_API_KEY=your-key
```

---

## 4. Database Setup

### Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Copy URL and keys to `.env.local`

### Run Migrations

The migrations are in `supabase/migrations/`. Run them in your Supabase SQL Editor:

**Core Tables:**
```sql
-- market_oracle_picks
CREATE TABLE market_oracle_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_model TEXT NOT NULL,
  symbol TEXT NOT NULL,
  company_name TEXT,
  sector TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN', 'HOLD')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  timeframe TEXT DEFAULT '1W',
  entry_price DECIMAL,
  target_price DECIMAL,
  stop_loss DECIMAL,
  thesis TEXT,
  full_reasoning TEXT,
  factor_assessments JSONB,
  key_bullish_factors TEXT[],
  key_bearish_factors TEXT[],
  risks TEXT[],
  catalysts TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  exit_price DECIMAL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WIN', 'LOSS'))
);

-- market_oracle_consensus_picks
CREATE TABLE market_oracle_consensus_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  ai_combination TEXT[],
  ai_combination_key TEXT,
  consensus_strength DECIMAL,
  weighted_confidence DECIMAL,
  javari_confidence INTEGER,
  javari_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  exit_price DECIMAL,
  status TEXT DEFAULT 'PENDING'
);

-- ai_accuracy_tracking
CREATE TABLE ai_accuracy_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_model TEXT NOT NULL,
  sector TEXT,
  total_picks INTEGER DEFAULT 0,
  correct_picks INTEGER DEFAULT 0,
  accuracy DECIMAL,
  avg_confidence DECIMAL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_picks_symbol ON market_oracle_picks(symbol);
CREATE INDEX idx_picks_status ON market_oracle_picks(status);
CREATE INDEX idx_picks_created ON market_oracle_picks(created_at DESC);
CREATE INDEX idx_consensus_symbol ON market_oracle_consensus_picks(symbol);
```

### Enable Row Level Security

```sql
ALTER TABLE market_oracle_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_oracle_consensus_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_accuracy_tracking ENABLE ROW LEVEL SECURITY;

-- Public read access (adjust as needed)
CREATE POLICY "Public read" ON market_oracle_picks FOR SELECT USING (true);
CREATE POLICY "Service write" ON market_oracle_picks FOR ALL USING (true);
```

---

## 5. Local Development

```bash
npm run dev
```

Open http://localhost:3000

---

## 6. Deploy to Vercel

### Option A: Vercel Dashboard

1. Go to https://vercel.com
2. Import from GitHub
3. Select `crav-market-oracle` repository
4. Add environment variables
5. Deploy

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 7. Post-Deployment

### Verify Endpoints

```bash
# Landing page
curl https://your-domain.vercel.app

# Dashboard
curl https://your-domain.vercel.app/ai-picks

# API
curl -X POST https://your-domain.vercel.app/api/ai-picks/generate \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

### Set Up Cron Jobs (Optional)

For automated outcome tracking, set up Vercel Cron:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-outcomes",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/daily-calibration",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 8. AI Provider Setup

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create new key
3. Add to `OPENAI_API_KEY`

### Anthropic Claude
1. Go to https://console.anthropic.com
2. Create API key
3. Add to `ANTHROPIC_API_KEY`

### Google Gemini
1. Go to https://aistudio.google.com/app/apikey
2. Create new project or use existing
3. Create API key
4. **IMPORTANT**: Use model `gemini-pro-latest` in code (not `gemini-1.5-flash`)
5. Enable billing at https://console.cloud.google.com/billing
6. Add to `GEMINI_API_KEY`

### Perplexity
1. Go to https://www.perplexity.ai/settings/api
2. Create API key
3. Add to `PERPLEXITY_API_KEY`

---

## 9. Troubleshooting

### Gemini 403/404 Errors
- Ensure billing is enabled in Google Cloud
- Use `gemini-pro-latest` model, not `gemini-1.5-flash`
- Check API key restrictions in Cloud Console

### Claude Credit Errors
- Check credit balance at https://console.anthropic.com/settings/billing
- Credits typically reset weekly

### Database Connection Issues
- Verify Supabase URL and keys
- Check if tables exist
- Ensure RLS policies allow access

### Build Failures
- Run `npm run build` locally to see errors
- Check TypeScript errors: `npm run type-check`
- Verify all environment variables are set

---

## 10. Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Database tables created with indexes
- [ ] RLS policies configured
- [ ] At least 2 AI providers working
- [ ] Landing page loads (HTTP 200)
- [ ] Dashboard loads (HTTP 200)
- [ ] API generates picks successfully
- [ ] Picks save to database
- [ ] Custom domain configured (optional)

---

## Support

- Email: support@craudiovizai.com
- GitHub Issues: https://github.com/CR-AudioViz-AI/crav-market-oracle/issues
