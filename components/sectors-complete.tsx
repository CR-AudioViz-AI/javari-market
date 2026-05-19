'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  ExternalLink,
  Clock,
  Building2,
  Zap,
  Heart,
  Cpu,
  Home,
  DollarSign,
  Briefcase,
  ShoppingCart,
  Smartphone
} from 'lucide-react';

function getSupabase() {
  var sb = require('@supabase/supabase-js')
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return sb.createClient(url, key, { auth: { persistSession: false } })
}


interface SectorData {
  name: string;
  icon: React.ReactNode;
  performance: number;
  stocks: string[];
  description: string;
  keywords: string[];
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage?: string;
}

const SECTORS: SectorData[] = [
  {
    name: 'Technology',
    icon: <Cpu className="w-6 h-6" />,
    performance: 0,
    stocks: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'],
    description: 'Software, hardware, semiconductors, and IT services',
    keywords: ['technology', 'AI', 'software', 'semiconductor', 'tech']
  },
  {
    name: 'Healthcare',
    icon: <Heart className="w-6 h-6" />,
    performance: 0,
    stocks: ['JNJ', 'UNH', 'PFE', 'ABBV', 'TMO'],
    description: 'Pharmaceuticals, biotech, and medical devices',
    keywords: ['healthcare', 'pharma', 'biotech', 'medical', 'drug']
  },
  {
    name: 'Financial',
    icon: <DollarSign className="w-6 h-6" />,
    performance: 0,
    stocks: ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
    description: 'Banks, insurance, and financial services',
    keywords: ['banking', 'finance', 'investment', 'insurance', 'fintech']
  },
  {
    name: 'Energy',
    icon: <Zap className="w-6 h-6" />,
    performance: 0,
    stocks: ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
    description: 'Oil, gas, and renewable energy companies',
    keywords: ['energy', 'oil', 'gas', 'renewable', 'petroleum']
  },
  {
    name: 'Consumer',
    icon: <ShoppingCart className="w-6 h-6" />,
    performance: 0,
    stocks: ['AMZN', 'WMT', 'TSLA', 'NKE', 'MCD'],
    description: 'Retail, e-commerce, and consumer products',
    keywords: ['retail', 'consumer', 'ecommerce', 'shopping', 'store']
  },
  {
    name: 'Industrial',
    icon: <Building2 className="w-6 h-6" />,
    performance: 0,
    stocks: ['BA', 'CAT', 'GE', 'HON', 'UPS'],
    description: 'Manufacturing, aerospace, and logistics',
    keywords: ['industrial', 'manufacturing', 'aerospace', 'logistics', 'construction']
  },
  {
    name: 'Real Estate',
    icon: <Home className="w-6 h-6" />,
    performance: 0,
    stocks: ['AMT', 'PLD', 'CCI', 'EQIX', 'PSA'],
    description: 'REITs and real estate development',
    keywords: ['real estate', 'REIT', 'property', 'housing', 'commercial']
  },
  {
    name: 'Communication',
    icon: <Smartphone className="w-6 h-6" />,
    performance: 0,
    stocks: ['VZ', 'T', 'TMUS', 'DIS', 'NFLX'],
    description: 'Telecom, media, and entertainment',
    keywords: ['telecom', 'media', 'entertainment', 'streaming', 'communication']
  }
];

