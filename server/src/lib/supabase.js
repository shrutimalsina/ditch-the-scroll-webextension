import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let client = null;

export function getSupabaseAdmin() {
  if (client) return client;

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }

  client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
  return client;
}
