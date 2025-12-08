import { createClient } from '@supabase/supabase-js'

// Fetch config from backend
const configResponse = await fetch('/api/config/supabase')
const config = await configResponse.json()

export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export default supabase
