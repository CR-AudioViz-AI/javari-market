'use client'

import { useState, useEffect } from 'react'
import {
  Trophy, Star, Zap, Target, Crown, Medal, Gift, Flame,
  TrendingUp, Award, Users, Calendar, Coins, Gem, Lock,
  ChevronRight, Play, CheckCircle, Sparkles, Timer, Heart
} from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'skill' | 'engagement' | 'social' | 'milestone'
  xpReward: number
  unlocked: boolean
  progress?: number
  maxProgress?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Challenge {
  id: string
  name: string
  description: string
  type: 'daily' | 'weekly' | 'special'
  xpReward: number
  coinReward: number
  progress: number
  maxProgress: number
  expiresIn: string
  completed: boolean
}

interface LeaderboardEntry {
  rank: number
  username: string
  avatar: string
  xp: number
  level: number
  badge: string
}

interface UserStats {
  level: number
  xp: number
  xpToNext: number
  coins: number
  streak: number
  totalAchievements: number
  rank: number
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', name: 'First Steps', description: 'Complete your first project', icon: '👶', category: 'milestone', xpReward: 100, unlocked: true, rarity: 'common' },
  { id: 'a2', name: 'Speed Demon', description: 'Complete 5 projects in one day', icon: '⚡', category: 'skill', xpReward: 250, unlocked: true, rarity: 'rare' },
  { id: 'a3', name: 'Perfectionist', description: 'Get 5-star rating on 10 projects', icon: '✨', category: 'skill', xpReward: 500, unlocked: false, progress: 7, maxProgress: 10, rarity: 'epic' },
  { id: 'a4', name: 'Social Butterfly', description: 'Share 25 creations on social media', icon: '🦋', category: 'social', xpReward: 300, unlocked: false, progress: 12, maxProgress: 25, rarity: 'rare' },
  { id: 'a5', name: 'Streak Master', description: 'Maintain a 30-day streak', icon: '🔥', category: 'engagement', xpReward: 1000, unlocked: false, progress: 15, maxProgress: 30, rarity: 'legendary' },
  { id: 'a6', name: 'AI Whisperer', description: 'Use AI features 100 times', icon: '🤖', category: 'skill', xpReward: 400, unlocked: false, progress: 65, maxProgress: 100, rarity: 'epic' },
  { id: 'a7', name: 'Team Player', description: 'Collaborate on 5 team projects', icon: '🤝', category: 'social', xpReward: 350, unlocked: false, progress: 2, maxProgress: 5, rarity: 'rare' },
  { id: 'a8', name: 'Legend', description: 'Reach level 50', icon: '👑', category: 'milestone', xpReward: 5000, unlocked: false, rarity: 'legendary' },
]

const DAILY_CHALLENGES: Challenge[] = [
  { id: 'd1', name: 'Early Bird', description: 'Create a project before 9 AM', type: 'daily', xpReward: 50, coinReward: 10, progress: 1, maxProgress: 1, expiresIn: '6h', completed: true },
  { id: 'd2', name: 'Triple Threat', description: 'Complete 3 projects today', type: 'daily', xpReward: 100, coinReward: 25, progress: 2, maxProgress: 3, expiresIn: '6h', completed: false },
  { id: 'd3', name: 'Explorer', description: 'Try a new feature or tool', type: 'daily', xpReward: 75, coinReward: 15, progress: 0, maxProgress: 1, expiresIn: '6h', completed: false },
]

const WEEKLY_CHALLENGES: Challenge[] = [
  { id: 'w1', name: 'Marathon Runner', description: 'Complete 20 projects this week', type: 'weekly', xpReward: 500, coinReward: 100, progress: 12, maxProgress: 20, expiresIn: '3d', completed: false },
  { id: 'w2', name: 'Social Star', description: 'Get 50 likes on your shared work', type: 'weekly', xpReward: 300, coinReward: 75, progress: 34, maxProgress: 50, expiresIn: '3d', completed: false },
]

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'DesignMaster', avatar: '👨‍🎨', xp: 125000, level: 48, badge: '👑' },
  { rank: 2, username: 'CreativeQueen', avatar: '👩‍💻', xp: 118500, level: 46, badge: '🥈' },
  { rank: 3, username: 'PixelPro', avatar: '🎮', xp: 112000, level: 44, badge: '🥉' },
  { rank: 4, username: 'ArtWizard', avatar: '🧙‍♂️', xp: 98500, level: 41, badge: '⭐' },
  { rank: 5, username: 'You', avatar: '🚀', xp: 45200, level: 23, badge: '🔥' },
]

interface GamificationSystemProps {
  appContext: string
}

