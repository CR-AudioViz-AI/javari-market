/**
 * CR AUDIOVIZ AI - CORE CONSOLE API
 * Central control for ALL apps and assets
 * @version 1.0.0
 */

const CORE_API_BASE = 'https://craudiovizai.com/api/core';

// SECTOR DEFINITIONS
export const SECTORS = {
  FINANCIAL: {
    id: 'financial',
    name: 'Financial Services',
    apps: ['javari-market', 'market-oracle-app', 'mortgage-rate-monitor', 'javari-invoice', 'javari-insurance'],
    dataTypes: ['stocks', 'crypto', 'mortgages', 'rates', 'market-data'],
    affiliates: ['robinhood', 'coinbase', 'lending-tree', 'nerdwallet', 'bankrate'],
  },
  GAMING: {
    id: 'gaming',
    name: 'Gaming & Entertainment',
    apps: ['javari-games', 'javari-games-hub', 'javari-game-studio', 'javari-arena'],
    dataTypes: ['game-assets', 'sprites', 'audio', 'game-data', 'leaderboards'],
    affiliates: ['steam', 'epic-games', 'humble-bundle', 'green-man-gaming'],
  },
  REAL_ESTATE: {
    id: 'real-estate',
    name: 'Real Estate & Property',
    apps: ['javari-realty', 'javari-property', 'javari-property-hub', 'mortgage-rate-monitor', 'javari-orlando', 'javari-home-services', 'javari-construction'],
    dataTypes: ['listings', 'rates', 'property-data', 'market-trends', 'valuations'],
    affiliates: ['zillow', 'realtor', 'redfin', 'rocket-mortgage', 'better'],
  },
  COLLECTORS: {
    id: 'collectors',
    name: 'Collectors & Memorabilia',
    apps: ['javari-cards', 'javari-card-vault', 'javari-coin-cache', 'javari-vinyl-vault', 'javari-watch-works', 'javari-spirits', 'javari-disney-vault', 'javari-comic-crypt', 'javari-scrapbook', 'javari-merch'],
    dataTypes: ['prices', 'grading', 'auctions', 'images', 'catalogs', 'market-values'],
    affiliates: ['ebay', 'tcgplayer', 'comc', 'psa', 'beckett', 'discogs', 'chrono24'],
  },
  CRAFT: {
    id: 'craft',
    name: 'Craft & DIY',
    apps: ['crochet-platform', 'knitting-platform', 'machineknit-platform'],
    dataTypes: ['patterns', 'yarn-data', 'tutorials', 'techniques', 'projects'],
    affiliates: ['amazon', 'joann', 'michaels', 'lovecrafts', 'knitpicks'],
  },
} as const;

// ASSET REPOSITORY
export const AssetRepository = {
  async getAssets(assetType: string, filters?: Record<string, any>): Promise<any[]> {
    const response = await fetch(`${CORE_API_BASE}/assets/${assetType}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters || {}),
    });
    return response.json();
  },
  async getImages(category: string, limit = 50): Promise<any[]> { return this.getAssets('images', { category, limit }); },
  async getTemplates(type: string): Promise<any[]> { return this.getAssets('templates', { type }); },
  async getScrapedData(source: string, query?: string): Promise<any[]> { return this.getAssets('scraped', { source, query }); },
  async storeAsset(assetType: string, data: any): Promise<{ success: boolean; id: string }> {
    const response = await fetch(`${CORE_API_BASE}/assets/${assetType}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    return response.json();
  },
};

// CROSS-SECTOR DATA
export const CrossSectorAPI = {
  async getSectorData(sectorId: string, dataType: string, query?: any): Promise<any> {
    const response = await fetch(`${CORE_API_BASE}/sectors/${sectorId}/data/${dataType}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(query || {}),
    });
    return response.json();
  },
  async getFinancialData(type: 'stocks' | 'crypto' | 'rates' | 'market', symbols?: string[]): Promise<any> {
    return this.getSectorData('financial', type, { symbols });
  },
  async getCollectorPricing(category: string, items?: string[]): Promise<any> {
    return this.getSectorData('collectors', 'prices', { category, items });
  },
  async getRealEstateData(type: 'listings' | 'rates' | 'valuations', location?: string): Promise<any> {
    return this.getSectorData('real-estate', type, { location });
  },
};

// AFFILIATE MANAGEMENT
export const AffiliateAPI = {
  async getAffiliateLink(productType: string, productId: string, appId: string): Promise<{ url: string; commission: number }> {
    const response = await fetch(`${CORE_API_BASE}/affiliates/link`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productType, productId, appId }),
    });
    return response.json();
  },
  async trackClick(affiliateId: string, appId: string, userId?: string): Promise<void> {
    await fetch(`${CORE_API_BASE}/affiliates/click`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliateId, appId, userId, timestamp: new Date().toISOString() }),
    });
  },
  async trackConversion(affiliateId: string, appId: string, orderId: string, amount: number): Promise<void> {
    await fetch(`${CORE_API_BASE}/affiliates/conversion`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliateId, appId, orderId, amount, timestamp: new Date().toISOString() }),
    });
  },
  async getEarnings(appId?: string, dateRange?: { start: string; end: string }): Promise<any> {
    const response = await fetch(`${CORE_API_BASE}/affiliates/earnings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, dateRange }),
    });
    return response.json();
  },
};

