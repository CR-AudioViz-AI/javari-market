// lib/competition/scoring.ts
// Market Oracle - Competition Scoring & Championship System
// Created: December 21, 2025

import { AIModelId, AITier, getModelById, getTierConfig } from '../types/ai-models';

// ============================================================================
// SCORING CONFIGURATION
// ============================================================================

export interface ScoringConfig {
  // Points for outcomes
  correctDirection: number;      // +10 - Predicted direction correctly
  hitTarget: number;             // +25 - Price hit target
  beatMarket: number;            // +5  - Outperformed S&P 500
  wrongDirection: number;        // -10 - Predicted wrong direction
  hitStopLoss: number;           // -15 - Price hit stop loss
  
  // Confidence multipliers
  highConfidenceBonus: number;   // 1.5x - Confidence >= 80%
  lowConfidencePenalty: number;  // 0.5x - Confidence < 50%
  
  // Streak bonuses
  winStreakBonus: Record<number, number>; // 3: +5, 5: +15, 10: +50
  lossStreakPenalty: Record<number, number>; // 3: -5, 5: -15
  
  // Special achievements
  perfectWeek: number;           // +100 - All picks correct in a week
  perfectMonth: number;          // +500 - All picks correct in a month
  upsetVictory: number;          // +25  - Small tier beats Large tier
  
  // Championship points
  quarterlyWin: number;          // +500 - Win quarterly championship
  championsChallengeWin: number; // +1000 - Win Champions Challenge
  grandChampion: number;         // +2500 - Win Annual Final Faceoff
}

export const DEFAULT_SCORING: ScoringConfig = {
  correctDirection: 10,
  hitTarget: 25,
  beatMarket: 5,
  wrongDirection: -10,
  hitStopLoss: -15,
  
  highConfidenceBonus: 1.5,
  lowConfidencePenalty: 0.5,
  
  winStreakBonus: { 3: 5, 5: 15, 10: 50, 20: 200 },
  lossStreakPenalty: { 3: -5, 5: -15, 10: -50 },
  
  perfectWeek: 100,
  perfectMonth: 500,
  upsetVictory: 25,
  
  quarterlyWin: 500,
  championsChallengeWin: 1000,
  grandChampion: 2500,
};

// ============================================================================
// PICK OUTCOME TYPE
// ============================================================================

export interface PickOutcome {
  pickId: string;
  modelId: AIModelId;
  symbol: string;
  
  // Prediction
  predictedDirection: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  
  // Actual result
  actualDirection: 'UP' | 'DOWN' | 'FLAT';
  closedPrice: number;
  actualReturn: number;
  hitTarget: boolean;
  hitStopLoss: boolean;
  
  // Market comparison
  marketReturn: number; // S&P 500 return over same period
  beatMarket: boolean;
  
  // Metadata
  createdAt: Date;
  closedAt: Date;
  timeframe: string;
}

// ============================================================================
// CALCULATE POINTS FOR A SINGLE PICK
// ============================================================================

