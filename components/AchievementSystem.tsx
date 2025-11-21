'use client'

import { useEffect, useState } from 'react'
import { Trophy, Star, Target, Zap, Award, Crown, Gem, Shield } from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: any
  unlocked: boolean
  progress: number
  maxProgress: number
}

export function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAchievements()
  }, [])

  function loadAchievements() {
    // Define achievement system
    const defaultAchievements: Achievement[] = [
      {
        id: 'first_pick',
        name: 'First Pick',
        description: 'Make your first stock pick prediction',
        icon: Star,
        unlocked: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'market_veteran',
        name: 'Market Veteran',
        description: 'Track 100 stock picks',
        icon: Trophy,
        unlocked: false,
        progress: 0,
        maxProgress: 100
      },
      {
        id: 'bull_master',
        name: 'Bull Master',
        description: 'Achieve 10 winning predictions',
        icon: Target,
        unlocked: false,
        progress: 0,
        maxProgress: 10
      },
      {
        id: 'ai_whisperer',
        name: 'AI Whisperer',
        description: 'Compare all 5 AI models on one stock',
        icon: Zap,
        unlocked: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'high_confidence',
        name: 'High Confidence',
        description: 'Find 5 picks with 90%+ confidence',
        icon: Award,
        unlocked: false,
        progress: 0,
        maxProgress: 5
      },
      {
        id: 'diversified',
        name: 'Diversified',
        description: 'Track stocks from 5 different sectors',
        icon: Crown,
        unlocked: false,
        progress: 0,
        maxProgress: 5
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Check market predictions before 9 AM',
        icon: Gem,
        unlocked: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'market_champion',
        name: 'Market Champion',
        description: 'Achieve 75% win rate over 20 picks',
        icon: Shield,
        unlocked: false,
        progress: 0,
        maxProgress: 20
      }
    ]

    setAchievements(defaultAchievements)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
            <p className="text-gray-600 mt-1">Track your progress and unlock rewards</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </div>
            <div className="text-sm text-gray-600">Unlocked</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            const progressPercent = Math.min(100, (achievement.progress / achievement.maxProgress) * 100)
            
            return (
              <div
                key={achievement.id}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  achievement.unlocked
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-3 rounded-lg ${
                      achievement.unlocked ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {achievement.description}
                    </p>
                    
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            achievement.unlocked ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {achievement.unlocked && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                      ✓ UNLOCKED
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-sm text-gray-600">
            More achievements, leaderboards, and rewards are on the way! Keep tracking picks 
            to unlock exclusive features and insights.
          </p>
        </div>
      </div>
    </div>
  )
}
