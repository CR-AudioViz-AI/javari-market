# Market Oracle AI - Documentation Index

**Complete documentation for the Multi-AI Stock Analysis Platform**

Last Updated: December 15, 2025

---

## 📚 Documentation Files

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Project overview and quick start |
| [API.md](./API.md) | Complete API reference |
| [SETUP.md](./SETUP.md) | Installation and deployment guide |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and data flow |
| [LEARNING_SYSTEM.md](./LEARNING_SYSTEM.md) | AI learning and calibration |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [CROSS_MARKETING_INTEGRATION.md](./CROSS_MARKETING_INTEGRATION.md) | CR AudioViz AI integration |

---

## 🚀 Quick Links

### Live Product
- **Landing Page**: https://crav-market-oracle.vercel.app
- **Dashboard**: https://crav-market-oracle.vercel.app/ai-picks

### GitHub
- **Repository**: https://github.com/CR-AudioViz-AI/crav-market-oracle

### External
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google AI Studio**: https://aistudio.google.com

---

## 🏗️ Project Structure

```
crav-market-oracle/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Landing page
│   ├── ai-picks/             # Dashboard
│   └── api/                  # API routes
├── lib/                      # Core logic
│   ├── ai/                   # AI orchestration
│   ├── learning/             # Calibration engine
│   └── types/                # TypeScript definitions
├── components/               # React components
├── docs/                     # Documentation (you are here)
├── supabase/                 # Database migrations
└── public/                   # Static assets
```

---

## 🤖 AI Models

| Model | Provider | Status | Personality |
|-------|----------|--------|-------------|
| GPT-4 | OpenAI | ✅ Active | Conservative, thorough |
| Claude | Anthropic | ⏳ Credits | Balanced, risk-aware |
| Gemini | Google | ✅ Active | Technical, pattern-focused |
| Perplexity | Perplexity AI | ✅ Active | Real-time, news-driven |
| **Javari** | CR AudioViz | ✅ Active | Consensus engine |

---

## 📊 Key Features

### Pick Generation
- Real-time market data
- Parallel AI analysis
- Direction + confidence + targets
- Factor assessments
- Risk/catalyst identification

### Javari Consensus
- Weighted voting
- Accuracy-based weights
- Sector-specific calibration
- Unified verdict

### Learning Pipeline
- Outcome tracking
- Accuracy measurement
- Factor performance
- Continuous improvement

---

## 🔑 Environment Variables

Required for production:

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers (at least one required)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
PERPLEXITY_API_KEY=

# Market Data
ALPHA_VANTAGE_API_KEY=
```

See [SETUP.md](./SETUP.md) for detailed configuration.

---

## 📡 API Overview

### Generate Picks
```bash
POST /api/ai-picks/generate
{"symbol": "AAPL"}
```

### Get History
```bash
GET /api/ai-picks/generate?limit=20
```

### Track Outcomes
```bash
GET /api/outcomes
POST /api/outcomes
```

See [API.md](./API.md) for complete reference.

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `market_oracle_picks` | Individual AI predictions |
| `market_oracle_consensus_picks` | Javari verdicts |
| `ai_accuracy_tracking` | Performance metrics |
| `factor_performance` | Factor calibration |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for schema details.

---

## 💰 Monetization

### Planned Tiers
- **Free**: 3 analyses/day
- **Pro** ($29/mo): Unlimited, all AIs
- **Enterprise** ($199/mo): API access, white-label

### Revenue Streams
1. SaaS subscriptions
2. API access fees
3. White-label licensing
4. Premium alerts

---

## 🔒 Security

- API keys in environment variables
- Supabase Row Level Security
- No credentials in repository
- Rate limiting (planned)

---

## 📞 Support

- **Company**: CR AudioViz AI, LLC
- **Website**: https://craudiovizai.com
- **Email**: support@craudiovizai.com

---

## 📝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

---

**Built with ❤️ by CR AudioViz AI**

*Your Story. Our Design.*
