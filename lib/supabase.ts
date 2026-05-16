// lib/supabase.ts — Platform Standard
import { createClient as supabaseCreateClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => supabaseCreateClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const supabaseAdmin = supabaseCreateClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
)

export function createServerClient() {
  return createServerComponentClient({ cookies })
}

export async function getUser(supabase?: ReturnType<typeof createClient>) {
  const client = supabase ?? createClient()
  const { data: { user } } = await client.auth.getUser()
  return user
}

export async function getSession(supabase?: ReturnType<typeof createClient>) {
  const client = supabase ?? createClient()
  const { data: { session } } = await client.auth.getSession()
  return session
}

export function shouldChargeCredits(email?: string | null): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? 'royhenderson@craudiovizai.com').split(',')
  return !admins.includes(email ?? '')
}

export function isAdmin(email?: string | null): boolean {
  return !shouldChargeCredits(email)
}
