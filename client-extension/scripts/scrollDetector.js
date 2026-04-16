chrome.storage.local.set({ scrollTime: 0 })

const siteNames = {
  'www.instagram.com': 'Instagram',
  'www.tiktok.com': 'TikTok',
  'www.facebook.com': 'Facebook',
  'www.twitter.com': 'Twitter',
  'www.reddit.com': 'Reddit',
  'www.youtube.com': 'YouTube'
}

const DOOMSCROLL_THRESHOLD_MINUTES = 1; // how many minutes of scrolling before i say "this is doomscrolling"

let hasTriggeredDoomscrollSession = false; // have i already handled this doomscroll session?

const currentSite =
  siteNames[window.location.hostname] ??
  window.location.hostname ??
  'Unknown site';

chrome.storage.local.set({ currentSite });

let timerStarted = false; // no timer has started when first loaded
let idleTimer = null; // to see if user is idle or not
let countInterval = null;
let elapsedSeconds = 0;

function startDoomscrollTimer() {
  if (timerStarted)
    return;

  console.log('Doomscrolling started');
  timerStarted = true;
  elapsedSeconds = 0;

  // every 30 seconds, increasing the elapsed time and update minutes in storage
  countInterval = window.setInterval(() => {
    elapsedSeconds += 30;
    const minutes = Math.floor(elapsedSeconds / 60);
    console.log('Doomscroll minutes:', minutes);

    chrome.storage.local.set({ scrollTime: minutes });

    // if the threshold is crossed and have not handled it yet, trigger once
    if (!hasTriggeredDoomscrollSession && minutes >= DOOMSCROLL_THRESHOLD_MINUTES) {
      hasTriggeredDoomscrollSession = true;
      handleDoomscrollSession(minutes, currentSite);
    }
  }, 30_000);

  // after 45 real minutes, i trigger a “big nudge” hook
  const FORTY_FIVE_MINUTES_MS = 45 * 60 * 1000;
  window.setTimeout(() => {
    console.log('Doomscrolled for 45 minutes!');
    // later i can send another message or show a different UI here
    // chrome.runtime.sendMessage({ type: 'DOOMSCROLL_45_MIN' });
  }, FORTY_FIVE_MINUTES_MS);
}

function handleDoomscrollSession(minutes, site) {
  console.log(
    `[Ditch The Scroll] Doomscroll session detected: ${site} for ${minutes} mins`
  );

  // i tell the background script so it can call the backend
  chrome.runtime.sendMessage(
    {
      type: 'DOOMSCROLL_DETECTED',
      site,
      minutes,
      userId: 'shruti-demo', // temporary hardcoded user id
    },
    (response) => {
      // log the raw response for debugging
      console.log('Background responded to doomscroll message:', response);

      // show the overlay when a doomscroll session is detected
      showNudgeOverlay({
        username: 'Shruti', // demo username for now
        site,
        minutes,
      });

    }
  );
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

// user scrolls → i consider them "active"
window.addEventListener('scroll', () => {
  console.log('Scrolling detected');

  // i reset the idle timer every time the user scrolls
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    // no scroll for 5 minutes → i stop tracking
    stopDoomscrollTimer();
  }, 5 * 60 * 1000); // 5 minutes

  // if the timer has not started yet, i start it
  if (!timerStarted) {
    startDoomscrollTimer();
  }
});

