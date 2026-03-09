// Market Oracle - What-If Market Simulator API
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SCENARIOS: Record<string, { name: string; description: string; prompt: string }> = {
  fed_rate_cut: { name: 'Fed Rate Cut', description: 'Fed cuts rates', prompt: 'Federal Reserve announces 25bp rate cut' },
  fed_rate_hike: { name: 'Fed Rate Hike', description: 'Fed raises rates', prompt: 'Federal Reserve announces 25bp rate hike' },
  recession: { name: 'Recession', description: 'Recession declared', prompt: 'NBER declares US recession' },
  inflation_spike: { name: 'Inflation Spike', description: 'CPI surge', prompt: 'CPI at 5%, above 2.5% expected' },
  tech_crash: { name: 'Tech Crash', description: 'Tech selloff', prompt: 'Major tech stocks drop 20%' },
  oil_shock: { name: 'Oil Shock', description: 'Oil spike', prompt: 'Oil spikes to $150/barrel' },
  ai_breakthrough: { name: 'AI Breakthrough', description: 'Major AI news', prompt: 'Transformative AI breakthrough announced' }
};

async function simulate(prompt: string): Promise<any> {
  if (!GROQ_API_KEY) return null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: 'Market analyst. Respond JSON only: {"scenario":"<desc>","probability":<0-100>,"marketImpact":{"sp500":{"change":<pct>,"reasoning":"<s>"},"nasdaq":{"change":<pct>,"reasoning":"<s>"},"bonds":{"change":<pct>,"reasoning":"<s>"},"gold":{"change":<pct>,"reasoning":"<s>"}},"sectorImpacts":[{"sector":"<n>","impact":"positive|negative|neutral","magnitude":<1-10>}],"stockPicks":[{"symbol":"<t>","action":"buy|sell|hold","expectedMove":<pct>}],"timeline":"<dur>","confidence":<0-100>}' },
          { role: 'user', content: `Simulate: "${prompt}". Include 5 sectors and 5 stocks.` }
        ],
        temperature: 0.4, max_tokens: 1200
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return JSON.parse((data.choices?.[0]?.message?.content || '').replace(/```json\n?|\n?```/g, '').trim());
  } catch { return null; }
}

export async function GET(request: Request) {
  const start = Date.now();
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get('scenario');
  const custom = searchParams.get('custom');
  if (!scenario && !custom) return NextResponse.json({ success: true, availableScenarios: Object.entries(SCENARIOS).map(([id, v]) => ({ id, ...v })), usage: '?scenario=fed_rate_cut or ?custom=Your scenario' });
  const template = scenario ? SCENARIOS[scenario] : null;
  const result = await simulate(custom || template?.prompt || scenario || '');
  if (!result) return NextResponse.json({ success: false, error: 'Simulation failed' }, { status: 500 });
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), processingTime: `${Date.now() - start}ms`, scenarioName: template?.name || 'Custom', simulation: result, disclaimer: 'Simulated scenario. Not financial advice.' });
}
