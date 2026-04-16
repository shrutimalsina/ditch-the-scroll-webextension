import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient({ supabaseUrl, supabaseAnonKey, storage }) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are missing.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage,
    },
  });
}
