// app/learning/page.tsx
// Market Oracle Ultimate - AI Learning Dashboard
// Created: December 13, 2025

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Calibration {
  id: string;
  aiModel: string;
  calibrationDate: string;
  totalPicks: number;
  wins: number;
  losses: number;
  winRate: number;
  avgReturn: number;
  avgConfidence: number;
  overconfidenceScore: number;
  bestSectors: string[];
  worstSectors: string[];
  keyLearnings: string[];
  adjustments: string[];
}

interface ConsensusStats {
  aiCombination: string[];
  timesAgreed: number;
  accuracyRate: number;
  avgReturn: number;
}

export default function LearningDashboard() {
  const [calibrations, setCalibrations] = useState<Record<string, Calibration | null>>({});
  const [consensusStats, setConsensusStats] = useState<ConsensusStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCalibration, setRunningCalibration] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch calibrations
      const calResponse = await fetch('/api/calibration');
      const calData = await calResponse.json();
      if (calData.calibrations) {
        setCalibrations(calData.calibrations);
      }

      // Fetch consensus stats
      const consensusResponse = await fetch('/api/javari/consensus-stats');
      const consensusData = await consensusResponse.json();
      if (consensusData.stats) {
        setConsensusStats(consensusData.stats);
      }
    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runCalibration(aiModel: string | 'all') {
    setRunningCalibration(aiModel);
    try {
      await fetch('/api/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiModel === 'all' ? { runAll: true } : { aiModel }),
      });
      await fetchData();
    } catch (error) {
      console.error('Error running calibration:', error);
    } finally {
      setRunningCalibration(null);
    }
  }

  const aiModels = ['gpt4', 'claude', 'gemini', 'perplexity'];
  const aiColors: Record<string, string> = {
    gpt4: 'from-green-500 to-emerald-600',
    claude: 'from-orange-500 to-amber-600',
    gemini: 'from-blue-500 to-cyan-600',
    perplexity: 'from-purple-500 to-violet-600',
  };

  const aiNames: Record<string, string> = {
    gpt4: 'GPT-4 Turbo',
    claude: 'Claude Sonnet',
    gemini: 'Gemini Pro',
    perplexity: 'Perplexity Sonar',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-2xl">🧠</span>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Market Oracle Learning
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-300 hover:text-white transition">
                Dashboard
              </Link>
              <button
                onClick={() => runCalibration('all')}
                disabled={runningCalibration !== null}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {runningCalibration === 'all' ? '⏳ Running...' : '🔄 Run All Calibrations'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Learning Dashboard</h1>
          <p className="text-slate-400">
            Watch the AIs learn and improve over time. Each calibration cycle analyzes past picks 
            and adjusts behavior for better accuracy.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* AI Model Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {aiModels.map(model => {
                const cal = calibrations[model];
                return (
                  <div
                    key={model}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${aiColors[model]} flex items-center justify-center text-xl`}>
                          {model === 'gpt4' ? '🤖' : model === 'claude' ? '🧠' : model === 'gemini' ? '✨' : '🔍'}
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{aiNames[model]}</h3>
                          <p className="text-xs text-slate-400">
                            {cal ? `Last calibrated: ${new Date(cal.calibrationDate).toLocaleDateString()}` : 'Not yet calibrated'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => runCalibration(model)}
                        disabled={runningCalibration !== null}
                        className="px-3 py-1 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition disabled:opacity-50"
                      >
                        {runningCalibration === model ? '⏳' : '🔄'}
                      </button>
                    </div>

                    {cal ? (
                      <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-black/20 rounded-lg">
                            <div className="text-2xl font-bold text-white">
                              {(cal.winRate * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-400">Win Rate</div>
                          </div>
                          <div className="text-center p-3 bg-black/20 rounded-lg">
                            <div className="text-2xl font-bold text-white">
                              {cal.totalPicks}
                            </div>
                            <div className="text-xs text-slate-400">Total Picks</div>
                          </div>
                          <div className="text-center p-3 bg-black/20 rounded-lg">
                            <div className={`text-2xl font-bold ${cal.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {cal.avgReturn >= 0 ? '+' : ''}{cal.avgReturn.toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-400">Avg Return</div>
                          </div>
                        </div>

                        {/* Confidence Calibration */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-400">Confidence Calibration</span>
                            <span className={cal.overconfidenceScore > 10 ? 'text-yellow-400' : cal.overconfidenceScore < -10 ? 'text-blue-400' : 'text-green-400'}>
                              {cal.overconfidenceScore > 10 ? '⚠️ Overconfident' : cal.overconfidenceScore < -10 ? '📈 Underconfident' : '✅ Well Calibrated'}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${cal.overconfidenceScore > 10 ? 'bg-yellow-500' : cal.overconfidenceScore < -10 ? 'bg-blue-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, Math.max(0, 50 + cal.overconfidenceScore))}%` }}
                            />
                          </div>
                        </div>

                        {/* Sectors */}
                        <div className="mb-4">
                          {cal.bestSectors.length > 0 && (
                            <div className="text-sm">
                              <span className="text-green-400">🎯 Best: </span>
                              <span className="text-slate-300">{cal.bestSectors.join(', ')}</span>
                            </div>
                          )}
                          {cal.worstSectors.length > 0 && (
                            <div className="text-sm">
                              <span className="text-red-400">⚠️ Weak: </span>
                              <span className="text-slate-300">{cal.worstSectors.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Key Learnings */}
                        {cal.keyLearnings.length > 0 && (
                          <div className="border-t border-white/10 pt-4">
                            <h4 className="text-sm font-medium text-white mb-2">📚 Key Learnings</h4>
                            <ul className="space-y-1">
                              {cal.keyLearnings.slice(0, 3).map((learning, i) => (
                                <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                  <span className="text-purple-400">•</span>
                                  {learning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Adjustments */}
                        {cal.adjustments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-white mb-2">🔧 Adjustments</h4>
                            <ul className="space-y-1">
                              {cal.adjustments.slice(0, 2).map((adj, i) => (
                                <li key={i} className="text-xs text-yellow-400/80 flex items-start gap-2">
                                  <span>→</span>
                                  {adj}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p className="mb-2">No calibration data yet</p>
                        <p className="text-xs">Need at least 5 completed picks to calibrate</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Javari Consensus Learning */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                  🦸
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Javari AI Meta-Learning</h2>
                  <p className="text-sm text-slate-400">Learning which AI combinations to trust</p>
                </div>
              </div>

              {consensusStats.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {consensusStats.slice(0, 6).map((stat, i) => (
                    <div key={i} className="bg-black/20 rounded-lg p-4">
                      <div className="font-medium text-white mb-2">
                        {stat.aiCombination.join(' + ')}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-green-400">
                            {(stat.accuracyRate * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-slate-500">Accuracy</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">
                            {stat.timesAgreed}
                          </div>
                          <div className="text-xs text-slate-500">Consensus</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${stat.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stat.avgReturn >= 0 ? '+' : ''}{stat.avgReturn.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-500">Avg Return</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p className="mb-2">Building consensus intelligence...</p>
                  <p className="text-xs">Javari learns which AI combinations predict best over time</p>
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">🔬 How AI Learning Works</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-medium text-white mb-1">1. Track Everything</h3>
                  <p className="text-xs text-slate-400">
                    Every pick records: reasoning, factors considered, confidence level, and outcome
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">🔍</div>
                  <h3 className="font-medium text-white mb-1">2. Analyze Outcomes</h3>
                  <p className="text-xs text-slate-400">
                    After each pick closes, we analyze what worked and what didn&apos;t
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-medium text-white mb-1">3. Calibrate Weekly</h3>
                  <p className="text-xs text-slate-400">
                    Each AI receives personalized feedback: &quot;you&apos;re overconfident in tech&quot;, &quot;strong in healthcare&quot;
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">📈</div>
                  <h3 className="font-medium text-white mb-1">4. Improve Over Time</h3>
                  <p className="text-xs text-slate-400">
                    Accuracy improves as AIs learn from thousands of real outcomes
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
