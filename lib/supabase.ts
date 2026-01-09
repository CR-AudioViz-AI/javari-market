/**
 * Supabase Compatibility Shim v2.0
 * ================================
 * This file provides FULL backward compatibility for apps that import from @/lib/supabase.
 * All database operations use the CENTRAL CR AudioViz AI Supabase instance.
 * 
 * MIGRATION NOTE: Apps should eventually migrate to using central-services.ts API calls
 * instead of direct database access. This shim exists to prevent build failures.
 * 
 * @version 2.0.0
 * @standard Henderson Standard v1.1
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Central platform Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Singleton instances
let browserClient: SupabaseClient | null = null
let serverClient: SupabaseClient | null = null

// ============================================================================
// STANDARD CLIENTS
// ============================================================================

/**
 * Standard Supabase client for general use
 * Uses anon key - respects RLS policies
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Admin client for server-side operations
 * Uses service role key - bypasses RLS (use carefully!)
 */
export const supabaseAdmin: SupabaseClient = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase

// ============================================================================
// CLIENT FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new Supabase client (zero-argument version)
 * Used by pages that import { createClient } from '@/lib/supabase'
 */
export function createSupabaseClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/**
 * Alias for createSupabaseClient
 */
export { createSupabaseClient as createClient }

/**
 * Browser client with auth persistence (singleton)
 * Use for client-side auth operations
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side: return new client each time
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  
  // Client-side: return singleton for performance
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return browserClient
}

/**
 * Server client for API routes
 * Uses service role key if available
 */
export function createSupabaseServerClient(): SupabaseClient {
  if (!serverClient) {
    const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
    serverClient = createClient(SUPABASE_URL, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return serverClient
}

/**
 * Get Supabase admin client (for API routes)
 */
export function getSupabaseAdmin(): SupabaseClient {
  return supabaseAdmin
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Common types that apps might expect
export type Book = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  tags: string[]
  price: number
  is_free: boolean
  storage_path: string
  audio_path?: string
  created_at: string
  word_count?: number
  chapter_count?: number
}

export type Card = {
  id: string
  name: string
  set_name: string
  card_number: string
  rarity: string
  image_url?: string
  market_price?: number
  condition?: string
  grade?: string
  grading_company?: string
  user_id?: string
  created_at: string
}

export type UserProfile = {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
  created_at: string
}

// ============================================================================
// EXPORTS
// ============================================================================

export { SUPABASE_URL, SUPABASE_ANON_KEY }

// Default export for ESM compatibility
export default supabase
