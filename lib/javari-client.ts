// Javari SDK Client - Universal Integration
// Copy this file to lib/javari-client.ts in each app

import { JavariSDK } from '@/lib/sdk'

// App configuration registry
const APP_CONFIGS: Record<string, {
  id: string
  name: string
  category: 'creative' | 'business' | 'analysis' | 'developer' | 'gaming'
}> = {
  'crav-ebook-creator': {
    id: 'ebook-creator',
    name: 'eBook Creator',
    category: 'creative'
  },
  'crav-logo-studio': {
    id: 'logo-studio',
    name: 'Logo Studio',
    category: 'creative'
  },
  'crav-site-builder': {
    id: 'site-builder',
    name: 'Site Builder',
    category: 'creative'
  },
  'crav-pdf-builder': {
    id: 'pdf-builder',
    name: 'PDF Builder',
    category: 'business'
  },
  'crav-builder': {
    id: 'builder',
    name: 'Document Builder',
    category: 'business'
  },
  'crav-legalease': {
    id: 'legalease',
    name: 'LegalEase',
    category: 'business'
  },
  'crav-market-oracle': {
    id: 'market-oracle',
    name: 'Market Oracle',
    category: 'analysis'
  },
  'crav-news-compare': {
    id: 'news-compare',
    name: 'News Compare',
    category: 'analysis'
  },
  'crav-competitive-intelligence': {
    id: 'competitive-intelligence',
    name: 'Competitive Intelligence',
    category: 'analysis'
  },
  'crav-games': {
    id: 'games',
    name: 'Games Platform',
    category: 'gaming'
  },
  'crav-javari': {
    id: 'javari',
    name: 'Javari AI',
    category: 'developer'
  },
  'agentos-platform': {
    id: 'agentos',
    name: 'AgentOS Platform',
    category: 'business'
  },
  'cr-realtor-platform': {
    id: 'realtor',
    name: 'Realtor Platform',
    category: 'business'
  },
  'javari-fcc-scraper': {
    id: 'fcc-scraper',
    name: 'FCC Scraper',
    category: 'developer'
  },
  'javari-intelligence-layer': {
    id: 'intelligence',
    name: 'Intelligence Layer',
    category: 'developer'
  },
  'javari-mdn-scraper': {
    id: 'mdn-scraper',
    name: 'MDN Scraper',
    category: 'developer'
  },
  'crav-website': {
    id: 'main-website',
    name: 'CR AudioViz AI Website',
    category: 'business'
  }
}

let javariInstance: JavariSDK | null = null

/**
 * Initialize Javari SDK for the current app
 */
export function initJavari(appName?: string): JavariSDK | null {
  // Return existing instance if already initialized
  if (javariInstance) {
    return javariInstance
  }

  // Determine app name from environment or parameter
  const currentApp = appName || process.env.NEXT_PUBLIC_APP_NAME || ''
  const config = APP_CONFIGS[currentApp]

  if (!config) {
    console.warn(`[Javari] No configuration found for app: ${currentApp}`)
    return null
  }

  try {
    javariInstance = new JavariSDK({
      appId: config.id,
      appName: config.name,
      category: config.category,
      apiUrl: process.env.NEXT_PUBLIC_JAVARI_API || 'https://javariai.com/api',
      
      // Enable all monitoring features
      autoMonitor: true,
      errorTracking: true,
      performance: true,
      analytics: true,
      
      // Auto-fix settings
      autoFix: {
        enabled: true,
        strategies: ['typescript_fix', 'dependency_install', 'retry_with_backoff']
      },
      
      // Health check interval (5 minutes)
      healthCheckInterval: 300000,
      
      // Performance tracking
      performanceThresholds: {
        pageLoad: 3000,      // 3 seconds
        apiResponse: 1000,   // 1 second
        render: 100          // 100ms
      }
    })

    console.log(`✅ Javari SDK initialized for ${config.name}`)
    return javariInstance
  } catch (error) {
    console.error('[Javari] Initialization failed:', error)
    return null
  }
}

/**
 * Get the current Javari SDK instance
 */
export function getJavari(): JavariSDK | null {
  return javariInstance
}

/**
 * Auto-initialize on client side
 */
if (typeof window !== 'undefined') {
  // Initialize Javari on page load
  const javari = initJavari()
  
  if (javari) {
    // Start monitoring
    javari.startMonitoring()
    
    // Global error handler
    window.addEventListener('error', (event) => {
      javari.trackError({
        error_type: 'runtime',
        message: event.message,
        file_path: event.filename,
        line_number: event.lineno,
        column_number: event.colno,
        stack_trace: event.error?.stack,
        severity: 'error',
        user_context: {
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      })
    })
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      javari.trackError({
        error_type: 'runtime',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack_trace: event.reason?.stack,
        severity: 'error',
        user_context: {
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      })
    })
    
    // Performance monitoring
    if (window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = window.performance.timing
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
          
          javari.trackPerformance({
            metric_name: 'page_load',
            value: pageLoadTime,
            url: window.location.pathname,
            metadata: {
              dns: perfData.domainLookupEnd - perfData.domainLookupStart,
              tcp: perfData.connectEnd - perfData.connectStart,
              ttfb: perfData.responseStart - perfData.navigationStart,
              download: perfData.responseEnd - perfData.responseStart,
              domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart
            }
          })
        }, 0)
      })
    }
    
    // Initial health report
    javari.reportHealth('healthy', {
      uptime: 0,
      metrics: {
        responseTime: 0,
        errorRate: 0,
        activeUsers: 1
      }
    })
    
    // Periodic health checks
    setInterval(() => {
      javari.reportHealth('healthy', {
        uptime: Math.floor(performance.now() / 1000),
        metrics: {
          responseTime: 0,
          errorRate: 0,
          activeUsers: 1
        }
      })
    }, 300000) // Every 5 minutes
  }
}

// Export for manual usage
export { javariInstance as default }
