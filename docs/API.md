# Market Oracle AI - API Documentation

**Version:** 1.0  
**Base URL:** `https://crav-market-oracle.vercel.app`  
**Last Updated:** December 14, 2025

---

## Authentication

Currently, the API is open for public use. Authentication will be added in a future release for rate limiting and premium features.

---

## Endpoints

### 1. Generate AI Picks

Generate stock analysis from multiple AI models with Javari consensus.

**Endpoint:** `POST /api/ai-picks/generate`

**Request:**
```json
{
  "symbol": "AAPL",
  "aiModel": "all"  // Optional: "gpt4", "claude", "gemini", "perplexity", or "all"
}
```

**Response:**
```json
{
  "success": true,
  "symbol": "AAPL",
  "marketData": {
    "currentPrice": 175.50,
    "changePercent24h": 1.25,
    "volume": 52000000,
    "marketCap": 2800000000000,
    "peRatio": 28.5,
    "high52Week": 199.62,
    "low52Week": 164.08
  },
  "picks": [
    {
      "id": "uuid",
      "aiModel": "gpt4",
      "symbol": "AAPL",
      "companyName": "Apple Inc.",
      "sector": "Technology",
      "direction": "HOLD",
      "confidence": 55,
      "timeframe": "1W",
      "entryPrice": 175.50,
      "targetPrice": 185.00,
      "stopLoss": 168.00,
      "thesis": "Short summary of the analysis",
      "fullReasoning": "Detailed multi-paragraph analysis...",
      "factorAssessments": [
        {
          "factorId": "pe_ratio",
          "factorName": "P/E Ratio",
          "value": "28.5",
          "interpretation": "NEUTRAL",
          "confidence": 60,
          "reasoning": "P/E is in line with sector average"
        }
      ],
      "keyBullishFactors": [
        "Strong iPhone sales momentum",
        "Services revenue growing 15% YoY"
      ],
      "keyBearishFactors": [
        "China market concerns",
        "Regulatory pressure in EU"
      ],
      "risks": [
        "Supply chain disruptions",
        "Currency headwinds"
      ],
      "catalysts": [
        "Q1 earnings report in January",
        "New product announcements expected"
      ],
      "createdAt": "2025-12-14T22:00:00Z",
      "expiresAt": "2025-12-21T22:00:00Z",
      "status": "PENDING"
    }
  ],
  "consensus": {
    "consensusDirection": "HOLD",
    "consensusStrength": "MODERATE",
    "weightedConfidence": 52.5,
    "javariConfidence": 55,
    "javariReasoning": "Mixed signals from AI models. GPT-4 and Perplexity favor HOLD while Gemini is bearish...",
    "aiPicks": [
      {"aiModel": "gpt4", "direction": "HOLD", "confidence": 55},
      {"aiModel": "gemini", "direction": "DOWN", "confidence": 70},
      {"aiModel": "perplexity", "direction": "HOLD", "confidence": 65}
    ]
  },
  "aiStatus": {
    "gpt4": "success",
    "claude": "failed",
    "gemini": "success",
    "perplexity": "success"
  },
  "dbErrors": []
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid symbol
- `500` - Server error

---

### 2. Get Historical Picks

Retrieve previously generated AI picks.

**Endpoint:** `GET /api/ai-picks/generate`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 20 | Number of picks to return (max 100) |
| symbol | string | - | Filter by stock symbol |
| ai | string | - | Filter by AI model |
| status | string | - | Filter by status (PENDING, WIN, LOSS) |

**Example:**
```bash
GET /api/ai-picks/generate?limit=10&symbol=AAPL&ai=gpt4
```

**Response:**
```json
{
  "success": true,
  "picks": [...],
  "total": 45
}
```

---

### 3. Get Pending Outcomes

Get picks that are pending outcome resolution.

**Endpoint:** `GET /api/outcomes`

**Response:**
```json
{
  "success": true,
  "pending": {
    "total": 12,
    "expiringSoon": 3,
    "picks": [...]
  },
  "stats": {
    "totalPicks": 45,
    "wins": 18,
    "losses": 15,
    "pending": 12,
    "winRate": 54.5
  }
}
```

---

### 4. Process Outcomes

Process expired picks and determine WIN/LOSS.

**Endpoint:** `POST /api/outcomes`

**Request (Process all expired):**
```json
{}
```

**Request (Force resolve specific pick):**
```json
{
  "action": "force-resolve",
  "pickId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "processed": 3,
  "results": [
    {
      "pickId": "uuid",
      "symbol": "AAPL",
      "aiModel": "gpt4",
      "direction": "UP",
      "entryPrice": 175.50,
      "currentPrice": 182.30,
      "outcome": "WIN",
      "percentChange": 3.87
    }
  ]
}
```

---

## Data Types

### Direction
```typescript
type PickDirection = "UP" | "DOWN" | "HOLD";
```

### Timeframe
```typescript
type Timeframe = "1W" | "2W" | "1M";
```

### Status
```typescript
type PickStatus = "PENDING" | "WIN" | "LOSS";
```

### AI Model
```typescript
type AIModelName = "gpt4" | "claude" | "gemini" | "perplexity" | "javari";
```

### Factor Interpretation
```typescript
type FactorInterpretation = "BULLISH" | "BEARISH" | "NEUTRAL";
```

---

## Rate Limits

| Tier | Limit | Window |
|------|-------|--------|
| Free | 10 requests | per minute |
| Pro | 100 requests | per minute |
| Enterprise | Unlimited | - |

---

## Error Handling

All errors return:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Error Codes:**
- `INVALID_SYMBOL` - Stock symbol not found
- `MARKET_DATA_ERROR` - Could not fetch market data
- `AI_ERROR` - All AI models failed
- `DATABASE_ERROR` - Database operation failed
- `RATE_LIMITED` - Too many requests

---

## Webhooks (Coming Soon)

Subscribe to pick outcomes:
```json
{
  "event": "pick.resolved",
  "data": {
    "pickId": "uuid",
    "outcome": "WIN",
    "symbol": "AAPL"
  }
}
```

---

## SDK (Coming Soon)

```javascript
import { MarketOracle } from '@craudioviz/market-oracle';

const oracle = new MarketOracle({ apiKey: 'your-key' });
const analysis = await oracle.analyze('AAPL');
console.log(analysis.consensus.direction);
```

---

## Support

- Email: support@craudiovizai.com
- Documentation: https://crav-market-oracle.vercel.app/docs
