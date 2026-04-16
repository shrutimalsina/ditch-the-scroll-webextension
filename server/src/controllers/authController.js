import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '../lib/supabase.js';

export async function syncUser(req, res) {
  const { id, email } = req.body || {};

  if (!email) {
    return res.status(400).json({ ok: false, error: 'email is required' });
  }

  const userId = id || randomUUID();
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return res.status(200).json({
      ok: true,
      user: { id: userId, email },
      warning: 'Supabase is not configured. Returning mock sync response.',
    });
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId, email }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, user: data });
}
