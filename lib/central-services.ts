/**
 * CR AudioViz AI - Central Services Client
 * =========================================
 * 
 * This file connects ALL apps to centralized services at craudiovizai.com
 * per the Henderson Standard. NO app should implement its own auth, payments,
 * credits, or other centralized services.
 * 
 * USAGE: Copy this file to your app's lib/ directory
 * 
 * @author CR AudioViz AI, LLC
 * @created December 31, 2025
 * @standard Henderson Standard v1.1
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CENTRAL_API = process.env.NEXT_PUBLIC_CENTRAL_API || 'https://craudiovizai.com/api';
const JAVARI_API = process.env.NEXT_PUBLIC_JAVARI_API || 'https://javariai.com/api';
const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'unknown-app';

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  credits_balance?: number;
  subscription_tier?: string;
  created_at?: string;
}

export interface CreditBalance {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

export interface ActivityLog {
  user_id?: string;
  app_id: string;
  action: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Ticket {
  id?: string;
  user_id?: string;
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  status?: string;
}

export interface Enhancement {
  id?: string;
  user_id?: string;
  title: string;
  description: string;
  category?: string;
  votes?: number;
}

export interface Recommendation {
  id: string;
  name: string;
  category: string;
  url: string;
}

// ============================================================================
// AUTHENTICATION (via Central Hub)
// ============================================================================

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<{ user?: User; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, app_id: APP_ID }),
      credentials: 'include',
    });
    return response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * Sign up new user
 */
export async function signUp(
  email: string, 
  password: string, 
  metadata?: Record<string, any>
): Promise<{ user?: User; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, metadata, app_id: APP_ID }),
      credentials: 'include',
    });
    return response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/auth/signout`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get current session/user
 */
export async function getSession(): Promise<{ user?: User; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/auth/user`, {
      credentials: 'include',
    });
    return response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * Sign in with OAuth provider
 */
export function signInWithOAuth(provider: 'google' | 'github' | 'apple'): void {
  const redirectUrl = typeof window !== 'undefined' ? window.location.href : '';
  window.location.href = `${CENTRAL_API}/auth/callback?provider=${provider}&app_id=${APP_ID}&redirect=${encodeURIComponent(redirectUrl)}`;
}

// ============================================================================
// CREDITS SYSTEM (via Central Hub)
// ============================================================================

/**
 * Get user's credit balance
 */
export async function getCreditsBalance(userId: string): Promise<CreditBalance & { error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/credits/balance?user_id=${userId}`);
    return response.json();
  } catch (error) {
    return { balance: 0, lifetime_earned: 0, lifetime_spent: 0, error: String(error) };
  }
}

/**
 * Spend credits for an action
 */
export async function spendCredits(
  userId: string, 
  amount: number, 
  description: string
): Promise<{ success: boolean; new_balance?: number; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/credits/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        amount,
        description,
        app_id: APP_ID,
      }),
    });
    return response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(userId: string, required: number): Promise<boolean> {
  const { balance } = await getCreditsBalance(userId);
  return balance >= required;
}

// ============================================================================
// PAYMENTS (via Central Hub)
// ============================================================================

/**
 * Create Stripe checkout session
 */
export async function createStripeCheckout(options: {
  priceId?: string;
  amount?: number;
  currency?: string;
  description?: string;
  userId?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ url?: string; sessionId?: string; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options,
        app_id: APP_ID,
        success_url: options.successUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/success`,
        cancel_url: options.cancelUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/cancel`,
      }),
    });
    return response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * Create PayPal order
 */
export async function createPayPalOrder(options: {
  amount: number;
  currency?: string;
  description?: string;
  userId?: string;
}): Promise<{ orderId?: string; approvalUrl?: string; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/paypal/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options,
        currency: options.currency || 'USD',
        app_id: APP_ID,
      }),
    });
    return response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * Capture PayPal order
 */
export async function capturePayPalOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/paypal/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID }),
    });
    return response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// SUPPORT TICKETS (via Central Hub)
// ============================================================================

/**
 * Create support ticket
 */
export async function createTicket(ticket: Ticket): Promise<{ id?: string; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...ticket,
        app_id: APP_ID,
      }),
    });
    return response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * Get user's tickets
 */
export async function getTickets(userId: string): Promise<{ tickets: Ticket[]; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/tickets?user_id=${userId}`);
    return response.json();
  } catch (error) {
    return { tickets: [], error: String(error) };
  }
}

