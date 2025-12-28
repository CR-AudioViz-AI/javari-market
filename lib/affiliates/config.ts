// lib/affiliates/config.ts
// Centralized Affiliate Configuration for CR AudioViz AI Ecosystem
// Created: December 28, 2025
// Purpose: Single source of truth for all affiliate links across 60+ apps

export interface AffiliateProgram {
  id: string;
  name: string;
  link: string;
  commission: string;
  type: 'recurring' | 'one-time' | 'per-booking' | 'per-lead';
  category: string;
  platforms: string[];
  badge?: string;
  description?: string;
}

export const AFFILIATE_PROGRAMS: Record<string, AffiliateProgram> = {
  // ============ AI & VOICE ============
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    link: 'https://try.elevenlabs.io/z24t231p5l5f',
    commission: '22%',
    type: 'recurring',
    category: 'ai-voice',
    platforms: ['javari-ai', 'crav-website', 'audio-tools'],
    badge: 'Premium Voices',
    description: 'AI voice synthesis with 1000+ professional voices'
  },

  // ============ TRAVEL ============
  viator: {
    id: 'viator',
    name: 'Viator',
    link: 'https://www.viator.com/?pid=P00280339',
    commission: '8%',
    type: 'per-booking',
    category: 'travel',
    platforms: ['orlando-trip-deal', 'crav-website'],
    badge: 'Best Tours',
    description: 'Tours and activities worldwide'
  },
  getyourguide: {
    id: 'getyourguide',
    name: 'GetYourGuide',
    link: 'https://www.getyourguide.com/?partner_id=VZYKZYE',
    commission: '8%',
    type: 'per-booking',
    category: 'travel',
    platforms: ['orlando-trip-deal', 'crav-website'],
    description: 'Tours, attractions, and experiences'
  },
  klook: {
    id: 'klook',
    name: 'Klook',
    link: 'https://www.klook.com/?aid=106921',
    commission: '3-5%',
    type: 'per-booking',
    category: 'travel',
    platforms: ['orlando-trip-deal'],
    description: 'Activities and attractions in Asia & beyond'
  },
  discovercars: {
    id: 'discovercars',
    name: 'Discover Cars',
    link: 'https://www.discovercars.com/?a_aid=royhenders',
    commission: '3% lifetime',
    type: 'recurring',
    category: 'travel',
    platforms: ['orlando-trip-deal', 'crav-website'],
    description: 'Car rental comparison'
  },
  squaremouth: {
    id: 'squaremouth',
    name: 'Squaremouth',
    link: 'https://www.squaremouth.com/travel-insurance?affid=23859',
    commission: 'varies',
    type: 'per-lead',
    category: 'travel',
    platforms: ['orlando-trip-deal'],
    description: 'Travel insurance comparison'
  },

  // ============ PRINT ON DEMAND ============
  printful: {
    id: 'printful',
    name: 'Printful',
    link: 'https://www.printful.com/a/craudiovizai',
    commission: '10%',
    type: 'recurring',
    category: 'pod',
    platforms: ['market-forge', 'crav-website'],
    badge: 'Create & Sell',
    description: 'Print on demand products - t-shirts, mugs, posters'
  },

  // ============ DEVELOPER TOOLS ============
  crawlbase: {
    id: 'crawlbase',
    name: 'Crawlbase',
    link: 'https://crawlbase.com/?s=mMXcTb6S',
    commission: '25%',
    type: 'recurring',
    category: 'developer',
    platforms: ['javari-ai', 'market-oracle'],
    description: 'Web scraping and crawling API'
  },

  // ============ REAL ESTATE ============
  buildium: {
    id: 'buildium',
    name: 'Buildium',
    link: 'https://www.buildium.com/?ref=craudiovizai', // Update when approved
    commission: '25%',
    type: 'recurring',
    category: 'real-estate',
    platforms: ['cr-realtor-platform', 'crav-property-management'],
    description: 'Property management software'
  },
  turbotenant: {
    id: 'turbotenant',
    name: 'TurboTenant',
    link: 'https://www.turbotenant.com/?ref=craudiovizai', // Update when approved
    commission: '$40/customer',
    type: 'one-time',
    category: 'real-estate',
    platforms: ['cr-realtor-platform', 'crav-property-management'],
    description: 'Landlord software - tenant screening, rent collection'
  }
};

// Helper functions
export function getAffiliatesByPlatform(platform: string): AffiliateProgram[] {
  return Object.values(AFFILIATE_PROGRAMS).filter(
    (program) => program.platforms.includes(platform)
  );
}

export function getAffiliatesByCategory(category: string): AffiliateProgram[] {
  return Object.values(AFFILIATE_PROGRAMS).filter(
    (program) => program.category === category
  );
}

export function getAffiliateLink(programId: string): string {
  return AFFILIATE_PROGRAMS[programId]?.link || '';
}

// Tracking function (integrate with PostHog)
export function trackAffiliateClick(
  programId: string,
  placement: string,
  userId?: string
) {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('affiliate_click', {
      program: programId,
      placement,
      user_id: userId,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  }
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Affiliate Click] ${programId} from ${placement}`);
  }
}
