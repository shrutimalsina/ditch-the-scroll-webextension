// Background script for Ditch The Scroll
// This will send doomscroll sessions to the backend when the extension decides it's time.

// Helper: send a doomscroll session to the backend server
async function sendDoomscrollSession({ userId, site, minutes }) {
    try {
      const response = await fetch('http://localhost:4000/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, site, minutes }),
      });
  
      if (!response.ok) {
        console.error('Failed to send doomscroll session to backend', response.status);
        return;
      }
  
      const data = await response.json();
      console.log('Backend acknowledged doomscroll session:', data);
    } catch (error) {
      console.error('Error sending doomscroll session to backend:', error);
    }
  }
  
  // TEMPORARY: simple test hook so we can verify things work.
  // You can delete or change this once your real doomscroll detection is hooked up.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DOOMSCROLL_DETECTED') {
      const { site, minutes, userId = 'shruti-demo' } = message;
  
      console.log('Background got doomscroll message:', { site, minutes, userId });
  
      sendDoomscrollSession({ userId, site, minutes });
      sendResponse({ ok: true });
    }
  });