const API_BASE_URL = 'http://localhost:4000';

async function syncUser({ userId, email = 'extension-user@ditchthescroll.app' }) {
  try {
    await fetch(`${API_BASE_URL}/auth/sync-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, email }),
    });
  } catch (error) {
    console.error('Failed to sync user:', error);
  }
}

async function postActivity({ userId, mood = null }) {
  try {
    await fetch(`${API_BASE_URL}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        mood,
        lastActive: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to post activity:', error);
  }
}

async function fetchNudge({ userId, site, minutes, triggerType = 'doomscroll' }) {
  const params = new URLSearchParams({
    userId,
    site,
    minutes: String(minutes),
    triggerType,
  });

  const response = await fetch(`${API_BASE_URL}/nudges?${params.toString()}`);
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
