'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Bell, BellRing, Plus, X, TrendingUp, TrendingDown, 
  RefreshCw, Check, AlertTriangle, Search, Target,
  ArrowUpRight, ArrowDownRight, HelpCircle, Zap, Volume2
} from 'lucide-react';
import { getPicks, type StockPick } from '@/lib/supabase';
import { JavariHelpButton } from '@/components/JavariWidget';

// Local storage key
const ALERTS_STORAGE_KEY = 'market-oracle-alerts';

// Alert types
const ALERT_TYPES = [
  { id: 'price_above', label: 'Price Above', icon: ArrowUpRight, color: 'emerald' },
  { id: 'price_below', label: 'Price Below', icon: ArrowDownRight, color: 'red' },
  { id: 'target_reached', label: 'Target Reached', icon: Target, color: 'cyan' },
  { id: 'gain_percent', label: 'Gain %', icon: TrendingUp, color: 'green' },
  { id: 'loss_percent', label: 'Loss %', icon: TrendingDown, color: 'red' },
  { id: 'new_pick', label: 'New AI Pick', icon: Zap, color: 'yellow' },
];

interface Alert {
  id: string;
  pickId?: string;
  ticker: string;
  type: string;
  value: number;
  active: boolean;
  triggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

// Get alerts from localStorage
function getStoredAlerts(): Alert[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save alerts to localStorage
function saveAlerts(alerts: Alert[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

// Alert Card
function AlertCard({ 
  alert, 
  pick,
  onToggle, 
  onRemove,
  onDismiss
}: { 
  alert: Alert;
  pick?: StockPick;
  onToggle: () => void;
  onRemove: () => void;
  onDismiss: () => void;
}) {
  const alertType = ALERT_TYPES.find(t => t.id === alert.type);
  const Icon = alertType?.icon || Bell;
  
  const priceChange = pick?.price_change_percent || 0;
  const isUp = priceChange >= 0;
  const hasCurrentPrice = pick?.current_price !== null;

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      alert.triggered 
        ? 'bg-yellow-900/20 border-yellow-600/50 animate-pulse' 
        : alert.active 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-gray-900/30 border-gray-800 opacity-60'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            alert.triggered 
              ? 'bg-yellow-500/20 text-yellow-400' 
              : `bg-${alertType?.color || 'gray'}-900/30 text-${alertType?.color || 'gray'}-400`
          }`}>
            {alert.triggered ? <BellRing className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              {alert.ticker}
              {alert.triggered && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                  TRIGGERED
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">{alertType?.label}: ${alert.value}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alert.triggered ? (
            <button
              onClick={onDismiss}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              Dismiss
            </button>
          ) : (
            <button
              onClick={onToggle}
              className={`w-10 h-5 rounded-full transition-colors ${
                alert.active ? 'bg-emerald-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${
                alert.active ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Price Display (if pick exists) */}
      {pick && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-900/50 rounded-lg py-1.5 px-1">
            <div className="text-[9px] text-gray-500 uppercase">Entry</div>
            <div className="text-xs font-semibold text-gray-300">
              ${pick.entry_price?.toFixed(2)}
            </div>
          </div>
          <div className={`rounded-lg py-1.5 px-1 ${
            isUp ? 'bg-emerald-900/30' : 'bg-red-900/30'
          }`}>
            <div className="text-[9px] text-gray-400 uppercase flex items-center justify-center gap-0.5">
              Current
              {isUp ? <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> : <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
            </div>
            <div className={`text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              ${hasCurrentPrice ? pick.current_price!.toFixed(2) : '—'}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg py-1.5 px-1">
            <div className="text-[9px] text-gray-500 uppercase">Target</div>
            <div className="text-xs font-semibold text-cyan-400">
              ${pick.target_price?.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Alert Modal
function CreateAlertModal({ 
  picks, 
  onClose, 
  onCreate 
}: { 
  picks: StockPick[];
  onClose: () => void;
  onCreate: (alert: Omit<Alert, 'id' | 'triggered' | 'createdAt'>) => void;
}) {
  const [selectedPick, setSelectedPick] = useState<StockPick | null>(null);
  const [alertType, setAlertType] = useState('price_above');
  const [value, setValue] = useState('');
  const [search, setSearch] = useState('');
  
  const filteredPicks = picks.filter(p => 
    p.ticker.toLowerCase().includes(search.toLowerCase()) ||
    p.ai_display_name?.toLowerCase().includes(search.toLowerCase())
  );
  
  const handleCreate = () => {
    if (!selectedPick || !value) return;
    onCreate({
      pickId: selectedPick.id,
      ticker: selectedPick.ticker,
      type: alertType,
      value: parseFloat(value),
      active: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            Create Price Alert
          </h3>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Select Stock */}
          {!selectedPick ? (
            <>
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Select a Stock</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search ticker..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredPicks.slice(0, 15).map(pick => (
                  <button
                    key={pick.id}
                    onClick={() => {
                      setSelectedPick(pick);
                      setValue(pick.current_price?.toFixed(2) || pick.entry_price.toFixed(2));
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                  >
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: pick.ai_color || '#6366f1' }}
                    >
                      {pick.ticker.slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{pick.ticker}</div>
                      <div className="text-xs text-gray-400">{pick.ai_display_name}</div>
                    </div>
                    <div className="text-sm">
                      ${pick.current_price?.toFixed(2) || pick.entry_price.toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Selected Stock */}
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg mb-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: selectedPick.ai_color || '#6366f1' }}
                >
                  {selectedPick.ticker.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{selectedPick.ticker}</div>
                  <div className="text-sm text-gray-400">
                    Current: ${selectedPick.current_price?.toFixed(2) || '—'}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPick(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Change
                </button>
              </div>
              
              {/* Alert Type */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Alert Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_TYPES.slice(0, 4).map(type => (
                    <button
                      key={type.id}
                      onClick={() => setAlertType(type.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                        alertType === type.id
                          ? `bg-${type.color}-900/30 border-${type.color}-600/50 text-${type.color}-400`
                          : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      <span className="text-sm">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Value */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">
                  {alertType.includes('percent') ? 'Percentage' : 'Price'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {alertType.includes('percent') ? '%' : '$'}
                  </span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-lg focus:outline-none focus:border-cyan-500"
                    step="0.01"
                  />
                </div>
              </div>
              
              {/* Quick Presets */}
              {!alertType.includes('percent') && (
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-2 block">Quick Set</label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPick.entry_price && (
                      <button
                        onClick={() => setValue(selectedPick.entry_price.toFixed(2))}
                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs"
                      >
                        Entry ${selectedPick.entry_price.toFixed(0)}
                      </button>
                    )}
                    {selectedPick.target_price && (
                      <button
                        onClick={() => setValue(selectedPick.target_price.toFixed(2))}
                        className="px-3 py-1 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-400 rounded text-xs"
                      >
                        Target ${selectedPick.target_price.toFixed(0)}
                      </button>
                    )}
                    {selectedPick.stop_loss && (
                      <button
                        onClick={() => setValue(selectedPick.stop_loss.toFixed(2))}
                        className="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-xs"
                      >
                        Stop ${selectedPick.stop_loss.toFixed(0)}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedPick || !value}
            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Alert
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Load data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Load alerts from localStorage
  useEffect(() => {
    setAlerts(getStoredAlerts());
  }, []);
  
  // Check for triggered alerts
  useEffect(() => {
    if (picks.length === 0 || alerts.length === 0) return;
    
    const pickMap = new Map(picks.map(p => [p.id, p]));
    let hasChanges = false;
    
    const updatedAlerts = alerts.map(alert => {
      if (!alert.active || alert.triggered) return alert;
      
      const pick = pickMap.get(alert.pickId || '');
      if (!pick || !pick.current_price) return alert;
      
      let triggered = false;
      
      switch (alert.type) {
        case 'price_above':
          triggered = pick.current_price >= alert.value;
          break;
        case 'price_below':
          triggered = pick.current_price <= alert.value;
          break;
        case 'target_reached':
          triggered = pick.current_price >= pick.target_price;
          break;
        case 'gain_percent':
          const gain = ((pick.current_price - pick.entry_price) / pick.entry_price) * 100;
          triggered = gain >= alert.value;
          break;
        case 'loss_percent':
          const loss = ((pick.entry_price - pick.current_price) / pick.entry_price) * 100;
          triggered = loss >= alert.value;
          break;
      }
      
      if (triggered) {
        hasChanges = true;
        return { ...alert, triggered: true, triggeredAt: new Date().toISOString() };
      }
      return alert;
    });
    
    if (hasChanges) {
      setAlerts(updatedAlerts);
      saveAlerts(updatedAlerts);
    }
  }, [picks, alerts]);
  
  async function loadData() {
    setLoading(true);
    try {
      const data = await getPicks({ limit: 500 });
      setPicks(data);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  }
  
  // Create alert
  const createAlert = (alertData: Omit<Alert, 'id' | 'triggered' | 'createdAt'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: Date.now().toString(),
      triggered: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    saveAlerts(updated);
  };
  
  // Toggle alert
  const toggleAlert = (id: string) => {
    const updated = alerts.map(a => 
      a.id === id ? { ...a, active: !a.active } : a
    );
    setAlerts(updated);
    saveAlerts(updated);
  };
  
  // Remove alert
  const removeAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
  };
  
  // Dismiss triggered alert
  const dismissAlert = (id: string) => {
    const updated = alerts.map(a => 
      a.id === id ? { ...a, triggered: false, active: false } : a
    );
    setAlerts(updated);
    saveAlerts(updated);
  };
  
  // Pick map for alerts
  const pickMap = useMemo(() => new Map(picks.map(p => [p.id, p])), [picks]);
  
  // Separate alerts
  const triggeredAlerts = alerts.filter(a => a.triggered);
  const activeAlerts = alerts.filter(a => a.active && !a.triggered);
  const inactiveAlerts = alerts.filter(a => !a.active && !a.triggered);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <Bell className="w-10 h-10 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Price Alerts
            </span>
            <JavariHelpButton topic="price alerts how to use" />
          </h1>
          <p className="text-gray-400">
            Get notified when AI picks hit your price targets. Alerts are checked in real-time.
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className={`rounded-xl p-4 border ${
            triggeredAlerts.length > 0 
              ? 'bg-yellow-900/20 border-yellow-600/50' 
              : 'bg-gray-900/50 border-gray-800'
          }`}>
            <div className="flex items-center gap-2 text-sm mb-1">
              <BellRing className={`w-4 h-4 ${triggeredAlerts.length > 0 ? 'text-yellow-400' : 'text-gray-500'}`} />
              <span className="text-gray-400">Triggered</span>
            </div>
            <div className={`text-2xl font-bold ${triggeredAlerts.length > 0 ? 'text-yellow-400' : ''}`}>
              {triggeredAlerts.length}
            </div>
          </div>
          <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-800/30">
            <div className="flex items-center gap-2 text-sm text-emerald-400 mb-1">
              <Check className="w-4 h-4" />
              Active
            </div>
            <div className="text-2xl font-bold text-emerald-400">{activeAlerts.length}</div>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Bell className="w-4 h-4" />
              Total
            </div>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </div>
        </div>
        
        {/* Create Alert Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Your Alerts</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Alert
          </button>
        </div>
        
        {/* Triggered Alerts */}
        {triggeredAlerts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
              <BellRing className="w-4 h-4" />
              Triggered Alerts
            </h3>
            <div className="space-y-3">
              {triggeredAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  pick={pickMap.get(alert.pickId || '')}
                  onToggle={() => toggleAlert(alert.id)}
                  onRemove={() => removeAlert(alert.id)}
                  onDismiss={() => dismissAlert(alert.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              Active Alerts
            </h3>
            <div className="space-y-3">
              {activeAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  pick={pickMap.get(alert.pickId || '')}
                  onToggle={() => toggleAlert(alert.id)}
                  onRemove={() => removeAlert(alert.id)}
                  onDismiss={() => dismissAlert(alert.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Inactive Alerts */}
        {inactiveAlerts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Paused Alerts</h3>
            <div className="space-y-3">
              {inactiveAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  pick={pickMap.get(alert.pickId || '')}
                  onToggle={() => toggleAlert(alert.id)}
                  onRemove={() => removeAlert(alert.id)}
                  onDismiss={() => dismissAlert(alert.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {alerts.length === 0 && (
          <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-gray-800">
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Alerts Set</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Create price alerts to get notified when AI picks hit your targets.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Your First Alert
            </button>
          </div>
        )}
        
        {/* Help Section */}
        <div className="mt-12 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            About Alerts
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-400">
            <div>
              <p className="font-medium text-white mb-2">Alert Types:</p>
              <ul className="space-y-1.5">
                <li><span className="text-emerald-400">Price Above:</span> Triggers when price exceeds target</li>
                <li><span className="text-red-400">Price Below:</span> Triggers when price drops below threshold</li>
                <li><span className="text-cyan-400">Target Reached:</span> Triggers when AI's target price is hit</li>
                <li><span className="text-green-400">Gain %:</span> Triggers at specified percentage gain</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-white mb-2">How It Works:</p>
              <p>
                Alerts are stored locally and checked every 30 seconds when prices update. 
                Triggered alerts appear at the top with a notification. 
                Note: Alerts only work when this page is open.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Create Modal */}
      {showCreateModal && (
        <CreateAlertModal
          picks={picks}
          onClose={() => setShowCreateModal(false)}
          onCreate={createAlert}
        />
      )}
    </div>
  );
}