// helper: show a small nudge banner on the page with the given message
function showNudgeOverlay({ username, site, minutes }) {
  // avoided creating multiple overlays if one already exists
  if (document.getElementById('ditch-the-scroll-backdrop')) {
    return;
  }
  const readableMinutes = `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const readableSite = site || 'this site';

  // i create a full-screen backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'ditch-the-scroll-backdrop';

  Object.assign(backdrop.style, {
    position: 'fixed',
    inset: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '2147483647',
  });

  // creating the centered card
  const card = document.createElement('div');

  // initial state for entrance animation
  Object.assign(card.style, {
    maxWidth: '420px',
    width: '90%',
    backgroundColor: '#FFF7E6', // light warm beige
    color: '#3F2A1A', // dark warm text
    borderRadius: '16px',
    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.35)',
    padding: '20px 22px 18px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    opacity: '0',
    transform: 'translateY(12px) scale(0.97)',
    transition: 'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    overflow: 'hidden',
  });

  // small decorative blob scattered around the card
  function createBlob({ top, right, bottom, left, size, opacity }) {
    const b = document.createElement('div');
    Object.assign(b.style, {
      position: 'absolute',
      borderRadius: '999px',
      background: 'radial-gradient(circle at 30% 30%, #FDBA74, #F97316)',
      opacity: String(opacity),
      width: `${size}px`,
      height: `${size}px`,
      pointerEvents: 'none',
    });
    if (top !== undefined) b.style.top = `${top}px`;
    if (right !== undefined) b.style.right = `${right}px`;
    if (bottom !== undefined) b.style.bottom = `${bottom}px`;
    if (left !== undefined) b.style.left = `${left}px`;
    return b;
  }

  // main large blob (top-right, like before)
  const blobMain = createBlob({
    top: -12,
    right: -12,
    size: 64,
    opacity: 0.22,
  });

  // smaller blobs in a few other spots
  const blobSmallTopLeft = createBlob({
    top: -16,
    left: 24,
    size: 32,
    opacity: 0.16,
  });

  const blobSmallBottomLeft = createBlob({
    bottom: -10,
    left: -10,
    size: 48,
    opacity: 0.18,
  });

  const blobTinyBottomRight = createBlob({
    bottom: 12,
    right: 40,
    size: 20,
    opacity: 0.14,
  });

  // header row with tiny label
  const headerRow = document.createElement('div');
  Object.assign(headerRow.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#7A4A24',
  });

  const headerDot = document.createElement('span');
  Object.assign(headerDot.style, {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    background: '#F97316',
    display: 'inline-block',
  });

  const headerText = document.createElement('span');
  headerText.textContent = 'Ditch The Scroll';

  headerRow.appendChild(headerDot);
  headerRow.appendChild(headerText);

  // greeting
  const greeting = document.createElement('div');
  greeting.textContent = `Hey ${username},`;
  Object.assign(greeting.style, {
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '4px',
  });

  // main message
  const message = document.createElement('div');
  message.innerHTML = `Didn’t realize you spent <strong>${readableMinutes}</strong> on <strong>${readableSite}</strong>, did you?<br/>It’s time for <strong>A NUDGE</strong>.`;
  Object.assign(message.style, {
    fontSize: '14px',
    lineHeight: '1.5',
    marginTop: '4px',
  });

  // primary button
  const primaryButton = document.createElement('button');
  primaryButton.textContent = 'Checking my phone now!';
  Object.assign(primaryButton.style, {
    marginTop: '12px',
    padding: '10px 14px',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: '#F97316',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    boxShadow: '0 8px 16px rgba(249, 115, 22, 0.35)',
    transition: 'transform 140ms ease-out, box-shadow 140ms ease-out',
  });

  primaryButton.addEventListener('mouseenter', () => {
    primaryButton.style.transform = 'translateY(-1px) scale(1.02)';
    primaryButton.style.boxShadow = '0 10px 22px rgba(249, 115, 22, 0.45)';
  });

  primaryButton.addEventListener('mouseleave', () => {
    primaryButton.style.transform = 'translateY(0) scale(1)';
    primaryButton.style.boxShadow = '0 8px 16px rgba(249, 115, 22, 0.35)';
  });

  // reactions row
  const reactionsRow = document.createElement('div');
  Object.assign(reactionsRow.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
    fontSize: '12px',
  });

  function createReactionChip(text) {
    const chip = document.createElement('button');
    chip.textContent = text;
    Object.assign(chip.style, {
      borderRadius: '999px',
      border: 'none',
      padding: '6px 10px',
      backgroundColor: '#FFE4C4',
      color: '#3F2A1A',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
    });
    return chip;
  }

  const reactionTooSoon = createReactionChip('Really that fast?');
  const reactionExpected = createReactionChip('I was expecting it now');

  reactionsRow.appendChild(reactionTooSoon);
  reactionsRow.appendChild(reactionExpected);

  // helper: remove the overlay cleanly
  function removeOverlay() {
    if (document.body.contains(backdrop)) {
      backdrop.remove();
    }
  }

  // main button click handler
  primaryButton.addEventListener('click', () => {
    console.log('[Ditch The Scroll] Primary nudge accepted (checking phone now).');
    removeOverlay();
  });

  // reactions click handlers
  reactionTooSoon.addEventListener('click', () => {
    console.log('[Ditch The Scroll] Reaction: TOO_SOON (Really that fast?).');
    removeOverlay();
  });

  reactionExpected.addEventListener('click', () => {
    console.log('[Ditch The Scroll] Reaction: EXPECTED (I was expecting it now).');
    removeOverlay();
  });

  // close overlay when clicking backdrop (optional, feels natural)
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      console.log('[Ditch The Scroll] Overlay dismissed by clicking backdrop.');
      removeOverlay();
    }
  });

  // assemble the card
  card.appendChild(blobMain);
  card.appendChild(blobSmallTopLeft);
  card.appendChild(blobSmallBottomLeft);
  card.appendChild(blobTinyBottomRight);
  card.appendChild(headerRow);
  card.appendChild(greeting);
  card.appendChild(message);
  card.appendChild(primaryButton);
  card.appendChild(reactionsRow);

  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  // run entrance animation on next frame
  requestAnimationFrame(() => {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0) scale(1)';
  });
}
