import { getSupabaseAdmin } from '../lib/supabase.js';

export async function upsertActivity(req, res) {
  const { userId, mood = null, lastActive = new Date().toISOString() } = req.body || {};

  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId is required' });
  }

  const supabase = getSupabaseAdmin();
  const activity = {
    user_id: userId,
    mood,
    last_active: lastActive,
  };

  if (!supabase) {
    return res.status(200).json({ ok: true, activity, warning: 'Supabase is not configured.' });
  }

  const { data, error } = await supabase
    .from('user_activity')
    .upsert(activity, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, activity: data });
}
