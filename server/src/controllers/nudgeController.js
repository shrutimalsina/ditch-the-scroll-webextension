import { createNudge } from '@ditch-the-scroll/shared';
import { getSupabaseAdmin } from '../lib/supabase.js';

export async function getNudge(req, res) {
  const { userId, triggerType, site, minutes } = req.query;
  const supabase = getSupabaseAdmin();

  let mood = null;
  let lastActive = null;
  let userName = null;

  if (supabase && userId) {
    const [activityResult, userResult] = await Promise.all([
      supabase
        .from('user_activity')
        .select('mood,last_active')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    mood = activityResult.data?.mood ?? null;
    lastActive = activityResult.data?.last_active ?? null;
    userName = userResult.data?.email?.split('@')[0] ?? null;
  }

  const generated = createNudge({
    triggerType,
    mood,
    lastActive,
    userName,
    site,
    minutes: minutes ? Number(minutes) : undefined,
  });

  let dbNudge = null;
  if (supabase && generated.triggerType) {
    const { data } = await supabase
      .from('nudges')
      .select('message,action')
      .eq('trigger_type', generated.triggerType)
      .limit(1)
      .maybeSingle();

    if (data?.message) {
      dbNudge = {
        ...generated,
        message: data.message,
        action: data.action || generated.action,
      };
    }
  }

  return res.status(200).json({
    ok: true,
    nudge: dbNudge ?? generated,
  });
}
