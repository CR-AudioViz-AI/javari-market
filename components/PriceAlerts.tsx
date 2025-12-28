'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, Plus, Trash2, Edit2, Save, X,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Mail, CheckCircle, AlertCircle, Loader2, Volume2
} from 'lucide-react'

interface PriceAlert {
  id: string
  symbol: string
  companyName: string
  targetPrice: number
  currentPrice: number
  condition: 'above' | 'below'
  notifyEmail: boolean
  notifyPush: boolean
  notifySound: boolean
  triggered: boolean
  triggeredAt?: string
  createdAt: string
}

interface PriceAlertsProps {
  userEmail: string
  onAlertTriggered?: (alert: PriceAlert) => void
}

export default function PriceAlerts({ userEmail, onAlertTriggered }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // New alert form
  const [newSymbol, setNewSymbol] = useState('')
  const [newTargetPrice, setNewTargetPrice] = useState('')
  const [newCondition, setNewCondition] = useState<'above' | 'below'>('above')
  const [newNotifyEmail, setNewNotifyEmail] = useState(true)
  const [newNotifyPush, setNewNotifyPush] = useState(true)
  const [newNotifySound, setNewNotifySound] = useState(false)
  
  // Symbol search
  const [symbolSearch, setSymbolSearch] = useState('')
  const [symbolResults, setSymbolResults] = useState<Array<{ symbol: string; name: string; price: number }>>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Load alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('priceAlerts')
    if (saved) {
      setAlerts(JSON.parse(saved))
    }
  }, [])

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('priceAlerts', JSON.stringify(alerts))
  }, [alerts])

  // Check alerts periodically
  useEffect(() => {
    const checkAlerts = async () => {
      const activeAlerts = alerts.filter(a => !a.triggered)
      if (activeAlerts.length === 0) return

      try {
        // Get current prices for all symbols
        const symbols = [...new Set(activeAlerts.map(a => a.symbol))]
        const response = await fetch(`/api/stock-data?symbols=${symbols.join(',')}`)
        
        if (response.ok) {
          const data = await response.json()
          const prices: Record<string, number> = {}
          data.quotes?.forEach((q: any) => {
            prices[q.symbol] = q.price
          })

          // Update alerts with current prices and check triggers
          setAlerts(prev => prev.map(alert => {
            const currentPrice = prices[alert.symbol]
            if (!currentPrice) return alert

            const isTriggered = alert.condition === 'above' 
              ? currentPrice >= alert.targetPrice
              : currentPrice <= alert.targetPrice

            if (isTriggered && !alert.triggered) {
              // Alert triggered!
              if (alert.notifySound) {
                playAlertSound()
              }
              onAlertTriggered?.(alert)
              
              return {
                ...alert,
                currentPrice,
                triggered: true,
                triggeredAt: new Date().toISOString()
              }
            }

            return { ...alert, currentPrice }
          }))
        }
      } catch (error) {
        console.error('Error checking alerts:', error)
      }
    }

    // Check immediately and then every 30 seconds
    checkAlerts()
    const interval = setInterval(checkAlerts, 30000)
    return () => clearInterval(interval)
  }, [alerts, onAlertTriggered])

  const playAlertSound = () => {
    const audio = new Audio('/sounds/alert.mp3')
    audio.play().catch(() => {}) // Ignore errors if audio can't play
  }

  const searchSymbol = async (query: string) => {
    if (query.length < 1) {
      setSymbolResults([])
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch(`/api/stock-data?search=${query}`)
      if (response.ok) {
        const data = await response.json()
        setSymbolResults(data.results || [])
      }
    } catch (error) {
      console.error('Symbol search error:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const createAlert = () => {
    if (!newSymbol || !newTargetPrice) return

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      symbol: newSymbol.toUpperCase(),
      companyName: symbolResults.find(s => s.symbol === newSymbol.toUpperCase())?.name || newSymbol,
      targetPrice: parseFloat(newTargetPrice),
      currentPrice: symbolResults.find(s => s.symbol === newSymbol.toUpperCase())?.price || 0,
      condition: newCondition,
      notifyEmail: newNotifyEmail,
      notifyPush: newNotifyPush,
      notifySound: newNotifySound,
      triggered: false,
      createdAt: new Date().toISOString()
    }

    setAlerts(prev => [newAlert, ...prev])
    resetForm()
  }

  const resetForm = () => {
    setIsCreating(false)
    setNewSymbol('')
    setNewTargetPrice('')
    setNewCondition('above')
    setSymbolSearch('')
    setSymbolResults([])
  }

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const clearTriggered = () => {
    setAlerts(prev => prev.filter(a => !a.triggered))
  }

  const activeAlerts = alerts.filter(a => !a.triggered)
  const triggeredAlerts = alerts.filter(a => a.triggered)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6" />
            <div>
              <h2 className="font-semibold text-lg">Price Alerts</h2>
              <p className="text-white/80 text-sm">{activeAlerts.length} active alerts</p>
            </div>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Alert
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Create Alert Form */}
        {isCreating && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">Create Price Alert</h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Symbol Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Symbol
              </label>
              <input
                type="text"
                value={symbolSearch}
                onChange={(e) => {
                  setSymbolSearch(e.target.value)
                  searchSymbol(e.target.value)
                }}
                placeholder="Search AAPL, TSLA, GOOGL..."
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2"
              />
              
              {/* Search Results Dropdown */}
              {symbolResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {symbolResults.map(result => (
                    <button
                      key={result.symbol}
                      onClick={() => {
                        setNewSymbol(result.symbol)
                        setSymbolSearch(result.symbol)
                        setSymbolResults([])
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{result.symbol}</span>
                        <span className="text-gray-500 text-sm ml-2">{result.name}</span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">${result.price?.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Condition & Target Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Condition
                </label>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value as 'above' | 'below')}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2"
                >
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={newTargetPrice}
                    onChange={(e) => setNewTargetPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-8 pr-4 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Notification Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notify me via:
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newNotifyEmail}
                    onChange={(e) => setNewNotifyEmail(e.target.checked)}
                    className="rounded"
                  />
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newNotifyPush}
                    onChange={(e) => setNewNotifyPush(e.target.checked)}
                    className="rounded"
                  />
                  <Bell className="w-4 h-4 text-gray-500" />
                  Push
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newNotifySound}
                    onChange={(e) => setNewNotifySound(e.target.checked)}
                    className="rounded"
                  />
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  Sound
                </label>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={createAlert}
              disabled={!newSymbol || !newTargetPrice}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Create Alert
            </button>
          </div>
        )}

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Active Alerts</h3>
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    alert.condition === 'above' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                  }`}>
                    {alert.condition === 'above' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white">{alert.symbol}</span>
                      <span className="text-sm text-gray-500">{alert.condition} ${alert.targetPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Current: ${alert.currentPrice?.toFixed(2) || '—'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Triggered Alerts */}
        {triggeredAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">Triggered</h3>
              <button onClick={clearTriggered} className="text-sm text-gray-500 hover:text-gray-700">
                Clear all
              </button>
            </div>
            {triggeredAlerts.map(alert => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">{alert.symbol}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      hit ${alert.targetPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button onClick={() => deleteAlert(alert.id)} className="p-2 text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {alerts.length === 0 && !isCreating && (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No price alerts yet</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Create your first alert
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
