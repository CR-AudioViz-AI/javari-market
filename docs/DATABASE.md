# Market Oracle AI - Database Schema

**Supabase PostgreSQL Database**

Last Updated: December 15, 2025

---

## Overview

Market Oracle uses Supabase (PostgreSQL) for data persistence. The database stores AI predictions, consensus verdicts, and learning metrics.

---

## Tables

### 1. market_oracle_picks

Stores individual AI model predictions.

```sql
CREATE TABLE market_oracle_picks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- AI Model Info
  ai_model TEXT NOT NULL,  -- 'gpt4', 'claude', 'gemini', 'perplexity'
  
  -- Stock Info
  symbol TEXT NOT NULL,
  company_name TEXT,
  sector TEXT,
  
  -- Prediction
  direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN', 'HOLD')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  timeframe TEXT DEFAULT '1W' CHECK (timeframe IN ('1W', '2W', '1M')),
  
  -- Price Targets
  entry_price DECIMAL(12, 4),
  target_price DECIMAL(12, 4),
  stop_loss DECIMAL(12, 4),
  
  -- Analysis
  thesis TEXT,                      -- Short summary
  full_reasoning TEXT,              -- Detailed analysis
  factor_assessments JSONB,         -- Array of factor evaluations
  key_bullish_factors TEXT[],       -- Bullish points
  key_bearish_factors TEXT[],       -- Bearish points
  risks TEXT[],                     -- Risk factors
  catalysts TEXT[],                 -- Potential catalysts
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Outcome
  exit_price DECIMAL(12, 4),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WIN', 'LOSS'))
);

-- Indexes
CREATE INDEX idx_picks_symbol ON market_oracle_picks(symbol);
CREATE INDEX idx_picks_ai_model ON market_oracle_picks(ai_model);
CREATE INDEX idx_picks_status ON market_oracle_picks(status);
CREATE INDEX idx_picks_created ON market_oracle_picks(created_at DESC);
CREATE INDEX idx_picks_expires ON market_oracle_picks(expires_at);
```

**Factor Assessments JSON Structure:**
```json
[
  {
    "factorId": "pe_ratio",
    "factorName": "P/E Ratio",
    "value": "28.5",
    "interpretation": "NEUTRAL",
    "confidence": 60,
    "reasoning": "P/E is in line with sector average"
  }
]
```

---

### 2. market_oracle_consensus_picks

Stores Javari consensus predictions.

```sql
CREATE TABLE market_oracle_consensus_picks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stock Info
  symbol TEXT NOT NULL,
  
  -- Consensus
  direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN', 'HOLD')),
  ai_combination TEXT[],            -- AIs that agreed
  ai_combination_key TEXT,          -- Sorted key for grouping
  consensus_strength DECIMAL(5, 4), -- 0.0 to 1.0
  weighted_confidence DECIMAL(5, 2),
  javari_confidence INTEGER,
  javari_reasoning TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Outcome
  exit_price DECIMAL(12, 4),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WIN', 'LOSS'))
);

-- Indexes
CREATE INDEX idx_consensus_symbol ON market_oracle_consensus_picks(symbol);
CREATE INDEX idx_consensus_status ON market_oracle_consensus_picks(status);
CREATE INDEX idx_consensus_created ON market_oracle_consensus_picks(created_at DESC);
CREATE INDEX idx_consensus_combination ON market_oracle_consensus_picks(ai_combination_key);
```

---

### 3. ai_accuracy_tracking

Tracks AI model performance over time.

```sql
CREATE TABLE ai_accuracy_tracking (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Model Info
  ai_model TEXT NOT NULL,
  sector TEXT,  -- NULL for overall accuracy
  
  -- Stats
  total_picks INTEGER DEFAULT 0,
  correct_picks INTEGER DEFAULT 0,
  accuracy DECIMAL(5, 4),  -- 0.0 to 1.0
  avg_confidence DECIMAL(5, 2),
  
  -- Time
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(ai_model, sector)
);

-- Indexes
CREATE INDEX idx_accuracy_model ON ai_accuracy_tracking(ai_model);
CREATE INDEX idx_accuracy_sector ON ai_accuracy_tracking(sector);
```

---

### 4. factor_performance

Tracks factor predictive power.

