// Phase 2 backend 

import express from 'express';
import cors from 'cors';

// Create the server app and choose a port
const app = express();
const PORT = process.env.PORT || 4000;

// Basic setup so the server can understand JSON and accept requests from our other apps
app.use(cors());
app.use(express.json());


// Simple health-check route to confirm the backend is running
app.get('/', (request, response) => {
    response.send('Ditch The Scroll backend is running');
  });


  // Main place for doomscroll events coming from the browser extension
app.post('/session', (request, response) => {
    // Read information about the doomscroll session from the request body
    const { userId, site, minutes } = request.body || {};
  
    // For now, just log it so we know the connection works end-to-end
    console.log('[Ditch The Scroll] Doomscroll session received:', {
      userId,
      site,
      minutes,
    });
  
    // TODO (later):
    // - Save this session in the database
    // - Decide whether to send a phone nudge
    // - Generate / personalize the nudge message
  
    // Send a simple "OK" response back to the extension
    response.status(200).json({ ok: true });
  });


  // Start the server and listen for incoming requests
app.listen(PORT, () => {
    console.log(`Ditch The Scroll backend listening on port ${PORT}`);
  });