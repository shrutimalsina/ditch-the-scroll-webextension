// background script for Ditch The Scroll
// this will send doomscroll sessions to the backend when the extension decides it is time,
// and then pass back any nudge text to the content script

// helper: send a doomscroll session to the backend server and return the response JSON
async function sendDoomscrollSession({ userId, site, minutes }) {
  try {
    // send a POST request to the backend /session endpoint
    const response = await fetch('http://localhost:4000/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, site, minutes }),
    });

    // if the response status is not in the 2xx range, i log an error and stop
    if (!response.ok) {
      console.error('Failed to send doomscroll session to backend', response.status);
      return null;
    }

    // parse the JSON body returned by the backend
    const data = await response.json();

    // log the full response for debugging
    console.log('Backend acknowledged doomscroll session:', data);

    // return the parsed JSON so the caller can use it
    return data;
  } catch (error) {
    // log any network or fetch errors
    console.error('Error sending doomscroll session to backend:', error);
    return null;
  }
}

// helper: clear the badge on the extension icon
function clearNudgeBadge() {
  chrome.action.setBadgeText({ text: '' });
}


// listener: handle messages from content scripts or the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // only handle messages that describe a detected doomscroll session
  if (message.type === 'DOOMSCROLL_DETECTED') {
    const { site, minutes, userId = 'shruti-demo' } = message;

    // log that the background received this event
    console.log('Background got doomscroll message:', { site, minutes, userId });

    // wrap the async logic so can call sendResponse later
    (async () => {
      // forward the data to the backend server and wait for its response
      const data = await sendDoomscrollSession({ userId, site, minutes });

      if (data && data.nudge) {
        //for debugging
        console.log('Nudge from backend:', data.nudge);

        // settinf a small badge on the extension icon so it is clear something changed
        chrome.action.setBadgeText({ text: '1' });
        chrome.action.setBadgeBackgroundColor({ color: '#FACC15' }); // warm yellow


        // send the nudge back to the content script
        sendResponse({ ok: true, nudge: data.nudge });
      } else {
        // if something went wrong, indicate failure
        sendResponse({ ok: false });
      }
    })();

    // return true to indicate that will respond asynchronously
    return true;
  }

  if (message.type === 'NUDGE_DISMISSED') {
    // i might log this later, but i do NOT clear the badge here
    console.log('Nudge was dismissed on page (badge stays).');
    sendResponse({ ok: true });
    return;
  }

  if (message.type === 'POPUP_OPENED') {
    // the user explicitly opened the extension → i clear the badge
    clearNudgeBadge();
    sendResponse({ ok: true });
    return;
  }

  // other message types: no special handling
});