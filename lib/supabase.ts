// lib/supabase.ts — CR AudioViz AI Platform Standard  May 16 2026
import { createClient as _create } from "@supabase/supabase-js"
const URL=process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC=process.env.SUPABASE_SERVICE_ROLE_KEY??ANON
export const supabase=_create(URL,ANON)
export const supabaseAdmin=_create(URL,SVC,{auth:{persistSession:false}})
export const createClient=()=>_create(URL,ANON)
export async function getUser(c?:ReturnType<typeof createClient>){const{data:{user}}=await(c??supabase).auth.getUser();return user}
export async function getSession(c?:ReturnType<typeof createClient>){const{data:{session}}=await(c??supabase).auth.getSession();return session}
export async function logActivity(p:{userId?:string;action:string;details?:Record<string,unknown>;appId?:string}){try{await supabaseAdmin.from("activity_log").insert({user_id:p.userId??"anon",action:p.action,details:p.details??{},app_id:p.appId??"javari",created_at:new Date().toISOString()})}catch{}}
export async function getPartnerByUserId(userId:string){const{data}=await supabaseAdmin.from("partners").select("*").eq("user_id",userId).single();return data}
export function shouldChargeCredits(email?:string|null){return!["royhenderson@craudiovizai.com","cindyhenderson@craudiovizai.com"].includes(email??"")}
export function isAdmin(email?:string|null){return!shouldChargeCredits(email)}
