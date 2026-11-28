# Firebase console setup — remaining blocker

The code is ready. These console steps are the only thing preventing live Firebase AI Logic inference. Do not commit any token, key, `.env` file or personal data.

## 1. Create the Firebase project

1. Open <https://console.firebase.google.com/> and create/select the project for Lerno.
2. Go to **AI Services → AI Logic → Get started**.
3. Choose **Gemini Developer API** (free tier is sufficient for judging).
4. Enable the API in the Google Cloud project if prompted.
5. Confirm the model `gemini-3.5-flash-lite` is available. The web app uses this as the cloud fallback.
6. Register a **Web app** and copy only the public web config object.

The web config is public by design. Do not treat it as a secret, but still restrict it with authorised domains and App Check.

## 2. Put public config into deployment and local dev

Use these exact names, already declared in `apps/web/src/env.ts`:

```text
VITE_PUBLIC_FIREBASE_API_KEY
VITE_PUBLIC_FIREBASE_AUTH_DOMAIN
VITE_PUBLIC_FIREBASE_PROJECT_ID
VITE_PUBLIC_FIREBASE_APP_ID
VITE_PUBLIC_FIREBASE_APPCHECK_SITE_KEY
```

For Vercel, add them as Environment Variables for Production/Preview. For local development, copy `.env.example` to `.env.local` (never commit it) and set `VITE_PUBLIC_FIREBASE_APPCHECK_DEBUG=true` only there.

`VITE_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` is the **public reCAPTCHA v3 site key**, not a secret. `VITE_PUBLIC_FIREBASE_APPCHECK_DEBUG` must be `false` or absent in production.

## 3. Firebase App Check

1. In Firebase console, open **Build → App Check**.
2. Register the web app with the **reCAPTCHA v3** provider.
3. Create a reCAPTCHA v3 site key for `lerno.mudiageo.tech`.
4. Authorise `lerno.mudiageo.tech` (and `localhost` for development).
5. Set `VITE_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` to the site key.
6. Enable **enforcement** for AI Logic after verifying the app works.

Local debug flow:

1. Keep `VITE_PUBLIC_FIREBASE_APPCHECK_DEBUG=true` in `.env.local` only.
2. Open `/hybrid` in Chrome and check the console for the App Check debug token.
3. Copy that token into **App Check → Manage debug tokens** and safelist it.
4. Never paste the token into chat, a commit, Devpost, or `.env.example`.

## 4. Chrome on-device setup

Use Chrome Desktop 139+:

1. Visit `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`.
2. Enable the flag and restart Chrome.
3. Open `/hybrid` and press **Prepare model**. Keep the tab open while the model downloads; it can take a few minutes.
4. The capability chip should change to **On-device model ready**.
5. For the airplane-mode demo, keep the page loaded, then disable the network and generate a Revision Pack. Answers should be labelled `ON_DEVICE`.

Non-Chrome browsers and webviews are expected to show **On-device model unavailable** and fall back to cloud inference. That is a valid hybrid demo, not an error.

## 5. Domain and deployment

`lerno.mudiageo.tech` currently returns NXDOMAIN. Point it at the existing deployment, then confirm:

```bash
curl -I -L https://lerno.mudiageo.tech
```

The URL must stay public, free and unrestricted through 16 Dec 2026. Redeploy after adding the env vars so the public config is baked into the client build.

## 6. Runtime verification checklist

- `/hybrid` shows **Web config loaded**.
- Capability chip shows a real Chrome state, not the fallback text.
- **Prepare model** produces progress and then a ready state on the demo machine.
- Generating a Revision Pack returns a visible `ON_DEVICE` or `IN_CLOUD` badge.
- Private Pass reports kept-local identifiers.
- Instant + Enhanced shows two independently labelled answers.
- Curriculum Bootstrap shows a private-pass summary and an editable preview.
- Snap-and-Mark shows a source badge and any cloud escalation.
- No secrets, debug tokens, `.env` files or PII appear in the repo, Devpost form or demo video.

If any generation call fails, check the browser console for App Check errors first; an unconfigured or unauthorised App Check provider is the most likely cause.
