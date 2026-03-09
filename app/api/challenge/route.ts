// app/api/challenge/route.ts
// 90-DAY CHALLENGE API: Enrollment, Progress, and Rewards
// Created: December 12, 2025 - Roy Henderson / CR AudioViz AI

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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
// Challenge Configuration
const CHALLENGE_CONFIG = {
  duration_days: 90,
  starting_balance: 10000, // $10,000 virtual dollars
  max_positions: 10,
  position_size_max: 0.25, // Max 25% per position
  milestones: [
    { day: 7, name: 'Week 1 Warrior', reward: 50, requirement: 'complete_first_week' },
    { day: 14, name: 'Consistent Trader', reward: 100, requirement: 'positive_return_2_weeks' },
    { day: 30, name: 'Monthly Master', reward: 200, requirement: 'beat_market_30_days' },
    { day: 45, name: 'Halfway Hero', reward: 300, requirement: 'portfolio_positive' },
    { day: 60, name: 'Two Month Titan', reward: 400, requirement: '10_percent_gain' },
    { day: 90, name: 'Challenge Champion', reward: 1000, requirement: 'complete_challenge' }
  ],
  leaderboard_prizes: {
    1: { credits: 5000, badge: 'Gold Champion', certificate: true },
    2: { credits: 2500, badge: 'Silver Medalist', certificate: true },
    3: { credits: 1000, badge: 'Bronze Winner', certificate: true },
    top10: { credits: 500, badge: 'Top 10 Finisher', certificate: false }
  }
};

interface ChallengeEnrollment {
  id: string;
  user_id: string;
  challenge_id: string;
  start_date: string;
  end_date: string;
  starting_balance: number;
  current_balance: number;
  total_return_percent: number;
  total_trades: number;
  winning_trades: number;
  current_day: number;
  status: 'active' | 'completed' | 'abandoned';
  milestones_achieved: string[];
  created_at: string;
}

