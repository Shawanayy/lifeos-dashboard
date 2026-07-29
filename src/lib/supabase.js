import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, anonKey)

// This is a single-user app. This is the one and only user's id everywhere.
export const USER_ID = 'a0000000-0000-0000-0000-000000000001'
