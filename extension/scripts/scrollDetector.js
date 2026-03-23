chrome.storage.local.set({ scrollTime: 0 })

const siteNames = {
    'www.instagram.com': 'Instagram',
    'www.tiktok.com': 'TikTok',
    'www.facebook.com': 'Facebook',
    'www.twitter.com': 'Twitter',
    'www.reddit.com': 'Reddit',
    'www.youtube.com': 'YouTube'
  }


const DOOMSCROLL_THRESHOLD_MINUTES = 2; // How many minutes of scrolling before we say "this is doomscrolling"

let hasTriggeredDoomscrollSession = false; // Have we already handled this doomscroll session?

const currentSite =
  siteNames[window.location.hostname] ??
  window.location.hostname ??
  'Unknown site';

chrome.storage.local.set({ currentSite });

let timerStarted = false //no timer has started when first loaded
let idleTimer = null //to see if use is idle or not?
let countInterval = null
let elapsedSeconds = 0;

function startDoomscrollTimer(){
    if (timerStarted)
        return;

    console.log('Doomscrolling started');
    timerStarted = true;
    elapsedSeconds = 0;

    // Every 30 seconds, increase elapsed time and update minutes in storage
  countInterval = window.setInterval(() => {
    elapsedSeconds += 30;
    const minutes = Math.floor(elapsedSeconds / 60);
    console.log('Doomscroll minutes:', minutes);

    chrome.storage.local.set({ scrollTime: minutes });

    // If we crossed the threshold and haven't handled it yet, trigger once
    if (!hasTriggeredDoomscrollSession && minutes >= DOOMSCROLL_THRESHOLD_MINUTES) {
      hasTriggeredDoomscrollSession = true;
      handleDoomscrollSession(minutes, currentSite);
      }
    }, 30_000);

  // After 45 real minutes, trigger your “big nudge”
  const FORTY_FIVE_MINUTES_MS = 45 * 60 * 1000;
  window.setTimeout(() => {
    console.log('Doomscrolled for 45 minutes!');
    // Trigger something here later, but DO NOT touch scrollTime
    // Example: send a message to background or show UI
    // chrome.runtime.sendMessage({ type: 'DOOMSCROLL_45_MIN' });
  }, FORTY_FIVE_MINUTES_MS);
}

function handleDoomscrollSession(minutes, site){
  console.log(
    `[Ditch The Scroll] Doomscroll session detected: ${site} for ${minutes} mins`
  );
  // // Later: we will send this to backend so phone can show a nudge like fetch('https://your-backend-url/session', { ... })


// Tell the background script so it can call the backend
chrome.runtime.sendMessage(
  {
    type: 'DOOMSCROLL_DETECTED',
    site,
    minutes,
    userId: 'shruti-demo', // temporary hardcoded user id
  },
  (response) => {
    console.log('Background responded to doomscroll message:', response);
  }
);
// Later: we will send this to backend so phone can show a nudge like fetch('https://your-backend-url/session', { ... })
}

function stopDoomscrollTimer() {
  if (countInterval) {
    clearInterval(countInterval);
    countInterval = null;
  }
  timerStarted = false;
  elapsedSeconds = 0;
  hasTriggeredDoomscrollSession = false; // reset for next session
  console.log('Doomscrolling paused (idle for 5 minutes)');
}

// User scrolls → we consider them "active"
window.addEventListener('scroll', () => {
  console.log('Scrolling detected');

  // Reset idle timer every time they scroll
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    // No scroll for 5 minutes → stop tracking
    stopDoomscrollTimer();
  }, 5 * 60 * 1000); // 5 minutes

  // If timer hasn't started yet, start it
  if (!timerStarted) {
    startDoomscrollTimer();
  }
});
