import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = 'https://gpgdsidmwgtpyiuzarjq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZ2RzaWRtd2d0cHlpdXphcmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5Njg4NTUsImV4cCI6MjA3NjU0NDg1NX0.onjuA5u4TPcgYr0SbuWCg_uj13foqKbcTAZ2LFYnQUI'

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export default supabase