// JAVARI LEARNING
export const JavariLearning = {
  async feedData(dataType: string, data: any, source: string): Promise<void> {
    await fetch(`${CORE_API_BASE}/javari/learn`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataType, data, source, timestamp: new Date().toISOString() }),
    });
  },
  async query(question: string, context?: any): Promise<{ answer: string; confidence: number; sources: string[] }> {
    const response = await fetch(`${CORE_API_BASE}/javari/query`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context }),
    });
    return response.json();
  },
  async triggerLearning(sources?: string[]): Promise<{ jobId: string }> {
    const response = await fetch(`${CORE_API_BASE}/javari/learn/trigger`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources }),
    });
    return response.json();
  },
};

// SCRAPER CONTROL
export const ScraperControl = {
  async getStatus(scraperId?: string): Promise<any> {
    const url = scraperId ? `${CORE_API_BASE}/scrapers/status/${scraperId}` : `${CORE_API_BASE}/scrapers/status`;
    return (await fetch(url)).json();
  },
  async triggerScrape(scraperId: string, target: string, options?: Record<string, any>): Promise<{ jobId: string }> {
    const response = await fetch(`${CORE_API_BASE}/scrapers/trigger`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scraperId, target, options }),
    });
    return response.json();
  },
  async getData(scraperId: string, query?: any): Promise<any[]> {
    const response = await fetch(`${CORE_API_BASE}/scrapers/data/${scraperId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query || {}),
    });
    return response.json();
  },
};

// MORTGAGE RATE SPECIAL API
export const MortgageRateAPI = {
  async getCurrentRates(): Promise<any> {
    return (await fetch(`${CORE_API_BASE}/mortgage/rates/current`)).json();
  },
  async getRateHistory(rateType: string, days: number = 30): Promise<any[]> {
    const response = await fetch(`${CORE_API_BASE}/mortgage/rates/history`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rateType, days }),
    });
    return response.json();
  },
  async setAlert(userId: string, rateType: string, targetRate: number, direction: 'above' | 'below'): Promise<{ alertId: string }> {
    const response = await fetch(`${CORE_API_BASE}/mortgage/alerts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, rateType, targetRate, direction }),
    });
    return response.json();
  },
  async getPredictions(): Promise<any> {
    return (await fetch(`${CORE_API_BASE}/mortgage/predictions`)).json();
  },
  async compareLenders(loanAmount: number, loanType: string, zipCode: string): Promise<any[]> {
    const response = await fetch(`${CORE_API_BASE}/mortgage/lenders/compare`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanAmount, loanType, zipCode }),
    });
    return response.json();
  },
};

// COLLECTORS DATA API
export const CollectorsDataAPI = {
  async getMarketPrices(category: string, items?: string[]): Promise<any[]> {
    const response = await fetch(`${CORE_API_BASE}/collectors/prices`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, items }),
    });
    return response.json();
  },
  async getAuctionData(category: string, query?: string): Promise<any[]> {
    const response = await fetch(`${CORE_API_BASE}/collectors/auctions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, query }),
    });
    return response.json();
  },
  async searchCatalog(category: string, query: string): Promise<any[]> {
    const response = await fetch(`${CORE_API_BASE}/collectors/catalog/search`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, query }),
    });
    return response.json();
  },
  async getPriceTrends(category: string, itemId: string, days: number = 90): Promise<any> {
    const response = await fetch(`${CORE_API_BASE}/collectors/trends`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, itemId, days }),
    });
    return response.json();
  },
};

// EXPORT CORE CONSOLE
export const CoreConsole = {
  SECTORS,
  Assets: AssetRepository,
  CrossSector: CrossSectorAPI,
  Affiliates: AffiliateAPI,
  Javari: JavariLearning,
  Scrapers: ScraperControl,
  MortgageRates: MortgageRateAPI,
  Collectors: CollectorsDataAPI,
};

export default CoreConsole;
