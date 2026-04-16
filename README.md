# ditch-the-scroll-webextension

## Folder structure

```txt
/client-extension        # Existing extension (preserved and integrated)
  /popup                 # React + Tailwind popup
/mobile-app              # React Native + Expo app
/server                  # Node.js + Express API
  /src
    /config
    /controllers
    /lib
    /routes
  /supabase/schema.sql
/shared                  # Shared auth + nudge logic for extension/mobile/server
```

## Step-by-step implementation

### 1) Backend setup (`/server`)
- Express app with controller-based routes:
  - `POST /auth/sync-user`
  - `GET /nudges`
  - `POST /activity`
- Added push routes:
  - `POST /push/register`
  - `POST /push/send-nudge`
- Kept legacy `POST /session` for backward compatibility.

### 2) Supabase integration
- Shared Supabase client/auth utilities in `/shared`.
- Server uses Supabase service-role client (when env vars are set).
- Extension popup and mobile app use shared auth utility for email/password auth and session persistence.
- SQL schema added at `/server/supabase/schema.sql` for:
  - `users`
  - `nudges`
  - `user_activity`

### 3) Mobile app (`/mobile-app`)
- Expo app with card/step-based no-scroll UX.
- Screens implemented in app flow:
  - Login/Signup
  - Home
  - Mood check-in
  - Full-screen Nudge screen
- Auth + session persistence via shared Supabase utility.

### 4) Nudge engine (`/shared`)
- Reusable emotional nudge engine with shared trigger logic:
  - inactive > 24h → re-engagement support
  - mood = `stressed` → calming support
  - doomscroll trigger → gentle interruption
- Shared output shape includes `triggerType`, `message`, and `action`.

### 5) Extension integration (`/client-extension`)
- Extension background now calls backend API for:
  - user sync
  - activity updates
  - nudge retrieval
- Content script shows backend-provided nudge message as overlay.
- Popup includes auth flow and syncs authenticated user ID to extension storage.

## Push notifications (Firebase)
- Mobile registers device push token through `/push/register`.
- Backend includes Firebase Admin integration and push endpoint (`/push/send-nudge`).
- Configure `FIREBASE_SERVICE_ACCOUNT_JSON` in server env.

## Environment variables

### `/server/.env`
- `PORT`
- `CORS_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

### `/client-extension/popup/.env`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` (optional, defaults to `http://localhost:4000`)

### `/mobile-app/.env`
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Deployment targets
- Backend: Vercel
- Extension: Chrome Web Store
- Mobile: Expo EAS
