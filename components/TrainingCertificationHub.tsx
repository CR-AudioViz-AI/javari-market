'use client'

import { useState } from 'react'
import {
  GraduationCap, Award, BookOpen, Play, CheckCircle, Lock,
  Star, Trophy, Clock, Users, Target, Zap, ChevronRight,
  Download, Share2, ExternalLink, Sparkles, Medal, Crown,
  TrendingUp, DollarSign, Gift, Percent
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  provider: 'crav' | 'affiliate'
  affiliatePartner?: string
  affiliateCommission?: number
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  duration: string
  lessons: number
  enrolled: number
  rating: number
  price: number
  originalPrice?: number
  certification: boolean
  certificationValue?: string
  progress?: number
  tags: string[]
  thumbnail: string
}

interface Certification {
  id: string
  name: string
  issuer: string
  earnedDate?: string
  expiryDate?: string
  credentialId?: string
  skills: string[]
  verified: boolean
}

const COURSES: Record<string, Course[]> = {
  'market-oracle': [
    {
      id: 'mo-1', title: 'AI-Powered Trading Fundamentals', description: 'Learn to leverage AI for smarter investment decisions',
      provider: 'crav', level: 'beginner', duration: '4 hours', lessons: 12, enrolled: 2450, rating: 4.8,
      price: 49, originalPrice: 99, certification: true, certificationValue: 'CRAV AI Trader Level 1',
      progress: 65, tags: ['AI', 'Trading', 'Stocks'], thumbnail: '📈'
    },
    {
      id: 'mo-2', title: 'Technical Analysis Masterclass', description: 'Master chart patterns, indicators, and price action',
      provider: 'affiliate', affiliatePartner: 'Investopedia Academy', affiliateCommission: 30,
      level: 'intermediate', duration: '8 hours', lessons: 24, enrolled: 15000, rating: 4.9,
      price: 199, certification: true, certificationValue: 'Certified Technical Analyst',
      tags: ['Charts', 'Indicators', 'Patterns'], thumbnail: '📊'
    },
    {
      id: 'mo-3', title: 'Cryptocurrency Trading Pro', description: 'Navigate crypto markets with confidence',
      provider: 'affiliate', affiliatePartner: 'Binance Academy', affiliateCommission: 25,
      level: 'intermediate', duration: '6 hours', lessons: 18, enrolled: 8500, rating: 4.7,
      price: 0, certification: true, certificationValue: 'Binance Certified Trader',
      tags: ['Crypto', 'DeFi', 'Blockchain'], thumbnail: '🪙'
    },
    {
      id: 'mo-4', title: 'Options Trading Strategies', description: 'Advanced options strategies for income and hedging',
      provider: 'affiliate', affiliatePartner: 'Tastytrade', affiliateCommission: 35,
      level: 'advanced', duration: '10 hours', lessons: 30, enrolled: 5200, rating: 4.8,
      price: 299, certification: true, tags: ['Options', 'Derivatives', 'Hedging'], thumbnail: '🎯'
    },
  ],
  'logo-studio': [
    {
      id: 'ls-1', title: 'Logo Design Fundamentals', description: 'Create memorable logos from scratch',
      provider: 'crav', level: 'beginner', duration: '3 hours', lessons: 10, enrolled: 1850, rating: 4.7,
      price: 29, originalPrice: 59, certification: true, certificationValue: 'CRAV Logo Designer',
      progress: 100, tags: ['Design', 'Branding', 'Logo'], thumbnail: '🎨'
    },
    {
      id: 'ls-2', title: 'Brand Identity Masterclass', description: 'Build complete brand systems',
      provider: 'affiliate', affiliatePartner: 'Skillshare', affiliateCommission: 40,
      level: 'intermediate', duration: '5 hours', lessons: 15, enrolled: 12000, rating: 4.9,
      price: 0, certification: false, tags: ['Branding', 'Identity', 'Guidelines'], thumbnail: '✨'
    },
    {
      id: 'ls-3', title: 'Adobe Illustrator for Logos', description: 'Professional vector logo creation',
      provider: 'affiliate', affiliatePartner: 'LinkedIn Learning', affiliateCommission: 25,
      level: 'intermediate', duration: '7 hours', lessons: 22, enrolled: 25000, rating: 4.8,
      price: 29.99, certification: true, certificationValue: 'LinkedIn Illustrator Certificate',
      tags: ['Illustrator', 'Vector', 'Adobe'], thumbnail: '🖌️'
    },
  ],
  'social-graphics': [
    {
      id: 'sg-1', title: 'Social Media Design Basics', description: 'Create scroll-stopping content',
      provider: 'crav', level: 'beginner', duration: '2 hours', lessons: 8, enrolled: 3200, rating: 4.6,
      price: 19, certification: true, certificationValue: 'CRAV Social Designer',
      tags: ['Social', 'Graphics', 'Content'], thumbnail: '📱'
    },
    {
      id: 'sg-2', title: 'Canva Pro Masterclass', description: 'Unlock Canva\'s full potential',
      provider: 'affiliate', affiliatePartner: 'Canva', affiliateCommission: 20,
      level: 'beginner', duration: '4 hours', lessons: 16, enrolled: 50000, rating: 4.9,
      price: 0, certification: true, certificationValue: 'Canva Certified Creator',
      tags: ['Canva', 'Templates', 'Design'], thumbnail: '🎭'
    },
    {
      id: 'sg-3', title: 'Video Content for Social', description: 'Create viral video content',
      provider: 'affiliate', affiliatePartner: 'Udemy', affiliateCommission: 15,
      level: 'intermediate', duration: '6 hours', lessons: 20, enrolled: 18000, rating: 4.7,
      price: 84.99, originalPrice: 199.99, certification: true,
      tags: ['Video', 'Reels', 'TikTok'], thumbnail: '🎬'
    },
  ],
  'invoice-generator': [
    {
      id: 'ig-1', title: 'Freelance Business Basics', description: 'Run your freelance business like a pro',
      provider: 'crav', level: 'beginner', duration: '3 hours', lessons: 12, enrolled: 1500, rating: 4.8,
      price: 39, certification: true, certificationValue: 'CRAV Business Pro',
      tags: ['Freelance', 'Business', 'Finance'], thumbnail: '💼'
    },
    {
      id: 'ig-2', title: 'QuickBooks Fundamentals', description: 'Master small business accounting',
      provider: 'affiliate', affiliatePartner: 'Intuit', affiliateCommission: 30,
      level: 'beginner', duration: '5 hours', lessons: 18, enrolled: 35000, rating: 4.8,
      price: 0, certification: true, certificationValue: 'QuickBooks Certified User',
      tags: ['Accounting', 'QuickBooks', 'Bookkeeping'], thumbnail: '📒'
    },
    {
      id: 'ig-3', title: 'Tax Planning for Freelancers', description: 'Maximize deductions, minimize taxes',
      provider: 'affiliate', affiliatePartner: 'TurboTax', affiliateCommission: 25,
      level: 'intermediate', duration: '4 hours', lessons: 14, enrolled: 8500, rating: 4.7,
      price: 49, certification: false, tags: ['Taxes', 'Deductions', 'Planning'], thumbnail: '📋'
    },
  ],
}

