PHASE 1: Real‑Time Doomscroll Tracking

What this popup does (current prototype)

Shows the main Ditch The Scroll card with friendly branding.
Greets the user by name (e.g., “Hello Shruti!”).
Displays the current site being doomscrolled (e.g., “Instagram”).
Shows how many minutes the user has been actively scrolling on that site.
Updates in real time as the content script writes scrollTime and currentSite into chrome.storage.local.
Key files

App.jsx
Main React component for the popup UI.

Reads scrollTime and currentSite from chrome.storage.local.
Subscribes to chrome.storage.onChanged so the UI updates when the content script changes values.
Renders the greeting, current site, and minutes scrolled, plus footer icons (break, stats, settings).
App.css / index.css
Styling for the popup, including fonts, layout, and theme.
TailwindCSS and custom styles are used to create a playful, soft look.

main.jsx
React entry point that mounts App into the popup HTML.

How this popup connects to the rest of the extension

A content script (scrollDetector.js in the extension/scripts folder) runs on social media sites and:

Tracks scroll activity and idle time.
Calculates minutes of “doomscrolling”.
Writes scrollTime and currentSite into chrome.storage.local.
The popup reads those values and presents them in a clear, friendly way so the user can see:

“You’ve been scrolling on [Site] for [X] mins.”
Build and usage (high level)

This src folder is bundled with Vite into a production build that lives under extension/popup/dist.
The built popup is referenced by the extension’s manifest.json so that when the user clicks the extension icon, they see this React UI.