// ============================================================================
// ENHANCEMENT REQUESTS (via Central Hub)
// ============================================================================

/**
 * Submit enhancement request
 */
export async function submitEnhancement(enhancement: Enhancement): Promise<{ id?: string; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/enhancements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...enhancement,
        app_id: APP_ID,
      }),
    });
    return response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * Vote for enhancement
 */
export async function voteEnhancement(enhancementId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/enhancements/${enhancementId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    return response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// ACTIVITY LOGGING (via Central Hub)
// ============================================================================

/**
 * Log user activity
 */
export async function logActivity(activity: ActivityLog): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...activity,
        app_id: APP_ID,
      }),
    });
    return response.json();
  } catch (error) {
    // Don't fail silently - log but don't break the app
    console.error('Activity log error:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// CRM (via Central Hub)
// ============================================================================

/**
 * Track customer in CRM
 */
export async function trackCustomer(options: {
  user_id?: string;
  email: string;
  name?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/crm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options,
        app_id: APP_ID,
      }),
    });
    return response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// CROSS-SELLING / RECOMMENDATIONS (via Central Hub)
// ============================================================================

/**
 * Get app recommendations for cross-selling
 */
export async function getRecommendations(options?: {
  userId?: string;
  category?: string;
  limit?: number;
}): Promise<{ recommendations: Recommendation[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.set('app_id', APP_ID);
    if (options?.userId) params.set('user_id', options.userId);
    if (options?.category) params.set('category', options.category);
    if (options?.limit) params.set('limit', String(options.limit));

    const response = await fetch(`${CENTRAL_API}/recommendations?${params}`);
    return response.json();
  } catch (error) {
    return { recommendations: [], error: String(error) };
  }
}

/**
 * Track recommendation click
 */
export async function trackRecommendationClick(
  recommendedAppId: string, 
  userId?: string
): Promise<void> {
  try {
    await fetch(`${CENTRAL_API}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_app_id: APP_ID,
        recommended_app_id: recommendedAppId,
        user_id: userId,
        action: 'click',
      }),
    });
  } catch (error) {
    console.error('Recommendation tracking error:', error);
  }
}

// ============================================================================
// JAVARI AI (via Central Hub)
// ============================================================================

/**
 * Send message to Javari AI
 */
export async function askJavari(
  message: string,
  options?: {
    userId?: string;
    conversationId?: string;
    context?: Record<string, any>;
  }
): Promise<{ response?: string; conversationId?: string; error?: string }> {
  try {
    const response = await fetch(`${JAVARI_API}/javari`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        user_id: options?.userId,
        conversation_id: options?.conversationId,
        context: {
          ...options?.context,
          app_id: APP_ID,
        },
      }),
    });
    return response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

// ============================================================================
// NOTIFICATIONS (via Central Hub)
// ============================================================================

/**
 * Send notification to user
 */
export async function sendNotification(options: {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options,
        app_id: APP_ID,
      }),
    });
    return response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// EMAIL (via Central Hub)
// ============================================================================

/**
 * Send email via central system
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CENTRAL_API}/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options,
        app_id: APP_ID,
      }),
    });
    return response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// ANALYTICS (via Central Hub)
// ============================================================================

/**
 * Track analytics event
 */
export async function trackEvent(
  event: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    await fetch(`${CENTRAL_API}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        properties: {
          ...properties,
          app_id: APP_ID,
        },
      }),
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Auth
  signIn,
  signUp,
  signOut,
  getSession,
  signInWithOAuth,
  // Credits
  getCreditsBalance,
  spendCredits,
  hasEnoughCredits,
  // Payments
  createStripeCheckout,
  createPayPalOrder,
  capturePayPalOrder,
  // Support
  createTicket,
  getTickets,
  submitEnhancement,
  voteEnhancement,
  // Activity
  logActivity,
  // CRM
  trackCustomer,
  // Recommendations
  getRecommendations,
  trackRecommendationClick,
  // Javari
  askJavari,
  // Notifications
  sendNotification,
  // Email
  sendEmail,
  // Analytics
  trackEvent,
};