const USER_CERTIFICATIONS: Certification[] = [
  { id: 'c1', name: 'CRAV AI Trader Level 1', issuer: 'CR AudioViz AI', earnedDate: '2024-12-15', credentialId: 'CRAV-2024-12345', skills: ['AI Trading', 'Market Analysis'], verified: true },
  { id: 'c2', name: 'CRAV Logo Designer', issuer: 'CR AudioViz AI', earnedDate: '2024-11-20', credentialId: 'CRAV-2024-11234', skills: ['Logo Design', 'Branding'], verified: true },
]

interface TrainingCertificationHubProps {
  appContext: 'market-oracle' | 'logo-studio' | 'social-graphics' | 'invoice-generator'
}

export default function TrainingCertificationHub({ appContext }: TrainingCertificationHubProps) {
  const [activeTab, setActiveTab] = useState<'courses' | 'certifications' | 'progress'>('courses')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')

  const courses = COURSES[appContext] || []
  const filteredCourses = courses.filter(c => selectedLevel === 'all' || c.level === selectedLevel)

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/20 text-green-400'
      case 'intermediate': return 'bg-blue-500/20 text-blue-400'
      case 'advanced': return 'bg-purple-500/20 text-purple-400'
      case 'expert': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Training & Certification Hub</h1>
            <p className="text-violet-200">Level up your skills and earn recognized credentials</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-violet-200 text-sm">Courses Available</p>
            <p className="text-2xl font-bold text-white">{courses.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-violet-200 text-sm">Your Certifications</p>
            <p className="text-2xl font-bold text-white">{USER_CERTIFICATIONS.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-violet-200 text-sm">In Progress</p>
            <p className="text-2xl font-bold text-white">{courses.filter(c => c.progress && c.progress < 100).length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-violet-200 text-sm">Affiliate Earnings</p>
            <p className="text-2xl font-bold text-white">$1,250</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'courses', label: 'Courses', icon: BookOpen },
          { id: 'certifications', label: 'My Certifications', icon: Award },
          { id: 'progress', label: 'Learning Path', icon: Target },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg ${
              activeTab === tab.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            {['all', 'beginner', 'intermediate', 'advanced'].map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                  selectedLevel === level ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden hover:border-violet-500/50 transition-all">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-2xl">
                        {course.thumbnail}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{course.title}</h3>
                          {course.provider === 'affiliate' && (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> Partner
                            </span>
                          )}
                        </div>
                        {course.affiliatePartner && (
                          <p className="text-xs text-gray-500">by {course.affiliatePartner}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded capitalize ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                  </div>

                  <p className="text-sm text-gray-400 mb-3">{course.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessons} lessons</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrolled.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{course.rating}</span>
                  </div>

                  {course.certification && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-violet-500/10 rounded-lg">
                      <Award className="w-4 h-4 text-violet-400" />
                      <span className="text-sm text-violet-300">{course.certificationValue || 'Certificate Included'}</span>
                    </div>
                  )}

                  {course.progress !== undefined && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-violet-400">{course.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${course.progress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      {course.price === 0 ? (
                        <span className="text-green-400 font-bold">FREE</span>
                      ) : (
                        <>
                          <span className="text-xl font-bold">${course.price}</span>
                          {course.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">${course.originalPrice}</span>
                          )}
                        </>
                      )}
                      {course.affiliateCommission && (
                        <span className="text-xs text-amber-400">({course.affiliateCommission}% commission)</span>
                      )}
                    </div>
                    <button className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      course.progress !== undefined
                        ? 'bg-violet-600 hover:bg-violet-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}>
                      {course.progress !== undefined ? (course.progress === 100 ? 'Review' : 'Continue') : 'Enroll'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          {USER_CERTIFICATIONS.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {USER_CERTIFICATIONS.map(cert => (
                <div key={cert.id} className="bg-gradient-to-br from-violet-900/50 to-purple-900/50 rounded-xl border border-violet-500/30 p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{cert.name}</h3>
                        <p className="text-sm text-gray-400">Issued by {cert.issuer}</p>
                      </div>
                    </div>
                    {cert.verified && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Credential ID</span>
                      <span className="font-mono text-xs">{cert.credentialId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Earned</span>
                      <span>{cert.earnedDate}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cert.skills.map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-gray-800 text-xs rounded">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No certifications yet</h3>
              <p className="text-gray-400 mb-4">Complete courses to earn your first certification</p>
              <button onClick={() => setActiveTab('courses')} className="px-6 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg">
                Browse Courses
              </button>
            </div>
          )}
        </div>
      )}

      {/* Learning Path Tab */}
      {activeTab === 'progress' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="font-semibold mb-6">Your Learning Journey</h3>
          <div className="space-y-4">
            {courses.map((course, index) => (
              <div key={course.id} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  course.progress === 100 ? 'bg-green-500' : course.progress ? 'bg-violet-500' : 'bg-gray-700'
                }`}>
                  {course.progress === 100 ? <CheckCircle className="w-5 h-5 text-white" /> : 
                   course.progress ? <Play className="w-5 h-5 text-white" /> : 
                   <Lock className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{course.title}</p>
                  <p className="text-sm text-gray-400">{course.duration} • {course.lessons} lessons</p>
                </div>
                {course.progress !== undefined && (
                  <span className={`text-sm ${course.progress === 100 ? 'text-green-400' : 'text-violet-400'}`}>
                    {course.progress}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
