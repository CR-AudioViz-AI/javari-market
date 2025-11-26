# Market Oracle - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Cron Jobs](#cron-jobs)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Market Oracle is an AI-powered stock prediction competition platform where 5 leading AI models compete weekly to make the best stock, crypto, and penny stock picks.

### Key Stats
- **5 AI Models**: GPT-4, Claude, Gemini, Perplexity, Javari
- **75 Weekly Picks**: 25 per category (Regular, Penny, Crypto)
- **Real-Time Pricing**: Updates every 15 minutes
- **Educational Focus**: Not for actual trading

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Market Oracle Platform                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 14)                                       │
│  ├── Dashboard (main picks view)                             │
│  ├── AI Battle (leaderboard)                                 │
│  ├── Help Center (documentation)                             │
│  └── Javari Widget (AI chat)                                 │
├─────────────────────────────────────────────────────────────┤
│  API Routes                                                   │
│  ├── /api/market-oracle/generate-picks                       │
│  ├── /api/market-oracle/update-prices                        │
│  └── /api/market-oracle/update-performance                   │
├─────────────────────────────────────────────────────────────┤
│  External Services                                            │
│  ├── Supabase (PostgreSQL database)                          │
│  ├── OpenAI, Anthropic, Google, Perplexity (AI providers)    │
│  ├── Twelve Data (stock prices)                              │
│  └── CoinGecko (crypto prices)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| AI Pick Generation | ✅ Complete | 5 AIs generate picks weekly |
| Real-Time Prices | ✅ Complete | 15-min updates via APIs |
| P&L Tracking | ✅ Complete | Accurate profit/loss display |
| AI Leaderboard | ✅ Complete | Performance rankings |
| Help Center | ✅ Complete | Comprehensive documentation |
| Javari Chat | ✅ Complete | AI assistant widget |
| Mobile Nav | ✅ Complete | Bottom navigation |
| Cross-Marketing | ✅ Complete | Ecosystem integration |

### Pages

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Main dashboard with all picks | ✅ |
| `/hot-picks` | Top performing picks | ✅ |
| `/battle` | AI vs AI comparison | ✅ |
| `/insights` | Market insights | ✅ |
| `/learn` | Educational content | ✅ |
| `/watchlist` | Personal watchlist | ✅ |
| `/help` | Help center | ✅ |
| `/help/getting-started` | Onboarding guide | ✅ |
| `/help/how-it-works` | Platform explanation | ✅ |
| `/help/ai-models` | AI model guide | ✅ |
| `/help/understanding-picks` | Pick explanation | ✅ |
| `/help/faq` | FAQ | ✅ |
| `/stock/[ticker]` | Stock detail page | ✅ |

---

## API Reference

### Generate Picks
```
GET /api/market-oracle/generate-picks?trigger=manual
```
Generates 75 new picks (25 per category) using all 5 AI models.

**Process:**
1. Fetches real prices from Twelve Data (stocks) and CoinGecko (crypto)
2. Calls each AI with current prices in prompt
3. Parses responses and saves to database
4. Entry price = actual market price (not AI suggestion)

### Update Prices
```
GET /api/market-oracle/update-prices?trigger=manual
```
Updates all active picks with current market prices.

**Sources:**
- Stocks: Twelve Data API (800 calls/day free)
- Crypto: CoinGecko API (unlimited, free)

**Rate Limits:**
- Twelve Data: 300ms between calls
- CoinGecko: Batch requests (no limit)

### Update Performance
```
GET /api/market-oracle/update-performance
```
Calculates win/loss status for picks that hit targets or stops.

---

## Database Schema

### Tables

**ai_models**
```sql
id, name, provider, description, created_at
```

**competitions**
```sql
id, name, start_date, end_date, status, created_at
```

**stock_picks**
```sql
id, competition_id, ai_model_id, ticker, company_name, 
entry_price, target_price, stop_loss, current_price,
price_change, price_change_pct, direction, confidence,
reasoning, category, status, created_at, last_price_update
```

**ai_call_logs**
```sql
id, ai_model_id, endpoint, status, response_time_ms, 
error_message, created_at
```

---

## Cron Jobs

Configured in `vercel.json`:

| Schedule | Path | Description |
|----------|------|-------------|
| `0 8 * * 0` | /api/market-oracle/generate-picks | Sunday 8 AM - Generate picks |
| `*/15 9-16 * * 1-5` | /api/market-oracle/update-prices | Mon-Fri 9AM-4PM - Update prices |
| `0 */4 * * 0,6` | /api/market-oracle/update-prices | Weekends - Update crypto |

**Authentication:** All cron endpoints require `CRON_SECRET` header.

---

## Deployment

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=xxx
PERPLEXITY_API_KEY=pplx-xxx
TWELVE_DATA_API_KEY=xxx
CRON_SECRET=xxx
```

### Deploy Process

1. Push to GitHub (auto-triggers Vercel)
2. Preview deployment created
3. Manual promotion to production
4. Verify via production URL

---

## Troubleshooting

### Common Issues

**AI not generating picks:**
- Check API key validity
- Verify rate limits not exceeded
- Check AI call logs in database

**Prices not updating:**
- Verify Twelve Data API key
- Check rate limiting (800 calls/day)
- Confirm market hours (9 AM - 4 PM EST)

**Wrong P&L calculations:**
- Entry price should equal current at creation
- Verify price_change_pct formula
- Check for NULL values

### Health Checks

```bash
# Test generate picks
curl "https://crav-market-oracle.vercel.app/api/market-oracle/generate-picks?trigger=manual"

# Test price update
curl "https://crav-market-oracle.vercel.app/api/market-oracle/update-prices?trigger=manual"
```

---

## Support

- **Help Center**: /help
- **Javari AI**: Chat widget (bottom right)
- **Email**: support@craudiovizai.com
- **Main Site**: https://craudiovizai.com

---

© 2025 CR AudioViz AI, LLC. All rights reserved.