// ----- API HANDLERS -----

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'status';
  const userId = url.searchParams.get('userId');
  const challengeId = url.searchParams.get('challengeId');
  
  try {
    switch (action) {
      case 'status':
        return await getChallengeStatus(userId);
      case 'leaderboard':
        return await getLeaderboard(challengeId);
      case 'milestones':
        return await getMilestones(userId);
      case 'history':
        return await getChallengeHistory(userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, challengeId, data } = body;
    
    switch (action) {
      case 'enroll':
        return await enrollInChallenge(userId);
      case 'trade':
        return await recordTrade(userId, challengeId, data);
      case 'check_milestones':
        return await checkMilestones(userId, challengeId);
      case 'complete':
        return await completeChallenge(userId, challengeId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----- CHALLENGE FUNCTIONS -----

async function getChallengeStatus(userId: string | null) {
  // Get active challenge
  const { data: activeChallenge } = await supabase
    .from('challenge_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  // Get current challenge info
  const { data: currentChallenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'active')
    .single();
  
  // Get leaderboard position
  let leaderboardPosition = null;
  if (activeChallenge) {
    const { count } = await supabase
      .from('challenge_enrollments')
      .select('*', { count: 'exact' })
      .eq('challenge_id', activeChallenge.challenge_id)
      .gt('total_return_percent', activeChallenge.total_return_percent);
    
    leaderboardPosition = (count || 0) + 1;
  }
  
  return NextResponse.json({
    enrolled: !!activeChallenge,
    enrollment: activeChallenge,
    currentChallenge: currentChallenge,
    leaderboardPosition,
    config: CHALLENGE_CONFIG
  });
}

async function enrollInChallenge(userId: string) {
  // Check if user already enrolled in active challenge
  const { data: existing } = await supabase
    .from('challenge_enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  if (existing) {
    return NextResponse.json({ 
      error: 'Already enrolled in active challenge' 
    }, { status: 400 });
  }
  
  // Get or create current challenge
  let { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'active')
    .single();
  
  if (!challenge) {
    // Create new challenge
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const { data: newChallenge, error: createError } = await supabase
      .from('challenges')
      .insert({
        name: `90-Day Challenge - ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        prize_pool: 10000,
        participant_count: 0
      })
      .select()
      .single();
    
    if (createError) throw createError;
    challenge = newChallenge;
  }
  
  // Create enrollment
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + CHALLENGE_CONFIG.duration_days * 24 * 60 * 60 * 1000);
  
  const enrollment = {
    user_id: userId,
    challenge_id: challenge.id,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    starting_balance: CHALLENGE_CONFIG.starting_balance,
    current_balance: CHALLENGE_CONFIG.starting_balance,
    total_return_percent: 0,
    total_trades: 0,
    winning_trades: 0,
    current_day: 1,
    status: 'active',
    milestones_achieved: [],
    positions: []
  };
  
  const { data: newEnrollment, error: enrollError } = await supabase
    .from('challenge_enrollments')
    .insert(enrollment)
    .select()
    .single();
  
  if (enrollError) throw enrollError;
  
  // Update participant count
  await supabase
    .from('challenges')
    .update({ participant_count: (challenge.participant_count || 0) + 1 })
    .eq('id', challenge.id);
  
  return NextResponse.json({
    success: true,
    enrollment: newEnrollment,
    message: `Welcome to the 90-Day Challenge! Starting balance: $${CHALLENGE_CONFIG.starting_balance.toLocaleString()}`
  });
}

async function recordTrade(userId: string, challengeId: string, tradeData: any) {
  // Get enrollment
  const { data: enrollment, error: fetchError } = await supabase
    .from('challenge_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .eq('status', 'active')
    .single();
  
  if (fetchError || !enrollment) {
    return NextResponse.json({ error: 'No active enrollment found' }, { status: 404 });
  }
  
  // Validate trade
  const { ticker, action, shares, price, ai_model_id } = tradeData;
  const tradeValue = shares * price;
  
  // Position size check
  const positionPercent = tradeValue / enrollment.current_balance;
  if (positionPercent > CHALLENGE_CONFIG.position_size_max) {
    return NextResponse.json({ 
      error: `Position too large. Max ${CHALLENGE_CONFIG.position_size_max * 100}% per trade` 
    }, { status: 400 });
  }
  
  // Record trade
  const tradeRecord = {
    enrollment_id: enrollment.id,
    user_id: userId,
    ticker,
    action, // 'buy' or 'sell'
    shares,
    price,
    total_value: tradeValue,
    ai_model_id, // Which AI recommendation they followed
    created_at: new Date().toISOString()
  };
  
  await supabase.from('challenge_trades').insert(tradeRecord);
  
  // Update enrollment
  const newBalance = action === 'buy' 
    ? enrollment.current_balance - tradeValue
    : enrollment.current_balance + tradeValue;
  
  const totalReturn = ((newBalance - CHALLENGE_CONFIG.starting_balance) / CHALLENGE_CONFIG.starting_balance) * 100;
  
  await supabase
    .from('challenge_enrollments')
    .update({
      current_balance: newBalance,
      total_return_percent: parseFloat(totalReturn.toFixed(2)),
      total_trades: enrollment.total_trades + 1
    })
    .eq('id', enrollment.id);
  
  return NextResponse.json({
    success: true,
    trade: tradeRecord,
    new_balance: newBalance,
    total_return_percent: totalReturn
  });
}

async function getLeaderboard(challengeId: string | null) {
  let query = supabase
    .from('challenge_enrollments')
    .select(`
      id,
      user_id,
      total_return_percent,
      total_trades,
      winning_trades,
      current_balance,
      milestones_achieved,
      profiles:user_id (display_name, avatar_url)
    `)
    .order('total_return_percent', { ascending: false })
    .limit(100);
  
  if (challengeId) {
    query = query.eq('challenge_id', challengeId);
  }
  
  const { data: leaderboard } = await query;
  
  // Add rank and prize info
  const rankedLeaderboard = (leaderboard || []).map((entry, index) => ({
    ...entry,
    rank: index + 1,
    prize: getPrizeForRank(index + 1)
  }));
  
  return NextResponse.json({
    leaderboard: rankedLeaderboard,
    prizes: CHALLENGE_CONFIG.leaderboard_prizes
  });
}

function getPrizeForRank(rank: number) {
  if (rank === 1) return CHALLENGE_CONFIG.leaderboard_prizes[1];
  if (rank === 2) return CHALLENGE_CONFIG.leaderboard_prizes[2];
  if (rank === 3) return CHALLENGE_CONFIG.leaderboard_prizes[3];
  if (rank <= 10) return CHALLENGE_CONFIG.leaderboard_prizes.top10;
  return null;
}

async function getMilestones(userId: string | null) {
  if (!userId) {
    return NextResponse.json({ milestones: CHALLENGE_CONFIG.milestones });
  }
  
  const { data: enrollment } = await supabase
    .from('challenge_enrollments')
    .select('milestones_achieved, current_day, total_return_percent')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  const milestonesWithStatus = CHALLENGE_CONFIG.milestones.map(m => ({
    ...m,
    achieved: enrollment?.milestones_achieved?.includes(m.name) || false,
    available: enrollment ? enrollment.current_day >= m.day : false
  }));
  
  return NextResponse.json({
    milestones: milestonesWithStatus,
    current_day: enrollment?.current_day || 0
  });
}

async function checkMilestones(userId: string, challengeId: string) {
  const { data: enrollment } = await supabase
    .from('challenge_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .eq('status', 'active')
    .single();
  
  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
  }
  
  const achievedMilestones = enrollment.milestones_achieved || [];
  const newMilestones: string[] = [];
  let creditsEarned = 0;
  
  for (const milestone of CHALLENGE_CONFIG.milestones) {
    if (achievedMilestones.includes(milestone.name)) continue;
    if (enrollment.current_day < milestone.day) continue;
    
    // Check requirement
    let achieved = false;
    
    switch (milestone.requirement) {
      case 'complete_first_week':
        achieved = enrollment.current_day >= 7;
        break;
      case 'positive_return_2_weeks':
        achieved = enrollment.current_day >= 14 && enrollment.total_return_percent > 0;
        break;
      case 'beat_market_30_days':
        achieved = enrollment.current_day >= 30 && enrollment.total_return_percent > 2; // Beat 2% market
        break;
      case 'portfolio_positive':
        achieved = enrollment.current_day >= 45 && enrollment.current_balance > CHALLENGE_CONFIG.starting_balance;
        break;
      case '10_percent_gain':
        achieved = enrollment.total_return_percent >= 10;
        break;
      case 'complete_challenge':
        achieved = enrollment.current_day >= 90;
        break;
    }
    
    if (achieved) {
      newMilestones.push(milestone.name);
      creditsEarned += milestone.reward;
    }
  }
  
  if (newMilestones.length > 0) {
    // Update enrollment with new milestones
    await supabase
      .from('challenge_enrollments')
      .update({
        milestones_achieved: [...achievedMilestones, ...newMilestones]
      })
      .eq('id', enrollment.id);
    
    // Award credits
    if (creditsEarned > 0) {
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: creditsEarned,
        type: 'milestone_reward',
        description: `90-Day Challenge milestones: ${newMilestones.join(', ')}`
      });
    }
  }
  
  return NextResponse.json({
    new_milestones: newMilestones,
    credits_earned: creditsEarned,
    total_milestones: [...achievedMilestones, ...newMilestones].length
  });
}

async function getChallengeHistory(userId: string | null) {
  if (!userId) {
    return NextResponse.json({ history: [] });
  }
  
  const { data: history } = await supabase
    .from('challenge_enrollments')
    .select(`
      *,
      challenges:challenge_id (name, start_date, end_date)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return NextResponse.json({ history: history || [] });
}

async function completeChallenge(userId: string, challengeId: string) {
  const { data: enrollment } = await supabase
    .from('challenge_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .single();
  
  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
  }
  
  // Mark as completed
  await supabase
    .from('challenge_enrollments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', enrollment.id);
  
  // Get final rank
  const { count } = await supabase
    .from('challenge_enrollments')
    .select('*', { count: 'exact' })
    .eq('challenge_id', challengeId)
    .gt('total_return_percent', enrollment.total_return_percent);
  
  const finalRank = (count || 0) + 1;
  const prize = getPrizeForRank(finalRank);
  
  // Award prize credits
  if (prize) {
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: prize.credits,
      type: 'challenge_prize',
      description: `90-Day Challenge ${prize.badge} - Rank #${finalRank}`
    });
  }
  
  return NextResponse.json({
    success: true,
    final_rank: finalRank,
    final_return: enrollment.total_return_percent,
    prize,
    message: prize 
      ? `Congratulations! You finished #${finalRank} and earned ${prize.credits} credits!`
      : `Challenge completed! Final rank: #${finalRank}`
  });
}
