// Phase 2 and Phase 3 backend

import express from 'express';
import cors from 'cors';

// create the server app and choose a port
const app = express();
const PORT = process.env.PORT || 4000;

// basic setup so the server can understand JSON and accept requests from other apps
app.use(cors());
app.use(express.json());

// simple health-check route to confirm the backend is running
app.get('/', (request, response) => {
  response.send('Ditch The Scroll backend is running');
});

// helper: build a nudge message based on site + minutes
function buildNudgeMessage({ site, minutes }) {
  // i make sure there is always some site name to show
  const readableSite = site || 'this site';

  // i adjust the tone based on how long the session has been
  if (minutes >= 45) {
    return `That is ${minutes} minutes on ${readableSite}. Time for a serious reset?`;
  }

  if (minutes >= 15) {
    return `${minutes} minutes on ${readableSite} already. How about a water or stretch break?`;
  }

  if (minutes >= 5) {
    return `The scroll on ${readableSite} is strong today. Want to close this tab for a bit?`;
  }

  // default for shorter sessions over the doomscroll threshold
  return `That was ${minutes} minutes on ${readableSite}. Tiny pause, big difference.`;
}

// main place for doomscroll events coming from the browser extension
app.post('/session', (request, response) => {
  // i read information about the doomscroll session from the request body
  const { userId, site, minutes } = request.body || {};

  // i log it so i know the connection works end-to-end
  console.log('[Ditch The Scroll] Doomscroll session received:', {
    userId,
    site,
    minutes,
  });

  // i build a nudge message for this specific session
  const nudge = buildNudgeMessage({ site, minutes });

  // i send an "ok" response and include the nudge text for the extension
  response.status(200).json({
    ok: true,
    nudge,
  });
});

// start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Ditch The Scroll backend listening on port ${PORT}`);
});