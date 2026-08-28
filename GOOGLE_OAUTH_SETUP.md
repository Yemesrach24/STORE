# Google OAuth 2.0 Setup Guide

This project signs users in with Google OAuth 2.0 through Auth.js (NextAuth v5).
To make sign-in work you need to create a **Google OAuth Client ID + Secret** in
the Google Cloud Console and put them into `.env.local`.

> **Time:** ~10 minutes. **Cost:** Free (OAuth consent screen with "External"
> user type is free for testing; you can publish the app later when going live).

---

## 1. Create (or pick) a Google Cloud project

1. Go to <https://console.cloud.google.com> and sign in with the Google account
   you want to own the app.
2. In the top bar, click the **project selector** (shows the current project
   name next to a 🔽 arrow).
3. Click **New Project**.
   - **Project name:** e.g. `inventory-management`
   - Leave the organization as-is (or your org).
   - Click **Create**.
4. Wait a few seconds for the project to be created, then use the project
   selector again and click your new project to **make it the active project**.

---

## 2. Configure the OAuth consent screen

You only do this once per project — before you can create credentials.

1. In the left sidebar (or the search bar at the top), open
   **APIs & Services → OAuth consent screen**.
   - URL: <https://console.cloud.google.com/apis/credentials/consent>
2. **User type:** choose **External** (required to let any Google account sign
   in; "Internal" only works inside Google Workspace).
   - If you see a "This app is not verified" warning, ignore it for now — that
     only matters once you publish for production use. During development
     Google shows a "Google hasn't verified this app" screen with an
     **Advanced → Go to ... (unsafe)** link. That is expected; click through it
     on your first test sign-in.
3. Click **CREATE** and fill in the **App information**:
   - **App name:** `Inventory Management`
   - **User support email:** your own email address
   - *(optional)* **App logo:** skip it
   - **Developer contact information:** your email address
   - Click **SAVE AND CONTINUE**.
4. **Audience → Scopes** screen:
   - The defaults (`email`, `profile`, `openid`) are already selected. Just
     click **SAVE AND CONTINUE**.
5. **Audience → Test users** screen:
   - If you want to *restrict* sign-in to specific accounts while the app is in
     "Testing" mode, add your own Google account under **Test users** and click
     **SAVE AND CONTINUE**.
   - If you leave it empty, any Google account can sign in (fine for local
     development).
6. **Summary:** review and click **BACK TO DASHBOARD**.

---

## 3. Create the OAuth Client ID (Web application)

1. Go to **APIs & Services → Credentials**.
   - URL: <https://console.cloud.google.com/apis/credentials>
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**.
3. **Application type:** select **Web application**.
4. **Name:** `Inventory Management Web` (or anything recognizable).
5. **Authorized JavaScript origins** — click **+ ADD URI** and enter:
   ```
   http://localhost:3000
   ```
6. **Authorized redirect URIs** — click **+ ADD URI** and enter exactly:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   > ⚠️ This must match this project's NextAuth callback path exactly. Getting
   > this wrong is the #1 cause of `redirect_uri_mismatch` errors. The full
   > path is `/api/auth/callback/google` — the trailing part after the port
   > matters.
7. Click **CREATE**.
8. A dialog pops up with your **Client ID** and **Client Secret**:
   - **Client ID** looks like: `1234567890-abc123...apps.googleusercontent.com`
   - **Client Secret** looks like: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Click the copy icons and save both somewhere safe (e.g. your password
     manager). The secret is shown **only once** here — if you lose it, click
     the pencil/edit icon on the credential later and **Download JSON** or
     create a new one.

---

## 4. Put the credentials into `.env.local`

Open `.env.local` in the project root and replace the placeholders:

```env
AUTH_GOOGLE_ID=1234567890-abc123...apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Leave `AUTH_SECRET` as the already-generated value (or regenerate with
`openssl rand -base64 32` — it just needs to be a long random string, kept
secret, and consistent across restarts so sessions survive).

> **Never commit `.env.local`** — it's already in `.gitignore`.

---

## 5. Test the sign-in flow

1. Restart the dev server (so it picks up the new env vars):
   ```bash
   npm run dev
   ```
2. Open <http://localhost:3000/sign-in> and click **Continue with Google**.
3. Pick your Google account. On the very first test you'll likely see
   **"Google hasn't verified this app"** → click **Advanced → Go to Inventory
   Management (unsafe)** → **Continue**.
4. You should land back on the app, logged in. The `/dashboard` route and all
   API routes will now accept your session.
5. First sign-in creates a `User` document in MongoDB automatically (with your
   Google account id in the `authId` field). You'll start with the `user`
   role — see below to become `admin`.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | Redirect URI in Google Console doesn't match exactly | Re-check `http://localhost:3000/api/auth/callback/google` (step 3.6) — no trailing slash, exact case |
| `access_denied` / "This app is blocked" | Consent screen not created, or account not in Test users (if testing mode) | Complete step 2, and add your account under **Test users** |
| `Invalid client` / `client_id not found` | Wrong Client ID pasted | Copy the full `...apps.googleusercontent.com` string, check for typos |
| `MissingSecret` / Auth.js error at boot | `AUTH_SECRET` empty | Set `AUTH_SECRET` (see step 4) |
| `This browser or app may not be secure` | OAuth from an embedded/in-app browser | Test in a regular Chrome/Edge/Firefox tab |
| "Google hasn't verified this app" | App is in testing mode | Normal for development — click **Advanced → Go to app (unsafe)**. To remove it later, publish the app in the OAuth consent screen settings |

---

## Going live (production) later

- Change the **publishing status** of the OAuth consent screen from *Testing* to
  *In production* (may require verification).
- Add your production origin to **Authorized JavaScript origins** (e.g.
  `https://your-domain.com`).
- Add the production callback to **Authorized redirect URIs** (e.g.
  `https://your-domain.com/api/auth/callback/google`).
- Set a real `AUTH_SECRET`, and add `AUTH_URL=https://your-domain.com`.
