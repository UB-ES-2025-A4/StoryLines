import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// =======================================
// VARIABLES A EXPORTAR
// (las rellenamos según el entorno)
// =======================================
let supabase;
let supabaseAdmin;

// =======================================
// MODO TEST → usar MOCK
// =======================================
if (process.env.NODE_ENV === 'test') {
  console.log("[SUPABASE MOCK] Cliente mock activo durante tests");

  const mockClient = {
    from() {
      return {
        select() { return { data: [], error: null }; },
        insert() { return { data: [], error: null }; },
        update() { return { data: [], error: null }; },
        delete() { return { data: [], error: null }; },
        eq() { return this; },
        neq() { return this; },
        limit() { return this; },
        single() { return { data: null, error: null }; },
        maybeSingle() { return { data: null, error: null }; }
      };
    },
    auth: {
      admin: {
        listUsers() {
          return { data: { users: [] }, error: null };
        }
      }
    }
  };

  supabase = mockClient;
  supabaseAdmin = mockClient;

} else {
  // =======================================
  // MODO NORMAL (DEV / PROD)
  // =======================================
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
}

// =======================================
// EXPORTS FINALES (válido siempre)
// =======================================
export { supabase, supabaseAdmin };
export default supabase;
