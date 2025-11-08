import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Calculate gain percentage
export function calculateGainPercentage(entry: number, target: number): number {
  return ((target - entry) / entry) * 100
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

// Get AI color
export function getAIColor(aiName: string): { primary: string, secondary: string } {
  const colors: Record<string, { primary: string, secondary: string }> = {
    'javari': { primary: '#9333EA', secondary: '#EC4899' },
    'claude': { primary: '#F97316', secondary: '#EF4444' },
    'gpt-4': { primary: '#10B981', secondary: '#059669' },
    'gemini': { primary: '#3B82F6', secondary: '#06B6D4' },
    'perplexity': { primary: '#6366F1', secondary: '#8B5CF6' }
  }
  
  const key = aiName.toLowerCase().replace(/\s+/g, '-')
  return colors[key] || { primary: '#6B7280', secondary: '#9CA3AF' }
}

// Format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

// Format time ago
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return formatDate(dateString)
}
