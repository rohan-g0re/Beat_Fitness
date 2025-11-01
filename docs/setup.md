## FitTracker – Setup Guide

This guide helps a new developer get the app running locally (Expo), configure Supabase (local or hosted), set up in‑app purchases (RevenueCat + Stripe via Supabase Edge Functions), and build native dev clients with EAS.

### 1) Prerequisites
- **Node.js**: v20 LTS recommended (comes with npm)
- **Git**
- **Expo tooling**: `npx expo` (no global install required)
- **EAS CLI**: `npm i -g eas-cli` (for dev builds and store builds)
- **Mobile toolchains** (optional but recommended):
  - **iOS**: macOS + Xcode (15+)
  - **Android**: Android Studio + SDK/Emulator
- **Supabase CLI**: `npm i -g supabase` (for local stack, types, and functions)

### 2) Clone and install
```bash
git clone <your-fork-or-origin-url>
cd FitTracker
npm install
```

### 3) Environment variables
Create a `.env` in the project root. The app reads values via `app.config.ts` → `Constants.expoConfig.extra`.

Required for app runtime:
```bash
# Supabase (project or local)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

# RevenueCat SDK keys (from the RC dashboard → Apps → API Keys)
EXPO_PUBLIC_RC_API_KEY_IOS=rc_public_sdk_key_ios
EXPO_PUBLIC_RC_API_KEY_ANDROID=rc_public_sdk_key_android
```

Optional (build-time):
```bash
# EAS project id if you have one (or set in app.config.ts extra.eas.projectId)
EAS_PROJECT_ID=your-project-id
```

Deep link scheme is `fitapp` (see `app.config.ts` and `src/navigation/linking.ts`). Supabase Auth local config uses `fitapp://auth/callback`.

### 4) Running the app (Expo)
```bash
npm start
# then press: i (iOS simulator), a (Android emulator), w (web)
```

Notes:
- Using Expo Go: RevenueCat native module won’t load (by design). Use a dev build (below) to test purchases.
- Supabase auth/email flows will work with the configured redirect(s).

### 5) Dev builds with EAS (to test native modules)
```bash
eas login
eas build --platform ios --profile development   # iOS dev client (simulator build if configured)
eas build --platform android --profile development
```
Install the resulting dev client on your device/emulator, then run:
```bash
npm start
```
and choose “Open in development build”.

### 6) Supabase setup
You can use a hosted Supabase project or run locally with the Supabase CLI.

Local stack (recommended for first run):
```bash
supabase start
```
Confirm `supabase/config.toml` has:
- `auth.site_url = "fitapp://auth/callback"`
- `auth.additional_redirect_urls = ["http://localhost:19006"]` (Expo web dev server)

Generate TypeScript types from your running DB:
```bash
npm run supabase:gen-types
```

### 7) Deploy and configure Edge Functions
The app uses Supabase Edge Functions for checkout and webhooks:
- `create-checkout-session`: Stripe Checkout session
- `revenuecat-webhook`: mirrors RC entitlements into `user_entitlements`
- `delete-account`: deletes a user and related data

Deploy (to your Supabase project):
```bash
supabase functions deploy create-checkout-session
supabase functions deploy revenuecat-webhook
supabase functions deploy delete-account
```

Set required function environment variables:

For `create-checkout-session`:
```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_or_test \
  STRIPE_PRICE_MONTHLY=price_xxx \
  STRIPE_PRICE_ANNUAL=price_yyy \
  CHECKOUT_SUCCESS_URL=fitapp://checkout/success \
  CHECKOUT_CANCEL_URL=fitapp://checkout/cancel \
  SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_ANON_KEY=your-public-anon-key
```

For `revenuecat-webhook` and `delete-account`:
```bash
supabase secrets set \
  SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

If you run functions locally, ensure the same envs are available via `supabase functions serve`.

### 8) RevenueCat configuration
1. Create an app in RevenueCat (iOS/Android as needed).
2. Create products and an entitlement named `pro`.
3. Put the platform SDK keys into `.env` (`EXPO_PUBLIC_RC_API_KEY_IOS/ANDROID`).
4. Configure a webhook in RevenueCat → Webhooks pointing to your deployed `revenuecat-webhook` function URL.

In development builds, purchases rely on the native module (`react-native-purchases`), which is automatically initialized with the platform key and the current Supabase user ID.

### 9) Project scripts & quality
Common scripts:
```bash
npm run lint          # ESLint
npm run lint:fix      # Auto-fix
npm run type-check    # TypeScript
npm test              # Jest
```

### 10) Platform notes
- **iOS HealthKit**: Entitlements are declared in `app.config.ts`, but `src/services/healthkit.ts` is a placeholder. Implement with a library (e.g., `react-native-health`) before enabling in production.
- **iOS Widget**: Native widget sources live under `ios/FitTrackerWidget`. You’ll need a prebuild/dev build to iterate on the widget.
- **Deep Linking**: URL scheme `fitapp://...` (see `src/navigation/linking.ts`). Ensure store configs (Associated Domains, etc.) are set when shipping.

### 11) First run checklist
- `.env` created with Supabase and RevenueCat keys
- (Optional) `supabase start` running locally
- Edge functions deployed and secrets set (if testing checkout/entitlements)
- `npm start` works in Expo
- Dev build created via EAS if testing purchases

### 12) Troubleshooting
- Missing Supabase keys will log a warning on startup. Verify `.env` and that Expo picks them up.
- In Expo Go, purchases are disabled: use a dev build.
- Auth callback issues: confirm `auth.site_url` and `additional_redirect_urls` in `supabase/config.toml` match your dev URLs.


