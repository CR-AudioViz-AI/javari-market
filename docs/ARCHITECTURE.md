# Market Oracle AI - System Architecture

**Last Updated:** December 14, 2025

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Landing Page │  │  Dashboard   │  │  API Clients │          │
│  │   (Next.js)  │  │   (React)    │  │  (REST API)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API LAYER (Vercel)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Next.js API Routes                      │  │
│  │  /api/ai-picks/generate  │  /api/outcomes  │  /api/cron  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI ORCHESTRATION                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Pick Generator (lib/ai/)                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │  GPT-4  │ │ Claude  │ │ Gemini  │ │Perplexity│       │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │   │
│  │       └───────────┴──────────┴───────────┘              │   │
│  │                        │                                 │   │
│  │                        ▼                                 │   │
│  │              ┌─────────────────┐                        │   │
│  │              │ Javari Consensus│                        │   │
│  │              │     Engine      │                        │   │
│  │              └─────────────────┘                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ Alpha Vantage   │  │    Supabase     │  │   Learning    │  │
│  │  (Market Data)  │  │   (PostgreSQL)  │  │   Pipeline    │  │
│  └─────────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Client Layer

#### Landing Page (`app/page.tsx`)
- Premium marketing page
- Hero section with value proposition
- AI model showcase
- Quick stock lookup
- Call-to-action to dashboard

#### Dashboard (`app/ai-picks/page.tsx`)
- Stock symbol input
- Real-time pick generation
- Expandable pick cards
- Consensus visualization
- Performance tracking

### 2. API Layer

#### Generate Endpoint (`app/api/ai-picks/generate/route.ts`)
```typescript
POST /api/ai-picks/generate
- Accepts: { symbol: string, aiModel?: string }
- Returns: { picks[], consensus, aiStatus }
- Orchestrates parallel AI calls
- Saves to database
- Builds consensus
```

#### Outcomes Endpoint (`app/api/outcomes/route.ts`)
```typescript
GET /api/outcomes
- Returns pending picks and stats

POST /api/outcomes
- Processes expired picks
- Determines WIN/LOSS
- Updates accuracy tracking
```

### 3. AI Orchestration

#### Pick Generator (`lib/ai/pick-generator.ts`)

**Flow:**
1. Fetch market data from Alpha Vantage
2. Build prompt with market context
3. Call all enabled AIs in parallel
4. Parse responses to structured format
5. Save individual picks to database
6. Call Javari consensus engine
7. Save consensus to database
8. Return complete response

**AI Configuration:**
```typescript
const AI_CONFIGS = {
  gpt4: { model: 'gpt-4-turbo-preview', enabled: true },
  claude: { model: 'claude-3-sonnet-20240229', enabled: true },
  gemini: { model: 'gemini-pro-latest', enabled: true },
  perplexity: { model: 'sonar', enabled: true },
};
```

#### Javari Consensus Engine (`lib/learning/javari-consensus.ts`)

**Algorithm:**
1. Collect all AI predictions
2. Weight by historical accuracy
3. Calculate direction votes
4. Determine consensus strength
5. Generate unified confidence
6. Build reasoning explanation

### 4. Data Layer

#### Market Data (Alpha Vantage)
- Real-time quotes
- Company fundamentals
- Technical indicators (SMA50, SMA200)
- 52-week range

#### Database (Supabase PostgreSQL)

**Tables:**
- `market_oracle_picks` - Individual AI predictions
- `market_oracle_consensus_picks` - Javari verdicts
- `ai_accuracy_tracking` - Performance metrics
- `factor_performance` - Factor calibration data

#### Learning Pipeline (`lib/learning/`)

**Components:**
- `calibration-engine.ts` - AI accuracy tracking
- `outcome-tracker.ts` - WIN/LOSS determination
- `factor-analyzer.ts` - Factor performance

---

## Data Flow

### Pick Generation Flow

```
User Request
     │
     ▼
┌────────────┐
│ Validate   │
│  Symbol    │
└─────┬──────┘
      │
      ▼
┌────────────┐
│   Fetch    │
│Market Data │
└─────┬──────┘
      │
      ▼
┌────────────┐
│   Build    │
│  Prompts   │
└─────┬──────┘
      │
      ▼
┌────────────────────────────────────────┐
│         Parallel AI Calls              │
│  GPT-4  │  Claude  │  Gemini  │  Pplx  │
└─────────┬──────────┬──────────┬────────┘
          │          │          │
          ▼          ▼          ▼
┌────────────────────────────────────────┐
│           Parse Responses              │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│        Save Picks to Database          │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│         Javari Consensus               │
│   - Weight by accuracy                 │
│   - Vote aggregation                   │
│   - Confidence calculation             │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│       Save Consensus to Database       │
└─────────────────┬──────────────────────┘
                  │
                  ▼
            Return Response
```

### Outcome Tracking Flow

```
Cron Trigger (every 6 hours)
         │
         ▼
┌──────────────────┐
│  Find Expired    │
│     Picks        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Fetch Current   │
│     Prices       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Determine Outcome│
│  (WIN/LOSS)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Update Picks    │
│   with Result    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Update Accuracy  │
│    Tracking      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Calibrate Factor │
│   Weights        │
└──────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Edge Network                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │   │
│  │  │   US    │  │   EU    │  │  ASIA   │             │   │
│  │  └─────────┘  └─────────┘  └─────────┘             │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Serverless Functions                    │   │
│  │  /api/ai-picks/generate  │  /api/outcomes           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   PostgreSQL    │  │    Auth         │                  │
│  │   (US-East-1)   │  │   (Ready)       │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Model

### API Keys
- Stored in Vercel environment variables
- Never exposed to client
- Rotated quarterly

### Database
- Row Level Security enabled
- Service role for server operations
- Anon role for read-only access

### Rate Limiting
- Per-IP limiting (planned)
- Per-user limiting (with auth)

---

## Scalability Considerations

### Current Limits
- Alpha Vantage: 5 calls/minute (free tier)
- OpenAI: High limit
- Gemini: High limit
- Perplexity: Moderate limit

### Optimization Strategies
1. Cache market data (5-minute TTL)
2. Queue AI calls for high traffic
3. Batch outcome processing
4. Read replicas for analytics

---

## Future Architecture

### Planned Additions
- WebSocket for real-time updates
- Redis for caching
- Background job queue
- Multi-region database
- User authentication
- Subscription management
