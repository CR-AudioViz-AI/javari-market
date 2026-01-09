/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    CR AUDIOVIZ AI - CENTRAL SERVICES                         ║
 * ║                          Version 3.0.0                                       ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  This file MUST be included in every app in the ecosystem.                   ║
 * ║  All apps route through craudiovizai.com/api for central services.           ║
 * ║                                                                               ║
 * ║  Services Provided:                                                           ║
 * ║  - Authentication (OAuth, Email/Password, Session)                            ║
 * ║  - Credits (Balance, Spend, Refund, History, Admin Bypass)                    ║
 * ║  - Payments (Stripe, PayPal, Checkout)                                        ║
 * ║  - Support (Tickets, Knowledge Base, Chat)                                    ║
 * ║  - Enhancements (Feature Requests, Voting, Roadmap)                           ║
 * ║  - Analytics (Events, Page Views, Conversions)                                ║
 * ║  - Activity (Audit Trail, User Actions)                                       ║
 * ║  - Notifications (Email, Push, In-App)                                        ║
 * ║  - Registry (App Discovery, Health Reporting)                                 ║
 * ║  - Cross-Selling (Recommendations)                                            ║
 * ║                                                                               ║
 * ║  NO app should have its own auth, payment, or credit endpoints.               ║
 * ║  Everything goes through the central hub at craudiovizai.com                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @version 3.0.0
 * @date January 9, 2026
 * @author CR AudioViz AI - Cindy & Roy Henderson
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export const CENTRAL_DOMAIN = 'craudiovizai.com';
export const CENTRAL_API_BASE = process.env.NEXT_PUBLIC_CENTRAL_API_URL || `https://${CENTRAL_DOMAIN}/api`;

// ============================================================================
// ADMIN BYPASS - Roy & Cindy Henderson get FREE access to EVERYTHING
// ============================================================================