export function calculatePickPoints(
  outcome: PickOutcome, 
  currentStreak: number,
  config: ScoringConfig = DEFAULT_SCORING
): { points: number; breakdown: PointBreakdown } {
  let points = 0;
  const breakdown: PointBreakdown = {
    basePoints: 0,
    confidenceMultiplier: 1,
    streakBonus: 0,
    specialBonus: 0,
    details: [],
  };

  // Check if direction was correct
  const directionCorrect = 
    (outcome.predictedDirection === 'UP' && outcome.actualDirection === 'UP') ||
    (outcome.predictedDirection === 'DOWN' && outcome.actualDirection === 'DOWN') ||
    (outcome.predictedDirection === 'HOLD' && outcome.actualDirection === 'FLAT');

  // Base points for direction
  if (directionCorrect) {
    breakdown.basePoints += config.correctDirection;
    breakdown.details.push(`✅ Correct direction: +${config.correctDirection}`);
    
    // Target hit bonus
    if (outcome.hitTarget) {
      breakdown.basePoints += config.hitTarget;
      breakdown.details.push(`🎯 Hit target price: +${config.hitTarget}`);
    }
    
    // Beat market bonus
    if (outcome.beatMarket) {
      breakdown.basePoints += config.beatMarket;
      breakdown.details.push(`📈 Beat market: +${config.beatMarket}`);
    }
  } else {
    // Wrong direction penalty
    breakdown.basePoints += config.wrongDirection;
    breakdown.details.push(`❌ Wrong direction: ${config.wrongDirection}`);
    
    // Stop loss hit penalty
    if (outcome.hitStopLoss) {
      breakdown.basePoints += config.hitStopLoss;
      breakdown.details.push(`🛑 Hit stop loss: ${config.hitStopLoss}`);
    }
  }

  // Confidence multiplier
  if (outcome.confidence >= 80) {
    breakdown.confidenceMultiplier = config.highConfidenceBonus;
    breakdown.details.push(`💪 High confidence (${outcome.confidence}%): ${config.highConfidenceBonus}x`);
  } else if (outcome.confidence < 50) {
    breakdown.confidenceMultiplier = config.lowConfidencePenalty;
    breakdown.details.push(`😰 Low confidence (${outcome.confidence}%): ${config.lowConfidencePenalty}x`);
  }

  // Streak bonuses/penalties
  if (directionCorrect && currentStreak > 0) {
    const streakLevels = Object.keys(config.winStreakBonus)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const level of streakLevels) {
      if (currentStreak >= level) {
        breakdown.streakBonus = config.winStreakBonus[level];
        breakdown.details.push(`🔥 ${currentStreak} win streak: +${breakdown.streakBonus}`);
        break;
      }
    }
  } else if (!directionCorrect && currentStreak < 0) {
    const streakLevels = Object.keys(config.lossStreakPenalty)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const level of streakLevels) {
      if (Math.abs(currentStreak) >= level) {
        breakdown.streakBonus = config.lossStreakPenalty[level];
        breakdown.details.push(`💀 ${Math.abs(currentStreak)} loss streak: ${breakdown.streakBonus}`);
        break;
      }
    }
  }

  // Calculate total
  points = Math.round(
    (breakdown.basePoints * breakdown.confidenceMultiplier) + 
    breakdown.streakBonus + 
    breakdown.specialBonus
  );

  return { points, breakdown };
}

export interface PointBreakdown {
  basePoints: number;
  confidenceMultiplier: number;
  streakBonus: number;
  specialBonus: number;
  details: string[];
}

// ============================================================================
// LEADERBOARD ENTRY
// ============================================================================

export interface LeaderboardEntry {
  modelId: AIModelId;
  displayName: string;
  avatar: string;
  tier: AITier;
  
  // Points
  totalPoints: number;
  stockPoints: number;
  pennyStockPoints: number;
  cryptoPoints: number;
  
  // Performance
  totalPicks: number;
  wins: number;
  losses: number;
  winRate: number;
  avgReturn: number;
  avgConfidence: number;
  
  // Streaks
  currentStreak: number;
  bestStreak: number;
  worstStreak: number;
  
  // Rankings
  tierRank: number;
  overallRank: number;
  previousRank: number;
  rankChange: number; // positive = moved up
  
  // Achievements
  quarterlyWins: number;
  championsChallengeWins: number;
  grandChampionWins: number;
  perfectWeeks: number;
  upsetVictories: number;
  
