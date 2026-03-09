// app/api/leaderboard/route.ts
// AI MODEL LEADERBOARD API - Real-time rankings
// Created: December 12, 2025 - CR AudioViz AI

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 1 minute

// Lazy Supabase client — initialized on first request (not at module load time)
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kteobfyferrukqeolofj.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZW9iZnlmZXJydWtxZW9sb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NzUwNjUsImV4cCI6MjA1NTE1MTA2NX0.r3_3bXtqo6VCJqYHijtxdEpXkWyNVGKd67kNQvqkrD4";
    _supabase = createClient(url, key);
  }
  return _supabase!;
}
const supabase = getSupabase();
interface AIModelStats {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  color: string;
  specialty: string;
  provider: string;
  total_picks: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  total_profit_loss: number;
  current_streak: number;
  best_win_streak: number;
  is_active: boolean;
  rank?: number;
  recent_picks?: any[];
  best_pick?: any;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const timeframe = url.searchParams.get('timeframe') || 'all'; // all, week, month
  const category = url.searchParams.get('category') || 'all'; // all, regular, penny, crypto
  const limit = parseInt(url.searchParams.get('limit') || '10');

  try {
    // Get all AI models with their stats
    const { data: models, error: modelsError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('win_rate', { ascending: false });

    if (modelsError) throw modelsError;

    // Get recent picks for each model
    const modelsWithDetails: AIModelStats[] = await Promise.all(
      (models || []).map(async (model, index) => {
        // Get recent picks
        let picksQuery = supabase
          .from('stock_picks')
          .select('*')
          .eq('ai_model_id', model.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (category !== 'all') {
          picksQuery = picksQuery.eq('category', category);
        }

        // Apply timeframe filter
        if (timeframe === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          picksQuery = picksQuery.gte('created_at', weekAgo.toISOString());
        } else if (timeframe === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          picksQuery = picksQuery.gte('created_at', monthAgo.toISOString());
        }

        const { data: recentPicks } = await picksQuery;

        // Get best pick
        const { data: bestPicks } = await supabase
          .from('stock_picks')
          .select('*')
          .eq('ai_model_id', model.id)
          .eq('result', 'win')
          .order('profit_loss_percent', { ascending: false })
          .limit(1);

        return {
          ...model,
          rank: index + 1,
          recent_picks: recentPicks || [],
          best_pick: bestPicks?.[0] || null
        };
      })
    );

    // Calculate additional stats
    const leaderboard = modelsWithDetails.slice(0, limit);
    
    // Get overall stats
    const { data: totalPicks } = await supabase
      .from('stock_picks')
      .select('id', { count: 'exact' });

    const { data: winningPicks } = await supabase
      .from('stock_picks')
      .select('id', { count: 'exact' })
      .eq('result', 'win');

    const overallWinRate = totalPicks && winningPicks 
      ? (winningPicks.length / totalPicks.length * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      success: true,
      leaderboard,
      stats: {
        total_models: models?.length || 0,
        total_picks: totalPicks?.length || 0,
        overall_win_rate: overallWinRate,
        timeframe,
        category
      },
      updated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST: Manual refresh/recalculate
export async function POST(request: NextRequest) {
  try {
    // Recalculate all AI model stats
    const { data: models } = await supabase
      .from('ai_models')
      .select('id');

    if (!models) {
      return NextResponse.json({ success: true, message: 'No models to update' });
    }

    for (const model of models) {
      // Get all picks for this model
      const { data: picks } = await supabase
        .from('stock_picks')
        .select('result, profit_loss_percent, points_earned')
        .eq('ai_model_id', model.id)
        .not('result', 'is', null);

      if (!picks || picks.length === 0) continue;

      const wins = picks.filter(p => p.result === 'win').length;
      const losses = picks.filter(p => p.result === 'loss').length;
      const totalPicks = wins + losses;
      const winRate = totalPicks > 0 ? (wins / totalPicks) * 100 : 0;
      const totalProfitLoss = picks.reduce((sum, p) => sum + (p.profit_loss_percent || 0), 0);

      // Calculate streaks
      let currentStreak = 0;
      let bestWinStreak = 0;
      let worstLossStreak = 0;
      let tempWinStreak = 0;
      let tempLossStreak = 0;

      for (const pick of picks.reverse()) {
        if (pick.result === 'win') {
          tempWinStreak++;
          tempLossStreak = 0;
          bestWinStreak = Math.max(bestWinStreak, tempWinStreak);
          currentStreak = tempWinStreak;
        } else if (pick.result === 'loss') {
          tempLossStreak++;
          tempWinStreak = 0;
          worstLossStreak = Math.max(worstLossStreak, tempLossStreak);
          currentStreak = -tempLossStreak;
        }
      }

      // Update model stats
      await supabase
        .from('ai_models')
        .update({
          total_picks: totalPicks,
          total_wins: wins,
          total_losses: losses,
          win_rate: parseFloat(winRate.toFixed(2)),
          total_profit_loss: parseFloat(totalProfitLoss.toFixed(2)),
          current_streak: currentStreak,
          best_win_streak: bestWinStreak,
          worst_loss_streak: worstLossStreak,
          updated_at: new Date().toISOString()
        })
        .eq('id', model.id);
    }

    return NextResponse.json({
      success: true,
      message: `Updated stats for ${models.length} models`,
      updated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Leaderboard recalculation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
