import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const results = [];
  
  // Try v1 and v1beta with different models
  const tests = [
    { version: 'v1beta', model: 'gemini-pro' },
    { version: 'v1', model: 'gemini-pro' },
    { version: 'v1beta', model: 'gemini-1.5-flash' },
    { version: 'v1', model: 'gemini-1.5-flash' },
  ];
  
  for (const test of tests) {
    try {
      const url = `https://generativelanguage.googleapis.com/${test.version}/models/${test.model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] }),
      });
      
      const data = await response.json().catch(() => ({}));
      results.push({
        version: test.version,
        model: test.model,
        status: response.status,
        works: response.status === 200,
        response: data.candidates ? 'SUCCESS' : data.error?.message?.slice(0, 60),
      });
    } catch (e) {
      results.push({ version: test.version, model: test.model, status: 'error', works: false });
    }
  }
  
  return NextResponse.json({ results });
}
