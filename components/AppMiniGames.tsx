'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Gamepad2, Play, Pause, RefreshCw, Trophy, Star, Zap,
  Clock, Target, TrendingUp, TrendingDown, DollarSign,
  Palette, Image, FileText, Brain, Sparkles, Crown, X
} from 'lucide-react'

// ============ MARKET ORACLE GAMES ============

interface StockPrice {
  symbol: string
  price: number
  direction: 'up' | 'down'
}

function PredictionGame() {
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [currentStock, setCurrentStock] = useState<StockPrice>({ symbol: 'AAPL', price: 193.50, direction: 'up' })
  const [prediction, setPrediction] = useState<'up' | 'down' | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(5)
  const [gameActive, setGameActive] = useState(false)
  const [highScore, setHighScore] = useState(0)

  const stocks = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'BTC']

  const startRound = () => {
    const symbol = stocks[Math.floor(Math.random() * stocks.length)]
    const basePrice = Math.random() * 500 + 50
    setCurrentStock({ symbol, price: parseFloat(basePrice.toFixed(2)), direction: Math.random() > 0.5 ? 'up' : 'down' })
    setPrediction(null)
    setResult(null)
    setTimeLeft(5)
    setGameActive(true)
  }

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && gameActive) {
      revealResult()
    }
  }, [timeLeft, gameActive])

  const makePrediction = (dir: 'up' | 'down') => {
    if (!gameActive || prediction) return
    setPrediction(dir)
    setTimeout(revealResult, 1000)
  }

  const revealResult = () => {
    setGameActive(false)
    const actualDirection = currentStock.direction
    const isCorrect = prediction === actualDirection

    if (isCorrect) {
      setResult('correct')
      const points = timeLeft * 10 + 50
      setScore(s => s + points)
      setStreak(s => s + 1)
    } else {
      setResult('wrong')
      setStreak(0)
    }

    setTimeout(startRound, 2000)
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h3 className="font-bold text-lg">Price Predictor</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-yellow-400">🏆 {score}</span>
          <span className="text-orange-400">🔥 {streak}</span>
        </div>
      </div>

      <div className="text-center py-8">
        <p className="text-4xl font-mono font-bold mb-2">{currentStock.symbol}</p>
        <p className="text-2xl text-gray-300 mb-4">${currentStock.price.toFixed(2)}</p>
        
        {result && (
          <div className={`mb-4 p-3 rounded-lg ${result === 'correct' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {result === 'correct' ? '✅ Correct!' : '❌ Wrong!'} It went {currentStock.direction}!
          </div>
        )}

        <p className="text-gray-400 mb-6">Will the next price be higher or lower?</p>

        {gameActive && (
          <div className="mb-6">
            <div className="text-2xl font-bold text-cyan-400">{timeLeft}s</div>
            <div className="w-full h-2 bg-gray-700 rounded-full mt-2">
              <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${(timeLeft / 5) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => makePrediction('up')}
            disabled={!gameActive || prediction !== null}
            className={`flex-1 max-w-32 py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${
              prediction === 'up' ? 'bg-green-600' : 'bg-green-500/20 hover:bg-green-500/40'
            } ${(!gameActive || prediction) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <TrendingUp className="w-5 h-5" /> UP
          </button>
          <button
            onClick={() => makePrediction('down')}
            disabled={!gameActive || prediction !== null}
            className={`flex-1 max-w-32 py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${
              prediction === 'down' ? 'bg-red-600' : 'bg-red-500/20 hover:bg-red-500/40'
            } ${(!gameActive || prediction) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <TrendingDown className="w-5 h-5" /> DOWN
          </button>
        </div>
      </div>

      {!gameActive && !result && (
        <button onClick={startRound} className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 rounded-xl font-bold">
          <Play className="w-5 h-5 inline mr-2" /> Start Game
        </button>
      )}
    </div>
  )
}

// ============ LOGO STUDIO GAMES ============

function ColorMatchGame() {
  const [score, setScore] = useState(0)
  const [targetColor, setTargetColor] = useState('#FF5733')
  const [userColor, setUserColor] = useState({ r: 128, g: 128, b: 128 })
  const [accuracy, setAccuracy] = useState(0)
  const [round, setRound] = useState(1)
  const [showResult, setShowResult] = useState(false)

  const generateNewTarget = () => {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    setTargetColor(`rgb(${r},${g},${b})`)
    setUserColor({ r: 128, g: 128, b: 128 })
    setShowResult(false)
  }

  useEffect(() => { generateNewTarget() }, [])

  const checkAccuracy = () => {
    const target = targetColor.match(/\d+/g)?.map(Number) || [0, 0, 0]
    const diff = Math.abs(target[0] - userColor.r) + Math.abs(target[1] - userColor.g) + Math.abs(target[2] - userColor.b)
    const acc = Math.max(0, 100 - Math.floor(diff / 7.65))
    setAccuracy(acc)
    setScore(s => s + acc)
    setShowResult(true)
    setTimeout(() => {
      setRound(r => r + 1)
      generateNewTarget()
    }, 2000)
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Palette className="w-6 h-6 text-pink-400" />
          <h3 className="font-bold text-lg">Color Match</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-yellow-400">🏆 {score}</span>
          <span className="text-gray-400">Round {round}/10</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-400 mb-2 text-center">Target</p>
          <div className="h-24 rounded-xl" style={{ backgroundColor: targetColor }} />
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-2 text-center">Your Mix</p>
          <div className="h-24 rounded-xl" style={{ backgroundColor: `rgb(${userColor.r},${userColor.g},${userColor.b})` }} />
        </div>
      </div>

      {showResult && (
        <div className={`mb-4 p-3 rounded-lg text-center ${accuracy >= 80 ? 'bg-green-500/20 text-green-400' : accuracy >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
          {accuracy}% Match! {accuracy >= 90 ? '🎨 Perfect!' : accuracy >= 70 ? '👍 Good!' : '🎯 Keep practicing!'}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {['r', 'g', 'b'].map(channel => (
          <div key={channel}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm uppercase" style={{ color: channel === 'r' ? '#f87171' : channel === 'g' ? '#4ade80' : '#60a5fa' }}>
                {channel === 'r' ? 'Red' : channel === 'g' ? 'Green' : 'Blue'}
              </span>
              <span className="text-sm">{userColor[channel as keyof typeof userColor]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="255"
              value={userColor[channel as keyof typeof userColor]}
              onChange={(e) => setUserColor({ ...userColor, [channel]: parseInt(e.target.value) })}
              className="w-full"
              disabled={showResult}
            />
          </div>
        ))}
      </div>

      <button onClick={checkAccuracy} disabled={showResult} className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 rounded-xl font-bold">
        Check Match
      </button>
    </div>
  )
}

// ============ SOCIAL GRAPHICS GAMES ============

function HashtagGame() {
  const [score, setScore] = useState(0)
  const [currentTopic, setCurrentTopic] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([])
  const [correctHashtags, setCorrectHashtags] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [round, setRound] = useState(1)

  const topics = [
    { topic: 'Fitness Post', correct: ['fitness', 'workout', 'gym', 'health'], wrong: ['food', 'travel', 'art', 'tech'] },
    { topic: 'Travel Photo', correct: ['travel', 'wanderlust', 'vacation', 'explore'], wrong: ['fitness', 'food', 'work', 'study'] },
    { topic: 'Food Content', correct: ['foodie', 'delicious', 'recipe', 'cooking'], wrong: ['travel', 'fitness', 'tech', 'art'] },
    { topic: 'Tech News', correct: ['tech', 'innovation', 'AI', 'startup'], wrong: ['food', 'travel', 'fitness', 'art'] },
  ]

  const startRound = useCallback(() => {
    const topicData = topics[Math.floor(Math.random() * topics.length)]
    setCurrentTopic(topicData.topic)
    setCorrectHashtags(topicData.correct)
    const allTags = [...topicData.correct, ...topicData.wrong].sort(() => Math.random() - 0.5)
    setHashtags(allTags)
    setSelectedHashtags([])
    setShowResult(false)
  }, [])

  useEffect(() => { startRound() }, [])

  const toggleHashtag = (tag: string) => {
    if (showResult) return
    setSelectedHashtags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const checkAnswer = () => {
    setShowResult(true)
    const correct = selectedHashtags.filter(t => correctHashtags.includes(t)).length
    const wrong = selectedHashtags.filter(t => !correctHashtags.includes(t)).length
    const points = (correct * 25) - (wrong * 10)
    setScore(s => s + Math.max(0, points))
    setTimeout(() => {
      setRound(r => r + 1)
      startRound()
    }, 2000)
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">#️⃣</span>
          <h3 className="font-bold text-lg">Hashtag Master</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-yellow-400">🏆 {score}</span>
          <span className="text-gray-400">Round {round}/10</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-gray-400 mb-2">Select the best hashtags for:</p>
        <p className="text-2xl font-bold text-pink-400">{currentTopic}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {hashtags.map(tag => (
          <button
            key={tag}
            onClick={() => toggleHashtag(tag)}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              selectedHashtags.includes(tag)
                ? showResult
                  ? correctHashtags.includes(tag)
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                  : 'bg-pink-500 text-white'
                : showResult && correctHashtags.includes(tag)
                  ? 'bg-green-500/30 text-green-400 border border-green-500'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      <button onClick={checkAnswer} disabled={showResult || selectedHashtags.length === 0} className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 rounded-xl font-bold">
        Submit ({selectedHashtags.length} selected)
      </button>
    </div>
  )
}

// ============ INVOICE GENERATOR GAMES ============

function InvoiceMathGame() {
  const [score, setScore] = useState(0)
  const [problem, setProblem] = useState({ items: 0, rate: 0, tax: 0, answer: 0 })
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [round, setRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(15)

  const generateProblem = () => {
    const items = Math.floor(Math.random() * 5) + 1
    const rate = Math.floor(Math.random() * 200) + 50
    const tax = [0, 5, 7.5, 8.25, 10][Math.floor(Math.random() * 5)]
    const subtotal = items * rate
    const taxAmount = subtotal * (tax / 100)
    const answer = parseFloat((subtotal + taxAmount).toFixed(2))
    setProblem({ items, rate, tax, answer })
    setUserAnswer('')
    setShowResult(false)
    setTimeLeft(15)
  }

  useEffect(() => { generateProblem() }, [])

  useEffect(() => {
    if (!showResult && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      checkAnswer()
    }
  }, [timeLeft, showResult])

  const checkAnswer = () => {
    const userNum = parseFloat(userAnswer)
    const correct = Math.abs(userNum - problem.answer) < 0.01
    setIsCorrect(correct)
    setShowResult(true)
    if (correct) {
      setScore(s => s + (timeLeft * 5) + 50)
    }
    setTimeout(() => {
      setRound(r => r + 1)
      generateProblem()
    }, 2000)
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-green-400" />
          <h3 className="font-bold text-lg">Invoice Math</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-yellow-400">🏆 {score}</span>
          <span className="text-cyan-400">⏱️ {timeLeft}s</span>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 mb-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Items:</span>
            <span>{problem.items}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Rate per item:</span>
            <span>${problem.rate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal:</span>
            <span>${problem.items * problem.rate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tax rate:</span>
            <span>{problem.tax}%</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-700 font-bold">
            <span>Total:</span>
            <span>$???</span>
          </div>
        </div>
      </div>

      {showResult && (
        <div className={`mb-4 p-3 rounded-lg text-center ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isCorrect ? '✅ Correct!' : `❌ Wrong! Answer: $${problem.answer}`}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Enter total..."
          className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl"
          disabled={showResult}
        />
        <button onClick={checkAnswer} disabled={showResult || !userAnswer} className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl font-bold">
          Submit
        </button>
      </div>
    </div>
  )
}

// ============ MAIN COMPONENT ============

interface AppMiniGamesProps {
  appContext: 'market-oracle' | 'logo-studio' | 'social-graphics' | 'invoice-generator'
}

export default function AppMiniGames({ appContext }: AppMiniGamesProps) {
  const [showGame, setShowGame] = useState(false)

  const games = {
    'market-oracle': { name: 'Price Predictor', component: <PredictionGame />, icon: <TrendingUp className="w-5 h-5" /> },
    'logo-studio': { name: 'Color Match', component: <ColorMatchGame />, icon: <Palette className="w-5 h-5" /> },
    'social-graphics': { name: 'Hashtag Master', component: <HashtagGame />, icon: <span>#️⃣</span> },
    'invoice-generator': { name: 'Invoice Math', component: <InvoiceMathGame />, icon: <DollarSign className="w-5 h-5" /> },
  }

  const game = games[appContext]

  if (!showGame) {
    return (
      <button
        onClick={() => setShowGame(true)}
        className="fixed bottom-24 right-4 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 rounded-xl shadow-lg z-40"
      >
        <Gamepad2 className="w-5 h-5" />
        <span className="font-medium">Play {game.name}</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white">
            <Gamepad2 className="w-6 h-6" />
            <span className="font-bold">{game.name}</span>
          </div>
          <button onClick={() => setShowGame(false)} className="p-2 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        {game.component}
      </div>
    </div>
  )
}
