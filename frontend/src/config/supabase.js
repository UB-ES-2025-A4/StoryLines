import { createClient } from '@supabase/supabase-js'

let supabaseClient = null
let configPromise = null

// Initialize config fetch
const initConfig = () => {
  if (!configPromise) {
    configPromise = fetch('/api/config/supabase')
      .then(res => res.json())
      .then(config => {
        supabaseClient = createClient(config.url, config.anonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        })
        return supabaseClient
      })
      .catch(error => {
        console.error('Failed to load Supabase config:', error)
        throw error
      })
  }
  return configPromise
}

// Start initialization immediately
initConfig()

// Export function that returns initialized client
export const getSupabase = async () => {
  if (supabaseClient) return supabaseClient
  return await initConfig()
}

// For backward compatibility - will be null initially
export let supabase = supabaseClient

// Update supabase export when ready
initConfig().then(client => {
  supabase = client
})

export default supabase
