import { createApp } from './app.js';
import { env } from './config/env.js';
import { initFirebase } from './lib/firebase.js';

initFirebase();

const app = createApp();

app.listen(env.port, () => {
  console.log(`Ditch The Scroll server listening on port ${env.port}`);
});
