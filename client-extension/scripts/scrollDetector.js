chrome.storage.local.set({ scrollTime: 0 });

const siteNames = {
  'www.instagram.com': 'Instagram',
  'www.tiktok.com': 'TikTok',
  'www.facebook.com': 'Facebook',
  'www.twitter.com': 'Twitter',
  'www.reddit.com': 'Reddit',
  'www.youtube.com': 'YouTube',
};

const DOOMSCROLL_THRESHOLD_MINUTES = 1;

let hasTriggeredDoomscrollSession = false;

const currentSite =
  siteNames[window.location.hostname] ??
  window.location.hostname ??
  'Unknown site';

chrome.storage.local.set({ currentSite });

let timerStarted = false;
let idleTimer = null;
let countInterval = null;
let elapsedSeconds = 0;

function startDoomscrollTimer() {
  if (timerStarted) return;

  timerStarted = true;
  elapsedSeconds = 0;

  countInterval = window.setInterval(() => {
    elapsedSeconds += 30;
    const minutes = Math.floor(elapsedSeconds / 60);

    chrome.storage.local.set({ scrollTime: minutes });

    if (!hasTriggeredDoomscrollSession && minutes >= DOOMSCROLL_THRESHOLD_MINUTES) {
      hasTriggeredDoomscrollSession = true;
      handleDoomscrollSession(minutes, currentSite);
    }
  }, 30_000);
}

async function handleDoomscrollSession(minutes, site) {
  const { authUserId } = await chrome.storage.local.get(['authUserId']);
  const userId = authUserId || 'shruti-demo';

  chrome.runtime.sendMessage(
    {
      type: 'DOOMSCROLL_DETECTED',
      site,
      minutes,
      userId,
    },
    (response) => {
      showNudgeOverlay({
        username: 'Friend',
        site,
        minutes,
        nudgeText: response?.nudge,
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
  hasTriggeredDoomscrollSession = false;
}

window.addEventListener('scroll', () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    stopDoomscrollTimer();
  }, 5 * 60 * 1000);

  if (!timerStarted) {
    startDoomscrollTimer();
  }
});

function showNudgeOverlay({ username, site, minutes, nudgeText }) {
  if (document.getElementById('ditch-the-scroll-backdrop')) {
    return;
  }

  const readableMinutes = `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const readableSite = site || 'this site';

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

  const card = document.createElement('div');

  Object.assign(card.style, {
    maxWidth: '420px',
    width: '90%',
    backgroundColor: '#FFF7E6',
    color: '#3F2A1A',
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
  });

  const greeting = document.createElement('div');
  greeting.textContent = `Hey ${username},`;
  Object.assign(greeting.style, {
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '4px',
  });

  const message = document.createElement('div');
  message.innerHTML = nudgeText
    ? `${nudgeText}`
    : `You spent <strong>${readableMinutes}</strong> on <strong>${readableSite}</strong>. Let's take a short pause.`;

  const meta = document.createElement('div');
  meta.textContent = `${readableMinutes} on ${readableSite}`;
  Object.assign(meta.style, {
    fontSize: '12px',
    color: '#7A4A24',
  });

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
  });

  function removeOverlay() {
    if (document.body.contains(backdrop)) {
      backdrop.remove();
    }
  }

  primaryButton.addEventListener('click', () => {
    removeOverlay();
  });

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      removeOverlay();
    }
  });

  card.appendChild(greeting);
  card.appendChild(message);
  card.appendChild(meta);
  card.appendChild(primaryButton);

  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  requestAnimationFrame(() => {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0) scale(1)';
  });
}
