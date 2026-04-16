const DEFAULT_API_BASE_URL = 'http://localhost:4000';

function normalizeApiBaseUrl(value) {
  if (typeof value !== 'string') return DEFAULT_API_BASE_URL;
  return value.trim().replace(/\/+$/, '') || DEFAULT_API_BASE_URL;
}

async function getApiBaseUrl() {
  try {
    const { apiBaseUrl } = await chrome.storage.local.get(['apiBaseUrl']);
    return normalizeApiBaseUrl(apiBaseUrl);
  } catch (error) {
    console.warn('Unable to read apiBaseUrl from extension storage. Using default URL.', error);
    return DEFAULT_API_BASE_URL;
  }
}

async function syncUser({ userId, email = 'extension-user@ditchthescroll.app' }) {
  try {
    const apiBaseUrl = await getApiBaseUrl();
    const syncResponse = await fetch(`${apiBaseUrl}/auth/sync-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, email }),
    });

    if (!syncResponse.ok) {
      throw new Error(
        `sync-user failed with status ${syncResponse.status} ${syncResponse.statusText || ''}`.trim(),
      );
    }
  } catch (error) {
    console.error('Failed to sync user:', error);
  }
}

async function postActivity({ userId, mood = null }) {
  try {
    const apiBaseUrl = await getApiBaseUrl();
    const activityResponse = await fetch(`${apiBaseUrl}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        mood,
        lastActive: new Date().toISOString(),
      }),
    });

    if (!activityResponse.ok) {
      throw new Error(
        `activity failed with status ${activityResponse.status} ${activityResponse.statusText || ''}`.trim(),
      );
    }
  } catch (error) {
    console.error('Failed to post activity:', error);
  }
}

async function fetchNudge({ userId, site, minutes, triggerType = 'doomscroll' }) {
  const apiBaseUrl = await getApiBaseUrl();
  const params = new URLSearchParams({
    userId,
    site,
    minutes: String(minutes),
    triggerType,
  });

  const response = await fetch(`${apiBaseUrl}/nudges?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Nudge fetch failed with status ${response.status}`);
  }

  const data = await response.json();
  return data?.nudge;
}

function clearNudgeBadge() {
  chrome.action.setBadgeText({ text: '' });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'DOOMSCROLL_DETECTED') {
    const { site, minutes, userId = 'shruti-demo' } = message;

    (async () => {
      try {
        await syncUser({ userId });
        await postActivity({ userId });
        const nudge = await fetchNudge({ userId, site, minutes, triggerType: 'doomscroll' });

        chrome.action.setBadgeText({ text: '1' });
        chrome.action.setBadgeBackgroundColor({ color: '#FACC15' });

        sendResponse({ ok: true, nudge: nudge?.message || 'Take a short break, you deserve it.' });
      } catch (error) {
        console.error('Error handling doomscroll nudge flow:', error);
        sendResponse({ ok: false });
      }
    })();

    return true;
  }

  if (message.type === 'NUDGE_DISMISSED') {
    sendResponse({ ok: true });
    return;
  }

  if (message.type === 'POPUP_OPENED') {
    clearNudgeBadge();
    sendResponse({ ok: true });
  }
});