export const ADMIN_EMAILS: string[] = [
  'royhenderson@craudiovizai.com',
  'cindyhenderson@craudiovizai.com',
  'roy@craudiovizai.com',
  'cindy@craudiovizai.com',
  'admin@craudiovizai.com'
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function shouldChargeCredits(email: string | null | undefined): boolean {
  return !isAdmin(email);
}

// ============================================================================
// CREDIT COSTS BY ACTION
// ============================================================================

export const CREDIT_COSTS: Record<string, number> = {
  // AI Generation
  'ai_image': 5,
  'ai_video': 20,
  'ai_audio': 10,
  'ai_text': 1,
  'ai_code': 2,
  'ai_chat': 1,
  
  // Pattern Generation (Crochet, Knitting, Machine Knit)
  'pattern_basic': 3,
  'pattern_intermediate': 5,
  'pattern_advanced': 10,
  'pattern_custom': 15,
  
  // Documents
  'pdf_generate': 3,
  'pdf_merge': 2,
  'pdf_convert': 2,
  'ebook_generate': 10,
  'ebook_convert': 5,
  'invoice_generate': 2,
  'presentation_generate': 5,
  'resume_generate': 3,
  'cover_letter_generate': 2,
  'email_template_generate': 1,
  'social_post_generate': 1,
  
  // Real Estate
  'property_analysis': 5,
  'market_report': 10,
  'listing_generate': 3,
  
  // Games
  'game_play': 0,  // Free
  'game_premium_feature': 2,
  
  // Market/Trading
  'stock_analysis': 3,
  'crypto_analysis': 3,
  'market_prediction': 5,
  
  // Travel
  'itinerary_generate': 5,
  'travel_recommendation': 2,
  
  // Misc
  'export_data': 1,
  'premium_feature': 2,
  'api_call': 1
};

export function getCreditCost(action: string): number {
  return CREDIT_COSTS[action] || 1;
}

// ============================================================================
// TYPES
// ============================================================================

export interface CentralResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  display_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'super_admin';
  credits: number;
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  plan_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditBalance {
  balance: number;
  plan: string;
  monthly_allowance: number;
  used_this_month: number;
  expires_at?: string;
  auto_reload_enabled: boolean;
  auto_reload_threshold?: number;
  auto_reload_amount?: number;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit' | 'refund' | 'purchase' | 'bonus' | 'monthly_allowance';
  action: string;
  app_id: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  app_id?: string;
  assigned_to?: string;
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  is_staff: boolean;
  content: string;
  attachments?: string[];
  created_at: string;
}

export interface Enhancement {
  id: string;
  title: string;
  description: string;
  status: 'proposed' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'rejected';
  category: string;
  app_id?: string;
  user_id: string;
  votes: number;
  has_voted?: boolean;
  comments_count: number;
  created_at: string;
  updated_at: string;
  planned_release?: string;
}

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

// ============================================================================
// CENTRAL FETCH UTILITY
// ============================================================================

async function centralFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<CentralResponse<T>> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${CENTRAL_API_BASE}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${res.status}`,
        code: data.code
      };
    }
    
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

export const CentralAuth = {
  /**
   * Get current user session
   */
  async getSession(): Promise<CentralResponse<User>> {
    return centralFetch<User>('/auth/session');
  },

  /**
   * Sign in with email/password
   */
  async signIn(email: string, password: string): Promise<CentralResponse<User>> {
    return centralFetch<User>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  /**
   * Sign up with email/password
   */
  async signUp(email: string, password: string, name?: string): Promise<CentralResponse<User>> {
    return centralFetch<User>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
  },

  /**
   * Sign out
   */
  async signOut(): Promise<CentralResponse<void>> {
    return centralFetch<void>('/auth/signout', { method: 'POST' });
  },

  /**
   * OAuth sign in - redirects to provider
   */
  async oAuthSignIn(provider: 'google' | 'github' | 'discord' | 'twitter', redirectTo?: string): Promise<void> {
    const params = new URLSearchParams();
    params.set('provider', provider);
    if (redirectTo) params.set('redirect_to', redirectTo);
    window.location.href = `${CENTRAL_API_BASE}/auth/oauth?${params.toString()}`;
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<CentralResponse<void>> {
    return centralFetch<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  /**
   * Update password
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<CentralResponse<void>> {
    return centralFetch<void>('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Pick<User, 'name' | 'display_name' | 'avatar_url'>>): Promise<CentralResponse<User>> {
    return centralFetch<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  /**
   * Get auth redirect URL (for manual OAuth flows)
   */
  getOAuthUrl(provider: string, redirectTo?: string): string {
    const params = new URLSearchParams();
    params.set('provider', provider);
    if (redirectTo) params.set('redirect_to', redirectTo);
    return `${CENTRAL_API_BASE}/auth/oauth?${params.toString()}`;
  }
};

// ============================================================================
// CREDITS SERVICE
// ============================================================================

export const CentralCredits = {
  /**
   * Get current credit balance
   */
  async getBalance(): Promise<CentralResponse<CreditBalance>> {
    return centralFetch<CreditBalance>('/credits/balance');
  },

  /**
   * Spend credits for an action
   */
  async spend(amount: number, action: string, appId: string, description?: string): Promise<CentralResponse<CreditBalance>> {
    return centralFetch<CreditBalance>('/credits/spend', {
      method: 'POST',
      body: JSON.stringify({ amount, action, app_id: appId, description })
    });
  },

  /**
   * Spend credits by action type (uses CREDIT_COSTS lookup)
   */
  async spendForAction(action: string, appId: string, description?: string): Promise<CentralResponse<CreditBalance>> {
    const cost = getCreditCost(action);
    return this.spend(cost, action, appId, description);
  },

  /**
   * Check if user can afford an action (for UI gating)
   */
  async canAfford(action: string): Promise<{ allowed: boolean; cost: number; balance: number }> {
    const cost = getCreditCost(action);
    const response = await this.getBalance();
    const balance = response.data?.balance || 0;
    return { allowed: balance >= cost, cost, balance };
  },

  /**
   * Refund credits
   */
  async refund(amount: number, reason: string, appId: string, originalTransactionId?: string): Promise<CentralResponse<CreditBalance>> {
    return centralFetch<CreditBalance>('/credits/refund', {
      method: 'POST',
      body: JSON.stringify({ amount, reason, app_id: appId, original_transaction_id: originalTransactionId })
    });
  },

  /**
   * Get credit transaction history
   */
  async getHistory(limit: number = 50, offset: number = 0): Promise<CentralResponse<CreditTransaction[]>> {
    return centralFetch<CreditTransaction[]>(`/credits/history?limit=${limit}&offset=${offset}`);
  },

  /**
   * Purchase credits
   */
  async purchase(creditPackId: string): Promise<CentralResponse<PaymentIntent>> {
    return centralFetch<PaymentIntent>('/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ credit_pack_id: creditPackId })
    });
  },

  /**
   * Set auto-reload preferences
   */
  async setAutoReload(enabled: boolean, threshold?: number, amount?: number): Promise<CentralResponse<void>> {
    return centralFetch<void>('/credits/auto-reload', {
      method: 'PUT',
      body: JSON.stringify({ enabled, threshold, amount })
    });
  }
};

// ============================================================================
// PAYMENTS SERVICE
// ============================================================================

export const CentralPayments = {
  /**
   * Create Stripe checkout session
   */
  async createCheckout(planId: string, successUrl?: string, cancelUrl?: string): Promise<CentralResponse<{ url: string }>> {
    return centralFetch<{ url: string }>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ 
        plan_id: planId, 
        success_url: successUrl || window.location.href,
        cancel_url: cancelUrl || window.location.href
      })
    });
  },

  /**
   * Create PayPal order
   */
  async createPayPalOrder(planId: string): Promise<CentralResponse<{ orderId: string }>> {
    return centralFetch<{ orderId: string }>('/payments/paypal/create', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId })
    });
  },

  /**
   * Capture PayPal payment
   */
  async capturePayPalOrder(orderId: string): Promise<CentralResponse<void>> {
    return centralFetch<void>('/payments/paypal/capture', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId })
    });
  },

  /**
   * Get subscription details
   */
  async getSubscription(): Promise<CentralResponse<{ plan: string; status: string; current_period_end: string; cancel_at_period_end: boolean }>> {
    return centralFetch('/payments/subscription');
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(immediately: boolean = false): Promise<CentralResponse<void>> {
    return centralFetch<void>('/payments/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ immediately })
    });
  },

  /**
   * Update payment method
   */
  async updatePaymentMethod(): Promise<CentralResponse<{ url: string }>> {
    return centralFetch<{ url: string }>('/payments/update-method', { method: 'POST' });
  },

  /**
   * Get billing history
   */
  async getBillingHistory(limit: number = 10): Promise<CentralResponse<any[]>> {
    return centralFetch<any[]>(`/payments/history?limit=${limit}`);
  }
};

// ============================================================================
// SUPPORT SERVICE
// ============================================================================

export const CentralSupport = {
  /**
   * Create a support ticket
   */
  async createTicket(subject: string, description: string, category: string, appId?: string, priority: Ticket['priority'] = 'medium'): Promise<CentralResponse<Ticket>> {
    return centralFetch<Ticket>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject, description, category, app_id: appId, priority })
    });
  },

  /**
   * Get user's tickets
   */
  async getTickets(status?: Ticket['status']): Promise<CentralResponse<Ticket[]>> {
    const params = status ? `?status=${status}` : '';
    return centralFetch<Ticket[]>(`/support/tickets${params}`);
  },

  /**
   * Get single ticket with messages
   */
  async getTicket(ticketId: string): Promise<CentralResponse<Ticket>> {
    return centralFetch<Ticket>(`/support/tickets/${ticketId}`);
  },

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: string, content: string, attachments?: string[]): Promise<CentralResponse<TicketMessage>> {
    return centralFetch<TicketMessage>(`/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments })
    });
  },

  /**
   * Close a ticket
   */
  async closeTicket(ticketId: string): Promise<CentralResponse<Ticket>> {
    return centralFetch<Ticket>(`/support/tickets/${ticketId}/close`, { method: 'POST' });
  },

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(query: string): Promise<CentralResponse<any[]>> {
    return centralFetch<any[]>(`/support/kb/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Get FAQ for an app
   */
  async getFAQ(appId?: string): Promise<CentralResponse<any[]>> {
    const params = appId ? `?app_id=${appId}` : '';
    return centralFetch<any[]>(`/support/faq${params}`);
  }
};

// ============================================================================
// ENHANCEMENTS SERVICE (Feature Requests & Voting)
// ============================================================================

export const CentralEnhancements = {
  /**
   * Submit a feature request
   */
  async submit(title: string, description: string, category: string, appId?: string): Promise<CentralResponse<Enhancement>> {
    return centralFetch<Enhancement>('/enhancements', {
      method: 'POST',
      body: JSON.stringify({ title, description, category, app_id: appId })
    });
  },

  /**
   * Get all enhancement requests
   */
  async getAll(filters?: { status?: string; category?: string; appId?: string; sort?: 'votes' | 'newest' | 'oldest' }): Promise<CentralResponse<Enhancement[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.appId) params.set('app_id', filters.appId);
    if (filters?.sort) params.set('sort', filters.sort);
    return centralFetch<Enhancement[]>(`/enhancements?${params.toString()}`);
  },

  /**
   * Get single enhancement
   */
  async get(enhancementId: string): Promise<CentralResponse<Enhancement>> {
    return centralFetch<Enhancement>(`/enhancements/${enhancementId}`);
  },

  /**
   * Vote for an enhancement
   */
  async vote(enhancementId: string): Promise<CentralResponse<Enhancement>> {
    return centralFetch<Enhancement>(`/enhancements/${enhancementId}/vote`, { method: 'POST' });
  },

  /**
   * Remove vote
   */
  async unvote(enhancementId: string): Promise<CentralResponse<Enhancement>> {
    return centralFetch<Enhancement>(`/enhancements/${enhancementId}/vote`, { method: 'DELETE' });
  },

  /**
   * Add comment to enhancement
   */
  async comment(enhancementId: string, content: string): Promise<CentralResponse<void>> {
    return centralFetch<void>(`/enhancements/${enhancementId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  /**
   * Get roadmap (planned/in-progress enhancements)
   */
  async getRoadmap(): Promise<CentralResponse<Enhancement[]>> {
    return centralFetch<Enhancement[]>('/enhancements/roadmap');
  }
};

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export const CentralAnalytics = {
  /**
   * Track an event
   */
  async track(event: string, properties?: Record<string, unknown>, appId?: string): Promise<void> {
    try {
      await fetch(`${CENTRAL_API_BASE}/analytics/track`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event, 
          properties, 
          app_id: appId,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          referrer: typeof document !== 'undefined' ? document.referrer : undefined
        })
      });
    } catch (error) {
      console.error('Analytics track error:', error);
    }
  },

  /**
   * Track page view
   */
  async pageView(page: string, appId?: string): Promise<void> {
    await this.track('page_view', { page }, appId);
  },

  /**
   * Track conversion
   */
  async conversion(type: string, value?: number, appId?: string): Promise<void> {
    await this.track('conversion', { type, value }, appId);
  },

  /**
   * Identify user (for analytics platforms)
   */
  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    try {
      await fetch(`${CENTRAL_API_BASE}/analytics/identify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, traits })
      });
    } catch (error) {
      console.error('Analytics identify error:', error);
    }
  }
};

// ============================================================================
// ACTIVITY SERVICE (Audit Trail)
// ============================================================================

export const CentralActivity = {
  /**
   * Log an activity
   */
  async log(action: string, details?: Record<string, unknown>, appId?: string): Promise<void> {
    try {
      await fetch(`${CENTRAL_API_BASE}/activity`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          details, 
          app_id: appId, 
          timestamp: new Date().toISOString() 
        })
      });
    } catch (error) {
      console.error('Activity log error:', error);
    }
  },

  /**
   * Get activity history
   */
  async getHistory(limit: number = 50, appId?: string): Promise<CentralResponse<any[]>> {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (appId) params.set('app_id', appId);
    return centralFetch<any[]>(`/activity?${params.toString()}`);
  }
};

// ============================================================================
// NOTIFICATIONS SERVICE
// ============================================================================

export const CentralNotifications = {
  /**
   * Get user notifications
   */
  async getAll(unreadOnly: boolean = false): Promise<CentralResponse<any[]>> {
    return centralFetch<any[]>(`/notifications${unreadOnly ? '?unread=true' : ''}`);
  },

  /**
   * Mark notification as read
   */
  async markRead(notificationId: string): Promise<CentralResponse<void>> {
    return centralFetch<void>(`/notifications/${notificationId}/read`, { method: 'POST' });
  },

  /**
   * Mark all as read
   */
  async markAllRead(): Promise<CentralResponse<void>> {
    return centralFetch<void>('/notifications/read-all', { method: 'POST' });
  },

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<CentralResponse<any>> {
    return centralFetch<any>('/notifications/preferences');
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: {
    email_marketing?: boolean;
    email_updates?: boolean;
    email_tickets?: boolean;
    push_enabled?: boolean;
  }): Promise<CentralResponse<void>> {
    return centralFetch<void>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  }
};

// ============================================================================
// APP REGISTRY SERVICE
// ============================================================================

export const CentralRegistry = {
  /**
   * Get all apps in the ecosystem
   */
  async getApps(): Promise<CentralResponse<any[]>> {
    return centralFetch<any[]>('/registry/apps');
  },

  /**
   * Get app by ID
   */
  async getApp(appId: string): Promise<CentralResponse<any>> {
    return centralFetch<any>(`/registry/apps/${appId}`);
  },

  /**
   * Report app health
   */
  async reportHealth(appId: string, status: 'healthy' | 'degraded' | 'down', details?: Record<string, unknown>): Promise<void> {
    try {
      await fetch(`${CENTRAL_API_BASE}/registry/health`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          app_id: appId, 
          status, 
          details,
          timestamp: new Date().toISOString() 
        })
      });
    } catch (error) {
      console.error('Health report error:', error);
    }
  },

  /**
   * Get ecosystem status
   */
  async getStatus(): Promise<CentralResponse<any>> {
    return centralFetch<any>('/registry/status');
  }
};

// ============================================================================
// CROSS-SELLING SERVICE
// ============================================================================

export const CentralCrossSell = {
  /**
   * Get recommended apps/products for user
   */
  async getRecommendations(currentAppId: string, limit: number = 5): Promise<CentralResponse<any[]>> {
    return centralFetch<any[]>(`/recommendations?app_id=${currentAppId}&limit=${limit}`);
  },

  /**
   * Track recommendation click
   */
  async trackClick(recommendationId: string, appId: string): Promise<void> {
    await CentralAnalytics.track('recommendation_clicked', { 
      recommendation_id: recommendationId,
      source_app: appId 
    }, appId);
  }
};

// ============================================================================
// EXPORT ALL SERVICES
// ============================================================================

export const CentralServices = {
  // Core Services
  Auth: CentralAuth,
  Credits: CentralCredits,
  Payments: CentralPayments,
  
  // Support & Feedback
  Support: CentralSupport,
  Enhancements: CentralEnhancements,
  
  // Tracking
  Analytics: CentralAnalytics,
  Activity: CentralActivity,
  Notifications: CentralNotifications,
  
  // Platform
  Registry: CentralRegistry,
  CrossSell: CentralCrossSell,
  
  // Utilities
  isAdmin,
  shouldChargeCredits,
  getCreditCost,
  CREDIT_COSTS,
  ADMIN_EMAILS,
  
  // Config
  API_BASE: CENTRAL_API_BASE,
  DOMAIN: CENTRAL_DOMAIN
};

export default CentralServices;
