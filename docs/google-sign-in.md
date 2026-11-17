# Google sign-in setup

Rule: `docs/spec.md` (Auth). Code: `apps/mobile/src/auth/google.ts`, client IDs in `apps/mobile/app.config.ts`.

How it works:

- **Phone (dev build, preview APK, store build):** Google's native sign-in sheet. Google shows the app name from the consent screen ("Finny"). The app gets an ID token and calls `supabase.auth.signInWithIdToken`.
- **Web and Expo Go:** fallback to Supabase's hosted Google page in the browser. Google shows the Supabase project address there. This fallback is for testing only.

Everything lives in one Google Cloud project, `finny-f9dba`, at Google Auth Platform: https://console.cloud.google.com/auth/overview?project=finny-f9dba

## 1. Consent screen (once)

- **Branding:** App name `Finny`, support email. Logo (`docs/brand/finny-logo-120.png`) is optional: once a logo is uploaded, Google must verify the brand before "Publish app", which needs our own domain. Skip it until there is one.
  - Before publishing, also fill in home page, privacy policy URL and authorized domain.
- **Audience:** External.
  - While in Testing, only listed test users can sign in.
  - Press "Publish app" before release.

## 2. Clients

Client IDs are not secrets. The web client's secret is a secret: it goes only into Supabase.

| Client | Type | Values | Status |
| --- | --- | --- | --- |
| Finny (web) | Web application | Redirect URIs: `https://fcezhasnvrdeplaklqmv.supabase.co/auth/v1/callback` (dev) and `https://mlirmohdsbcqjewybizc.supabase.co/auth/v1/callback` (prod) | done, `542359804466-g6fe…` |
| Finny Android dev | Android | package `com.finny.app.dev`, SHA-1 `50:EC:33:41:1E:3F:B1:DB:53:CE:FB:D9:28:02:8C:91:1E:25:1C:71` (EAS dev keystore, read from the preview APK) | to do |
| Finny iOS dev | iOS | bundle ID `com.finny.app.dev` | done, `542359804466-c6gf…` (in app.config.ts) |
| Finny Android prod | Android | package `com.finny.app`, SHA-1 of the EAS production keystore and, once on Google Play, the Play "App signing key" SHA-1 too (one client per SHA-1) | at prod |
| Finny iOS prod | iOS | bundle ID `com.finny.app` | at prod |

- **Android clients:** no ID goes into the app. Google matches the package and SHA-1.
- **iOS clients:** the client ID goes into `app.config.ts` (or `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_DEV` / `_PROD`). It adds the reversed ID as a URL scheme, so the app needs a rebuild after it is set. Until then, iOS uses the browser fallback.

## 3. Supabase (dev, and later prod)

In Authentication → Sign In / Providers → Google:

- **Enabled.**
- **Client ID:** the web client ID first, then the iOS client IDs, comma-separated. Supabase accepts ID tokens whose audience is any of these.
- **Client Secret:** the web client's secret.
- **Skip nonce checks: on.** The native iOS SDK adds its own nonce, which the app cannot pass on.

In URL Configuration → Redirect URLs, for the browser fallback:

- **dev:** `finny-dev://auth-callback` and `exp://**`
- **prod:** `finny://auth-callback`

## 4. Test

1. Build a new dev or preview app. The native module is not in older builds.
2. Tap "Continue with Google" and pick a test-user account.
3. Expect: the terms screen, then the locked screen until an admin approves.
4. Sign out, then sign in again: the account picker shows again.

## App Store note

Google sign-in on iOS triggers App Store guideline 4.8 (Sign in with Apple). This is an open issue in `docs/spec.md`.