  // Timestamps
  lastPickAt: Date;
  lastWinAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CHAMPIONSHIP TYPES
// ============================================================================

export type ChampionshipType = 
  | 'quarterly'           // Q1, Q2, Q3, Q4 within tier
  | 'champions_challenge' // Winners from each tier compete
  | 'final_faceoff';      // Annual grand championship

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface Championship {
  id: string;
  type: ChampionshipType;
  name: string;
  description: string;
  year: number;
  quarter?: Quarter;
  tier?: AITier; // For quarterly championships
  
  // Status
  status: 'upcoming' | 'active' | 'completed';
  startDate: Date;
  endDate: Date;
  
  // Participants
  participants: AIModelId[];
  
  // Results (when completed)
  winner?: AIModelId;
  runnerUp?: AIModelId;
  thirdPlace?: AIModelId;
  finalStandings?: { modelId: AIModelId; points: number; rank: number }[];
  
  // Prize
  prizePoints: number;
}

export interface SeasonStandings {
  year: number;
  tier: AITier;
  standings: {
    modelId: AIModelId;
    q1Points: number;
    q2Points: number;
    q3Points: number;
    q4Points: number;
    totalPoints: number;
    quarterlyWins: number;
    rank: number;
  }[];
}

// ============================================================================
// PROMOTION/RELEGATION
// ============================================================================

export interface PromotionRelegation {
  quarter: Quarter;
  year: number;
  promotions: {
    modelId: AIModelId;
    fromTier: AITier;
    toTier: AITier;
    reason: string;
  }[];
  relegations: {
    modelId: AIModelId;
    fromTier: AITier;
    toTier: AITier;
    reason: string;
  }[];
}

// Get models eligible for promotion (top 2 in tier)
export function getPromotionCandidates(
  standings: LeaderboardEntry[], 
  tier: AITier
): LeaderboardEntry[] {
  return standings
    .filter(e => e.tier === tier)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 2);
}

// Get models eligible for relegation (bottom 2 in tier)
export function getRelegationCandidates(
  standings: LeaderboardEntry[], 
  tier: AITier
): LeaderboardEntry[] {
  return standings
    .filter(e => e.tier === tier)
    .sort((a, b) => a.totalPoints - b.totalPoints)
    .slice(0, 2);
}

// ============================================================================
// TIER LEADERBOARD FUNCTIONS
// ============================================================================

export function calculateTierLeaderboard(
  entries: LeaderboardEntry[], 
  tier: AITier
): LeaderboardEntry[] {
  return entries
    .filter(e => e.tier === tier)
    .sort((a, b) => {
      // Primary: Total points
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      // Secondary: Win rate
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      // Tertiary: Total picks (more picks = tiebreaker)
      return b.totalPicks - a.totalPicks;
    })
    .map((entry, index) => ({
      ...entry,
      tierRank: index + 1,
    }));
}

export function calculateOverallLeaderboard(
  entries: LeaderboardEntry[]
): LeaderboardEntry[] {
  return entries
    .sort((a, b) => {
      // Primary: Total points
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      // Secondary: Win rate
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      // Tertiary: Tier prestige (large > medium > small)
      const tierOrder: Record<AITier, number> = { large: 3, medium: 2, small: 1, javari: 4 };
      return tierOrder[b.tier] - tierOrder[a.tier];
    })
    .map((entry, index) => ({
      ...entry,
      overallRank: index + 1,
    }));
}

// ============================================================================
// CHAMPIONSHIP SCHEDULING
// ============================================================================

export function getQuarterDates(year: number, quarter: Quarter): { start: Date; end: Date } {
  const quarters: Record<Quarter, { startMonth: number; endMonth: number }> = {
    Q1: { startMonth: 0, endMonth: 2 },   // Jan-Mar
    Q2: { startMonth: 3, endMonth: 5 },   // Apr-Jun
    Q3: { startMonth: 6, endMonth: 8 },   // Jul-Sep
    Q4: { startMonth: 9, endMonth: 11 },  // Oct-Dec
  };
  
  const q = quarters[quarter];
  return {
    start: new Date(year, q.startMonth, 1),
    end: new Date(year, q.endMonth + 1, 0, 23, 59, 59), // Last day of end month
  };
}

export function getCurrentQuarter(): Quarter {
  const month = new Date().getMonth();
  if (month <= 2) return 'Q1';
  if (month <= 5) return 'Q2';
  if (month <= 8) return 'Q3';
  return 'Q4';
}

