// app/api/market-oracle/test-gpt4/route.ts - GPT-4 DIAGNOSTIC
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const log: string[] = [];
  
  try {
    log.push('=== GPT-4 DIAGNOSTIC TEST ===');
    log.push('');
    
    // Step 1: Check database for GPT-4
    log.push('Step 1: Checking ai_models table...');
    const { data: models } = await supabase
      .from('ai_models')
      .select('id, name, is_active')
      .eq('is_active', true);
    
    log.push(`Found ${models?.length || 0} active AI models:`);
    models?.forEach(m => log.push(`  - ${m.name} (ID: ${m.id})`));
    
    const gpt4 = models?.find(m => m.name === 'GPT-4');
    if (!gpt4) {
      log.push('');
      log.push('❌ ERROR: GPT-4 not found in database!');
      log.push('   The code looks for name="GPT-4" exactly');
      return NextResponse.json({ success: false, log, error: 'GPT-4 not in database' });
    }
    
    log.push('');
    log.push(`✅ GPT-4 found: ID=${gpt4.id}`);
    log.push('');
    
    // Step 2: Test OpenAI API
    log.push('Step 2: Testing OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'user',
          content: 'REGULAR STOCKS ($10+): Pick 5 major company stocks. Return EXACTLY 5 picks as JSON: [{"ticker":"SYM","confidence":75,"entry_price":100,"target_price":110,"reasoning":"Brief"}]. JSON only, no markdown.'
        }],
        max_tokens: 2000,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      log.push(`❌ OpenAI API failed: ${response.status}`);
      log.push(`   ${error.substring(0, 200)}`);
      return NextResponse.json({ success: false, log, error: 'OpenAI API error' });
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    log.push('✅ OpenAI API success');
    log.push(`   Response: ${content.substring(0, 200)}...`);
    log.push('');
    
    // Step 3: Parse JSON
    log.push('Step 3: Parsing JSON...');
    let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const s = cleaned.indexOf('['), e = cleaned.lastIndexOf(']') + 1;
    if (s >= 0 && e > s) cleaned = cleaned.slice(s, e);
    
    const picks = JSON.parse(cleaned);
    log.push(`✅ Parsed ${picks.length} picks:`);
    picks.forEach((p: any, i: number) => {
      log.push(`   ${i+1}. ${p.ticker} - ${p.confidence}% conf - $${p.entry_price} → $${p.target_price}`);
    });
    log.push('');
    
    // Step 4: Test database insert
    log.push('Step 4: Testing database insert (DRY RUN - will not save)...');
    const testPick = picks[0];
    const direction = testPick.target_price > testPick.entry_price ? 'UP' : 'DOWN';
    const stopLoss = direction === 'UP' ? testPick.entry_price * 0.95 : testPick.entry_price * 1.05;
    
    log.push('   Would insert:');
    log.push(`     ticker: ${testPick.ticker}`);
    log.push(`     category: regular`);
    log.push(`     ai_model_id: ${gpt4.id}`);
    log.push(`     confidence: ${testPick.confidence}`);
    log.push(`     direction: ${direction}`);
    log.push('');
    
    // Commented out actual insert for safety
    // const { error: insertError } = await supabase.from('stock_picks').insert({...});
    
    log.push('✅ All checks passed!');
    log.push('');
    log.push('=== CONCLUSION ===');
    log.push('GPT-4 should be working. If it\'s not saving picks:');
    log.push('1. Check for duplicate key constraint violations');
    log.push('2. Verify competition_id exists');
    log.push('3. Check RLS policies');
    
    return NextResponse.json({
      success: true,
      log,
      gpt4Id: gpt4.id,
      parsedPicks: picks.length,
      samplePick: picks[0],
    });
    
  } catch (error: any) {
    log.push('');
    log.push(`❌ ERROR: ${error.message}`);
    return NextResponse.json({ success: false, log, error: error.message });
  }
}
