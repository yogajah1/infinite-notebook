import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

export interface CloudNotebook {
  id: string
  user_id: string
  title: string
  description?: string
  tags: string[]
  is_pinned?: boolean
  created_at: number
  updated_at: number
}

export interface CloudCanvasRecord {
  notebook_id: string
  user_id: string
  snapshot: unknown
  updated_at: number
}