```sql
CREATE TABLE factor_performance (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Factor Info
  factor_id TEXT NOT NULL,
  factor_name TEXT,
  sector TEXT,  -- NULL for overall
  
  -- Stats
  bullish_correct INTEGER DEFAULT 0,
  bullish_total INTEGER DEFAULT 0,
  bearish_correct INTEGER DEFAULT 0,
  bearish_total INTEGER DEFAULT 0,
  neutral_correct INTEGER DEFAULT 0,
  neutral_total INTEGER DEFAULT 0,
  
  -- Calculated
  overall_accuracy DECIMAL(5, 4),
  predictive_power DECIMAL(5, 4),  -- How often factor is useful
  
  -- Time
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(factor_id, sector)
);

-- Indexes
CREATE INDEX idx_factor_id ON factor_performance(factor_id);
CREATE INDEX idx_factor_sector ON factor_performance(sector);
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE market_oracle_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_oracle_consensus_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_accuracy_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE factor_performance ENABLE ROW LEVEL SECURITY;

-- Public read access (anonymous users can read)
CREATE POLICY "Public read picks" ON market_oracle_picks
  FOR SELECT USING (true);

CREATE POLICY "Public read consensus" ON market_oracle_consensus_picks
  FOR SELECT USING (true);

CREATE POLICY "Public read accuracy" ON ai_accuracy_tracking
  FOR SELECT USING (true);

-- Service role full access (for API writes)
CREATE POLICY "Service full access picks" ON market_oracle_picks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service full access consensus" ON market_oracle_consensus_picks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service full access accuracy" ON ai_accuracy_tracking
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service full access factors" ON factor_performance
  FOR ALL USING (auth.role() = 'service_role');
```

---

## Sample Queries

### Get Recent Picks
```sql
SELECT * FROM market_oracle_picks
ORDER BY created_at DESC
LIMIT 20;
```

### Get Picks by Symbol
```sql
SELECT * FROM market_oracle_picks
WHERE symbol = 'AAPL'
ORDER BY created_at DESC;
```

### Get AI Accuracy
```sql
SELECT 
  ai_model,
  sector,
  accuracy * 100 as accuracy_percent,
  total_picks
FROM ai_accuracy_tracking
WHERE sector IS NULL
ORDER BY accuracy DESC;
```

### Get Pending Outcomes
```sql
SELECT * FROM market_oracle_picks
WHERE status = 'PENDING'
AND expires_at < NOW()
ORDER BY expires_at ASC;
```

### Get Win Rate by AI
```sql
SELECT 
  ai_model,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'WIN' THEN 1 ELSE 0 END) as wins,
  ROUND(100.0 * SUM(CASE WHEN status = 'WIN' THEN 1 ELSE 0 END) / COUNT(*), 1) as win_rate
FROM market_oracle_picks
WHERE status != 'PENDING'
GROUP BY ai_model
ORDER BY win_rate DESC;
```

### Get Sector Performance
```sql
SELECT 
  sector,
  COUNT(*) as total_picks,
  SUM(CASE WHEN status = 'WIN' THEN 1 ELSE 0 END) as wins,
  ROUND(100.0 * SUM(CASE WHEN status = 'WIN' THEN 1 ELSE 0 END) / COUNT(*), 1) as win_rate
FROM market_oracle_picks
WHERE status != 'PENDING'
GROUP BY sector
ORDER BY win_rate DESC;
```

---

## Migrations

Migrations are stored in `supabase/migrations/`. Run them in order in the Supabase SQL Editor.

### Running Migrations

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Paste migration SQL
4. Execute

### Migration Naming Convention
```
YYYYMMDDHHMMSS_description.sql
```

Example: `20251214120000_create_picks_table.sql`

---

## Backup & Recovery

### Export Data
```sql
-- Export picks to CSV (run in Supabase)
COPY (SELECT * FROM market_oracle_picks) TO '/tmp/picks.csv' WITH CSV HEADER;
```

### Point-in-Time Recovery
Supabase Pro includes daily backups. Contact support for point-in-time recovery.

---

## Performance Tips

1. **Use Indexes**: All foreign keys and commonly queried columns are indexed
2. **Limit Results**: Always use LIMIT for large tables
3. **Use Pagination**: For APIs, implement cursor-based pagination
4. **Archive Old Data**: Consider archiving picks older than 1 year

---

**Database managed by Supabase**