export function getNextQuarter(current: Quarter): Quarter {
  const order: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentIndex = order.indexOf(current);
  return order[(currentIndex + 1) % 4];
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export type AchievementId = 
  | 'first_win'
  | 'win_streak_3'
  | 'win_streak_5'
  | 'win_streak_10'
  | 'win_streak_20'
  | 'perfect_week'
  | 'perfect_month'
  | 'quarterly_champion'
  | 'champions_challenge_winner'
  | 'grand_champion'
  | 'upset_victory'
  | 'promoted'
  | 'top_accuracy'
  | 'most_picks'
  | 'highest_avg_return'
  | 'comeback_king'; // Recover from 5+ loss streak to win

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  first_win: {
    id: 'first_win',
    name: 'First Blood',
    description: 'Win your first pick',
    icon: '🎉',
    rarity: 'common',
    points: 5,
  },
  win_streak_3: {
    id: 'win_streak_3',
    name: 'Hot Streak',
    description: 'Win 3 picks in a row',
    icon: '🔥',
    rarity: 'common',
    points: 10,
  },
  win_streak_5: {
    id: 'win_streak_5',
    name: 'On Fire',
    description: 'Win 5 picks in a row',
    icon: '🔥🔥',
    rarity: 'uncommon',
    points: 25,
  },
  win_streak_10: {
    id: 'win_streak_10',
    name: 'Unstoppable',
    description: 'Win 10 picks in a row',
    icon: '🏆',
    rarity: 'rare',
    points: 100,
  },
  win_streak_20: {
    id: 'win_streak_20',
    name: 'Legendary Streak',
    description: 'Win 20 picks in a row',
    icon: '👑',
    rarity: 'legendary',
    points: 500,
  },
  perfect_week: {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Win all picks in a week',
    icon: '⭐',
    rarity: 'rare',
    points: 100,
  },
  perfect_month: {
    id: 'perfect_month',
    name: 'Perfect Month',
    description: 'Win all picks in a month',
    icon: '🌟',
    rarity: 'legendary',
    points: 500,
  },
  quarterly_champion: {
    id: 'quarterly_champion',
    name: 'Quarterly Champion',
    description: 'Win a quarterly championship',
    icon: '🥇',
    rarity: 'epic',
    points: 250,
  },
  champions_challenge_winner: {
    id: 'champions_challenge_winner',
    name: 'Champions Challenge Winner',
    description: 'Win the Champions Challenge',
    icon: '🏅',
    rarity: 'legendary',
    points: 500,
  },
  grand_champion: {
    id: 'grand_champion',
    name: 'Grand Champion',
    description: 'Win the Annual Final Faceoff',
    icon: '👑',
    rarity: 'legendary',
    points: 1000,
  },
  upset_victory: {
    id: 'upset_victory',
    name: 'Giant Slayer',
    description: 'Small tier model beats Large tier in head-to-head',
    icon: '⚔️',
    rarity: 'rare',
    points: 50,
  },
  promoted: {
    id: 'promoted',
    name: 'Moving Up',
    description: 'Get promoted to a higher tier',
    icon: '📈',
    rarity: 'uncommon',
    points: 50,
  },
  top_accuracy: {
    id: 'top_accuracy',
    name: 'Sharpshooter',
    description: 'Achieve 70%+ win rate over 50+ picks',
    icon: '🎯',
    rarity: 'epic',
    points: 200,
  },
  most_picks: {
    id: 'most_picks',
    name: 'Workhorse',
    description: 'Make the most picks in a quarter',
    icon: '💪',
    rarity: 'uncommon',
    points: 50,
  },
  highest_avg_return: {
    id: 'highest_avg_return',
    name: 'Big Returns',
    description: 'Achieve highest average return in a quarter',
    icon: '💰',
    rarity: 'epic',
    points: 200,
  },
  comeback_king: {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Win after a 5+ loss streak',
    icon: '👊',
    rarity: 'rare',
    points: 75,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatPoints(points: number): string {
  if (points >= 0) return `+${points}`;
  return `${points}`;
}

export function formatRankChange(change: number): string {
  if (change > 0) return `↑${change}`;
  if (change < 0) return `↓${Math.abs(change)}`;
  return '–';
}

export function getRankBadge(rank: number): string {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 10) return '🔥🔥🔥';
  if (streak >= 5) return '🔥🔥';
  if (streak >= 3) return '🔥';
  if (streak <= -5) return '💀💀';
  if (streak <= -3) return '💀';
  return '';
}

export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((wins / total) * 100 * 10) / 10; // One decimal place
}