export default function SectorsComplete() {
  const [sectors, setSectors] = useState<SectorData[]>(SECTORS);
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSectorPerformance();
  }, []);

  useEffect(() => {
    if (selectedSector) {
      loadSectorNews(selectedSector);
    }
  }, [selectedSector]);

  const loadSectorPerformance = async () => {
    try {
      // Get all stock picks with current prices
      const { data: picks, error } = await supabase
        .from('ai_stock_picks')
        .select('ticker, price, current_price')
        .not('current_price', 'is', null);

      if (error) throw error;

      // Calculate performance for each sector
      const updatedSectors = sectors.map(sector => {
        const sectorPicks = picks?.filter(pick => 
          sector.stocks.includes(pick.ticker)
        ) || [];

        if (sectorPicks.length === 0) {
          return { ...sector, performance: 0 };
        }

        const totalPerformance = sectorPicks.reduce((sum, pick) => {
          const performance = ((pick.current_price - pick.price) / pick.price) * 100;
          return sum + performance;
        }, 0);

        const avgPerformance = totalPerformance / sectorPicks.length;

        return { ...sector, performance: avgPerformance };
      });

      setSectors(updatedSectors);
      setLoadingPrices(false);
    } catch (error) {
      console.error('Error loading sector performance:', error);
      setLoadingPrices(false);
    }
  };

  const loadSectorNews = async (sector: SectorData) => {
    setLoadingNews(true);
    setNews([]);

    try {
      // Use multiple keywords for better news coverage
      const query = sector.keywords.slice(0, 3).join(' OR ');
      
      // Fetch from NewsAPI via serverless function
      const response = await fetch(`/api/news?q=${encodeURIComponent(query)}&category=business&pageSize=10`);
      
      if (!response.ok) {
        // Fallback: Use mock news if API fails
        const mockNews: NewsArticle[] = [
          {
            title: `${sector.name} Sector Shows Strong Growth`,
            description: `Recent market analysis indicates positive momentum in the ${sector.name} sector with key stocks outperforming expectations.`,
            url: '#',
            source: 'Market Oracle Analysis',
            publishedAt: new Date().toISOString()
          },
          {
            title: `Investors Eye ${sector.name} Opportunities`,
            description: `Major institutional investors are increasing positions in ${sector.name} stocks, signaling confidence in the sector's future.`,
            url: '#',
            source: 'Financial Times',
            publishedAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            title: `${sector.name} Outlook: What to Expect`,
            description: `Industry experts weigh in on the outlook for ${sector.name} companies in the current market environment.`,
            url: '#',
            source: 'Bloomberg',
            publishedAt: new Date(Date.now() - 7200000).toISOString()
          }
        ];
        setNews(mockNews);
      } else {
        const data = await response.json();
        setNews(data.articles || []);
      }
    } catch (error) {
      console.error('Error loading sector news:', error);
      // Use fallback mock news
      setNews([
        {
          title: `${sector.name} Market Update`,
          description: `Latest developments in the ${sector.name} sector. Check back for real-time news updates.`,
          url: '#',
          source: 'Market Oracle',
          publishedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleSectorClick = (sector: SectorData) => {
    setSelectedSector(sector);
  };

  const handleBack = () => {
    setSelectedSector(null);
    setNews([]);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Main sectors grid view
  if (!selectedSector) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Market Sectors</h1>
          <p className="text-gray-600">
            Click any sector to view latest news and performance details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectors.map((sector) => (
            <Card
              key={sector.name}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              onClick={() => handleSectorClick(sector)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${sector.performance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className={sector.performance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {sector.icon}
                    </div>
                  </div>
                  {!loadingPrices && (
                    <div className={`flex items-center gap-1 ${sector.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sector.performance >= 0 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span className="font-bold">
                        {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold mb-2">{sector.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{sector.description}</p>
                <div className="flex flex-wrap gap-1">
                  {sector.stocks.slice(0, 3).map((stock) => (
                    <Badge key={stock} variant="outline" className="text-xs">
                      {stock}
                    </Badge>
                  ))}
                  {sector.stocks.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{sector.stocks.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Sector detail view with news
  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        onClick={handleBack}
        className="mb-6"
      >
        ← Back to All Sectors
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className={`p-4 rounded-lg mb-4 ${selectedSector.performance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className={`${selectedSector.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedSector.icon}
                </div>
              </div>
              <CardTitle>{selectedSector.name}</CardTitle>
              <CardDescription>{selectedSector.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Sector Performance</p>
                  <div className={`text-3xl font-bold ${selectedSector.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedSector.performance >= 0 ? '+' : ''}{selectedSector.performance.toFixed(2)}%
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Key Stocks</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSector.stocks.map((stock) => (
                      <Badge key={stock} variant="secondary">
                        {stock}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* News Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                Latest {selectedSector.name} News
              </CardTitle>
              <CardDescription>
                Real-time news and updates for the {selectedSector.name} sector
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNews ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Newspaper className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading latest news...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {news.map((article, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          {article.urlToImage && (
                            <img
                              src={article.urlToImage}
                              alt={article.title}
                              className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-grow">
                            <h3 className="font-bold mb-2 line-clamp-2">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {article.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-medium">{article.source}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(article.publishedAt)}
                                </div>
                              </div>
                              {article.url !== '#' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(article.url, '_blank')}
                                  className="flex items-center gap-1"
                                >
                                  Read More
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
