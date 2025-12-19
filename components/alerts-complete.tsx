'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Bell,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  Plus,
  Trash2,
  Check
} from 'lucide-react';

interface Alert {
  id: string;
  user_id: string;
  ticker: string;
  alert_type: 'price_above' | 'price_below' | '52_week_high' | '52_week_low' | 'percent_change' | 'volume_spike';
  target_value?: number;
  is_active: boolean;
  triggered_at?: string;
  created_at: string;
  current_price?: number;
  price_at_creation?: number;
}

interface StockOption {
  ticker: string;
  ai_name: string;
  current_price: number;
}

export default function AlertsComplete() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form state
  const [selectedTicker, setSelectedTicker] = useState('');
  const [alertType, setAlertType] = useState<Alert['alert_type']>('price_above');
  const [targetValue, setTargetValue] = useState('');

  const supabase = createClientComponentClient();

  useEffect(() => {
    initializeAlerts();
  }, []);

  const initializeAlerts = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadUserAlerts(user.id);
      }

      // Load available stocks
      const { data: picks } = await supabase
        .from('ai_stock_picks')
        .select('ticker, ai_name, current_price, price')
        .not('current_price', 'is', null);

      if (picks) {
        const uniqueStocks = picks.reduce((acc: StockOption[], pick) => {
          if (!acc.find(s => s.ticker === pick.ticker)) {
            acc.push({
              ticker: pick.ticker,
              ai_name: pick.ai_display_name,
              current_price: pick.current_price || pick.price
            });
          }
          return acc;
        }, []);
        setStockOptions(uniqueStocks);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing alerts:', error);
      setLoading(false);
    }
  };

  const loadUserAlerts = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const createAlert = async () => {
    if (!userId || !selectedTicker || !alertType) return;

    try {
      const stock = stockOptions.find(s => s.ticker === selectedTicker);
      
      const alertData: any = {
        user_id: userId,
        ticker: selectedTicker,
        alert_type: alertType,
        is_active: true,
        price_at_creation: stock?.current_price || 0
      };

      // Add target value for relevant alert types
      if (['price_above', 'price_below', 'percent_change'].includes(alertType)) {
        alertData.target_value = parseFloat(targetValue);
      }

      const { data, error } = await supabase
        .from('user_alerts')
        .insert([alertData])
        .select()
        .single();

      if (error) throw error;

      setAlerts([data, ...alerts]);
      setShowCreateForm(false);
      setSelectedTicker('');
      setAlertType('price_above');
      setTargetValue('');
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({ is_active: !isActive })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, is_active: !isActive } : a
      ));
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const getAlertTypeLabel = (type: Alert['alert_type']) => {
    const labels = {
      'price_above': 'Price Above',
      'price_below': 'Price Below',
      '52_week_high': '52-Week High',
      '52_week_low': '52-Week Low',
      'percent_change': 'Percent Change',
      'volume_spike': 'Volume Spike'
    };
    return labels[type] || type;
  };

  const getAlertTypeIcon = (type: Alert['alert_type']) => {
    const icons = {
      'price_above': <TrendingUp className="w-4 h-4" />,
      'price_below': <TrendingDown className="w-4 h-4" />,
      '52_week_high': <TrendingUp className="w-4 h-4" />,
      '52_week_low': <TrendingDown className="w-4 h-4" />,
      'percent_change': <Target className="w-4 h-4" />,
      'volume_spike': <AlertTriangle className="w-4 h-4" />
    };
    return icons[type] || <Bell className="w-4 h-4" />;
  };

  const getAlertDescription = (alert: Alert) => {
    const stock = stockOptions.find(s => s.ticker === alert.ticker);
    const currentPrice = stock?.current_price || 0;

    switch (alert.alert_type) {
      case 'price_above':
        return `Alert when ${alert.ticker} rises above $${alert.target_value?.toFixed(2)} (Current: $${currentPrice.toFixed(2)})`;
      case 'price_below':
        return `Alert when ${alert.ticker} falls below $${alert.target_value?.toFixed(2)} (Current: $${currentPrice.toFixed(2)})`;
      case '52_week_high':
        return `Alert when ${alert.ticker} reaches a new 52-week high`;
      case '52_week_low':
        return `Alert when ${alert.ticker} reaches a new 52-week low`;
      case 'percent_change':
        return `Alert when ${alert.ticker} changes by ${alert.target_value}% in a day`;
      case 'volume_spike':
        return `Alert when ${alert.ticker} has unusual trading volume`;
      default:
        return '';
    }
  };

  const shouldTargetValueShow = (type: Alert['alert_type']) => {
    return ['price_above', 'price_below', 'percent_change'].includes(type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bell className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Stock Alerts</h1>
            <p className="text-gray-600">
              Get notified when stocks hit your target prices or conditions
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>
              Set up price alerts and notifications for your watched stocks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Stock Symbol</Label>
                <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockOptions.map((stock) => (
                      <SelectItem key={stock.ticker} value={stock.ticker}>
                        {stock.ticker} - ${stock.current_price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Alert Type</Label>
                <Select value={alertType} onValueChange={(value) => setAlertType(value as Alert['alert_type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_above">Price Above Target</SelectItem>
                    <SelectItem value="price_below">Price Below Target</SelectItem>
                    <SelectItem value="52_week_high">52-Week High</SelectItem>
                    <SelectItem value="52_week_low">52-Week Low</SelectItem>
                    <SelectItem value="percent_change">Daily % Change</SelectItem>
                    <SelectItem value="volume_spike">Volume Spike</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {shouldTargetValueShow(alertType) && (
                <div>
                  <Label>
                    {alertType === 'percent_change' ? 'Percentage (%)' : 'Target Price ($)'}
                  </Label>
                  <Input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder={alertType === 'percent_change' ? '5' : '100.00'}
                    step={alertType === 'percent_change' ? '1' : '0.01'}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button
                onClick={createAlert}
                disabled={!selectedTicker || !alertType || (shouldTargetValueShow(alertType) && !targetValue)}
              >
                Create Alert
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {alerts.filter(a => a.is_active).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Active Alerts ({alerts.filter(a => a.is_active).length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts
              .filter(a => a.is_active)
              .map((alert) => (
                <Card key={alert.id} className="border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                          {getAlertTypeIcon(alert.alert_type)}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{alert.ticker}</p>
                          <Badge className="bg-green-100 text-green-700">
                            {getAlertTypeLabel(alert.alert_type)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAlert(alert.id, alert.is_active)}
                          title="Deactivate alert"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getAlertDescription(alert)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Created {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Inactive/Triggered Alerts */}
      {alerts.filter(a => !a.is_active).length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Inactive Alerts ({alerts.filter(a => !a.is_active).length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts
              .filter(a => !a.is_active)
              .map((alert) => (
                <Card key={alert.id} className="border-gray-200 opacity-60">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                          {getAlertTypeIcon(alert.alert_type)}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{alert.ticker}</p>
                          <Badge variant="outline">
                            {getAlertTypeLabel(alert.alert_type)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAlert(alert.id, alert.is_active)}
                          title="Reactivate alert"
                        >
                          <Bell className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getAlertDescription(alert)}
                    </p>
                    {alert.triggered_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Triggered {new Date(alert.triggered_at).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Alerts Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first alert to get notified about stock price movements
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

