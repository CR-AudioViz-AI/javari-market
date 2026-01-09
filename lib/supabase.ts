/**
 * Supabase Compatibility Shim
 * ===========================
 * This file provides backward compatibility for apps that still import from @/lib/supabase.
 * All calls are routed through the central CR AudioViz AI platform.
 * 
 * MIGRATION NOTE: Eventually, all code should be updated to use central-services.ts directly.
 * This shim exists to prevent build failures during the transition.
 */

import { createClient } from '@supabase/supabase-js'

// Use central platform's Supabase instance
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Standard client for frontend use
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Admin client for server-side operations (API routes only)
export const supabaseAdmin = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : supabase

// Export createClient for backwards compatibility
export function createSupabaseClient() {
  return supabase
}

export { SUPABASE_URL, SUPABASE_ANON_KEY }

// Book type for javari-books
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
