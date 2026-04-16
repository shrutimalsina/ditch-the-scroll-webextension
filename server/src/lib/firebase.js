import admin from 'firebase-admin';

let initialized = false;

export function initFirebase() {
  if (initialized) return;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) return;

  const credentials = JSON.parse(json);
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });

  initialized = true;
}

export async function sendPushNotification({ token, title, body, data = {} }) {
  if (!initialized || !token) {
    return { sent: false, reason: 'Firebase not configured or token missing' };
  }

  const message = {
    token,
    notification: { title, body },
    data,
  };

  const response = await admin.messaging().send(message);
  return { sent: true, response };
}
