import { sendPushNotification } from '../lib/firebase.js';

const tokensByUser = new Map();

export async function registerPushToken(req, res) {
  const { userId, token } = req.body || {};

  if (!userId || !token) {
    return res.status(400).json({ ok: false, error: 'userId and token are required' });
  }

  tokensByUser.set(userId, token);
  return res.status(200).json({ ok: true });
}

export async function sendNudgePush(req, res) {
  const { userId, message } = req.body || {};

  if (!userId || !message) {
    return res.status(400).json({ ok: false, error: 'userId and message are required' });
  }

  const token = tokensByUser.get(userId);
  const result = await sendPushNotification({
    token,
    title: 'Ditch The Scroll',
    body: message,
    data: { type: 'nudge' },
  });

  return res.status(200).json({ ok: true, result });
}
