# Lumipals on iPhone

The iPhone app is the same game, packaged with [Capacitor](https://capacitorjs.com) so it runs as a real app:
the game's files are inside the app (it works offline), with real haptics, sign-in that returns to the app,
and no web purchases (App Store rules: the app doesn't sell diamonds yet; players earn them by playing).

- App id (bundle id): `app.lumipals`
- Project: `ios/` (open `ios/App/App.xcodeproj` in Xcode)
- In code, `isNativeApp` (`src/lib/platform.js`) switches the app-only behavior.

## 1. One-time setup on your Mac

1. Install **Xcode** from the Mac App Store (free, big download), open it once and accept the license.
2. Install **Node.js 22** from https://nodejs.org.
3. In Terminal:

   ```bash
   git clone https://github.com/ringh0st/prism.git
   cd prism
   npm ci
   ```

## 2. Build and run on your iPhone

Every time the game changes, run this in the `prism` folder to copy the newest game into the app:

```bash
git pull
npm run ios
npx cap open ios
```

In Xcode:

1. Click **App** (top of the left sidebar) → **Signing & Capabilities** → **Team**: pick your Apple Developer account.
2. Plug in your iPhone (or pick a simulator) at the top of the window, then press ▶︎ **Run**.
3. The first time on a real iPhone: on the phone, go to **Settings → General → VPN & Device Management** and trust your developer profile.

## 3. Sign-in inside the app (Supabase)

In Supabase → **Authentication → URL Configuration → Redirect URLs**, add:

```
app.lumipals://auth
```

Google and Apple sign-in open in a secure Safari sheet and come back to the app through this address.

## 4. Sign in with Apple (in the app and on the website)

Do this after your Apple Developer membership is approved. Never paste keys into chats; put them only in the
Apple and Supabase dashboards.

1. **Apple Developer → Certificates, Identifiers & Profiles → Identifiers**
   - Open (or create) the App ID `app.lumipals` and tick **Sign in with Apple**.
   - Create a **Services ID**, e.g. `app.lumipals.signin`, tick **Sign in with Apple**, and configure it:
     - Domain: `wapxwfpgrijxaclsbwkq.supabase.co`
     - Return URL: `https://wapxwfpgrijxaclsbwkq.supabase.co/auth/v1/callback`
2. **Keys** → create a key with **Sign in with Apple** enabled, download the `.p8` file (you can download it only once; keep it safe).
3. **Supabase → Authentication → Sign In / Providers → Apple**: turn it on and fill in the Services ID, your Team ID,
   the Key ID and the secret, following Supabase's guide: https://supabase.com/docs/guides/auth/social-login/auth-apple
   (Apple's secret expires every 6 months; Supabase's guide shows how to renew it.)
4. That's all for the website: the "Sign in with Apple" button appears on lumipals.app by itself once the Apple
   provider is on in Supabase (the game asks Supabase which sign-in methods are enabled). In the iPhone app it always shows.

## 5. Publishing (App Store Connect)

1. https://appstoreconnect.apple.com → **Apps → +** → New App: platform iOS, name **Rinny's Lumipals: Light Puzzle**,
   bundle id `app.lumipals`, SKU `lumipals`.
2. In Xcode: set the version (General → Version, e.g. 1.0) → **Product → Archive** → **Distribute App** → App Store Connect.
3. Test it first with **TestFlight** (friends can install it from a link).
4. Fill in the store page: screenshots (6.7" and 6.5" iPhone), description, age rating, the **App Privacy** form,
   support URL `https://lumipals.app`, privacy policy `https://lumipals.app/privacy.html`. Then **Submit for Review**.

Apple rejects apps that are "just a website", so the app keeps the game inside the app, uses real haptics, works
offline, and has Sign in with Apple. Good next additions before or after the first review: Game Center
leaderboards and a daily-puzzle reminder notification.

## 6. Selling diamonds in the app

The app sells the diamond packs through Apple's in-app purchases. The setup (agreement, three products, a key, refund notices, the Xcode capability and a sandbox test) is in PAYMENTS.md → "Apple in-app purchases".
