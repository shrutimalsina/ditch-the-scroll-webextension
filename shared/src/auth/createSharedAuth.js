import { createSupabaseClient } from '../supabase/createSupabaseClient.js';

export function createSharedAuth({ supabaseUrl, supabaseAnonKey, storage }) {
  const client = createSupabaseClient({
    supabaseUrl,
    supabaseAnonKey,
    storage,
  });

  return {
    client,
    signUp: ({ email, password }) => client.auth.signUp({ email, password }),
    signIn: ({ email, password }) =>
      client.auth.signInWithPassword({ email, password }),
    signOut: () => client.auth.signOut(),
    getSession: () => client.auth.getSession(),
    onAuthStateChange: (callback) => client.auth.onAuthStateChange(callback),
  };
}
