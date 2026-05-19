// app/api/sentiment/route.ts
// Twitter/X Sentiment Analysis API for Market Oracle
// Powered by xAI Grok-4 with real-time Twitter access
// Created: December 25, 2025

import { NextRequest, NextResponse } from 'next/server'
import {

function getSupabase() {
  var sb = require('@supabase/supabase-js')
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return sb.createClient(url, key, { auth: { persistSession: false } })
}