export default function GamificationSystem({ appContext }: GamificationSystemProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'challenges' | 'leaderboard' | 'rewards'>('overview')

  const userStats: UserStats = {
    level: 23,
    xp: 45200,
    xpToNext: 50000,
    coins: 1250,
    streak: 15,
    totalAchievements: 12,
    rank: 5
  }

  const xpProgress = (userStats.xp / userStats.xpToNext) * 100

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600'
      case 'rare': return 'from-blue-500 to-cyan-500'
      case 'epic': return 'from-purple-500 to-pink-500'
      case 'legendary': return 'from-yellow-500 to-orange-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* XP Bar Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">Level {userStats.level}</span>
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs text-white">Top 5%</span>
              </div>
              <p className="text-violet-200 text-sm">{userStats.xp.toLocaleString()} / {userStats.xpToNext.toLocaleString()} XP</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-yellow-300">
                <Coins className="w-5 h-5" />
                <span className="font-bold">{userStats.coins.toLocaleString()}</span>
              </div>
              <p className="text-xs text-violet-200">Coins</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-orange-300">
                <Flame className="w-5 h-5" />
                <span className="font-bold">{userStats.streak}</span>
              </div>
              <p className="text-xs text-violet-200">Day Streak</p>
            </div>
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all" style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 p-1 rounded-lg overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Star },
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'challenges', label: 'Challenges', icon: Target },
          { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
          { id: 'rewards', label: 'Rewards', icon: Gift },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
              activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Challenges Preview */}
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-400" /> Daily Challenges
              </h3>
              <button onClick={() => setActiveTab('challenges')} className="text-sm text-violet-400">View All</button>
            </div>
            <div className="space-y-3">
              {DAILY_CHALLENGES.map(challenge => (
                <div key={challenge.id} className={`p-3 rounded-lg ${challenge.completed ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{challenge.name}</span>
                    {challenge.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <span className="text-xs text-gray-400">{challenge.expiresIn} left</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${challenge.completed ? 'bg-green-500' : 'bg-violet-500'}`} style={{ width: `${(challenge.progress / challenge.maxProgress) * 100}%` }} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>+{challenge.xpReward} XP</span>
                    <span>+{challenge.coinReward} Coins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" /> Recent Achievements
              </h3>
              <button onClick={() => setActiveTab('achievements')} className="text-sm text-violet-400">View All</button>
            </div>
            <div className="space-y-3">
              {ACHIEVEMENTS.filter(a => a.unlocked).slice(0, 3).map(achievement => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center text-2xl`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                  </div>
                  <span className="text-sm text-yellow-400">+{achievement.xpReward} XP</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 text-center">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{userStats.totalAchievements}</p>
              <p className="text-sm text-gray-400">Achievements</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 text-center">
              <Medal className="w-8 h-8 text-violet-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">#{userStats.rank}</p>
              <p className="text-sm text-gray-400">Global Rank</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 text-center">
              <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{userStats.streak}</p>
              <p className="text-sm text-gray-400">Day Streak</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 text-center">
              <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">47</p>
              <p className="text-sm text-gray-400">Projects</p>
            </div>
          </div>
        </div>
      )}

      {/* Achievements */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map(achievement => (
            <div key={achievement.id} className={`bg-gray-900 rounded-xl border p-4 ${achievement.unlocked ? 'border-violet-500/50' : 'border-gray-700 opacity-75'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                  achievement.unlocked ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)}` : 'bg-gray-800'
                }`}>
                  {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{achievement.name}</h4>
                    <span className={`px-1.5 py-0.5 text-xs rounded capitalize bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}>
                      {achievement.rarity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
                  {achievement.progress !== undefined && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(achievement.progress / (achievement.maxProgress || 1)) * 100}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{achievement.progress} / {achievement.maxProgress}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-sm text-yellow-400">+{achievement.xpReward} XP</span>
                {achievement.unlocked && <CheckCircle className="w-5 h-5 text-green-400" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold">Global Leaderboard</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {LEADERBOARD.map(entry => (
              <div key={entry.rank} className={`p-4 flex items-center gap-4 ${entry.username === 'You' ? 'bg-violet-500/10' : ''}`}>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  entry.rank === 1 ? 'bg-yellow-500' : entry.rank === 2 ? 'bg-gray-400' : entry.rank === 3 ? 'bg-orange-600' : 'bg-gray-700'
                } text-white font-bold`}>
                  {entry.rank}
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-xl">
                  {entry.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.username}</span>
                    <span>{entry.badge}</span>
                  </div>
                  <p className="text-sm text-gray-400">Level {entry.level}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-violet-400">{entry.xp.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Shop */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Premium Template Pack', cost: 500, icon: '📦', type: 'coins' },
            { name: 'Custom Avatar Frame', cost: 250, icon: '🖼️', type: 'coins' },
            { name: '2x XP Boost (24h)', cost: 100, icon: '⚡', type: 'coins' },
            { name: 'Exclusive Badge', cost: 1000, icon: '🏆', type: 'coins' },
            { name: 'Pro Feature Trial', cost: 750, icon: '💎', type: 'coins' },
            { name: 'Community Highlight', cost: 2000, icon: '⭐', type: 'coins' },
          ].map((reward, i) => (
            <div key={i} className="bg-gray-900 rounded-xl border border-gray-700 p-4">
              <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                {reward.icon}
              </div>
              <h4 className="font-medium text-center mb-2">{reward.name}</h4>
              <button className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                userStats.coins >= reward.cost ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-700 cursor-not-allowed'
              }`}>
                <Coins className="w-4 h-4" />
                {reward.cost}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
