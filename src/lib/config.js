// Public client configuration. The publishable key is designed to be public;
// Row Level Security in the database (supabase/schema.sql) protects the data.
export const SUPABASE_URL = 'https://wapxwfpgrijxaclsbwkq.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_P96gX4pjrmkFtvrbHGQdRg_6K1eXEtc';

import { isNativeApp, platformName } from './platform.js';

// Full addresses, so they also work inside the app (where they open in Safari).
export const HOME_PAGE_URL = 'https://lumipals.app/';
export const PRIVACY_URL = 'https://lumipals.app/privacy.html';
export const TERMS_URL = 'https://lumipals.app/terms.html';

/**
 * Real-money diamond purchases. On the website they go through a checkout page (Stripe Managed Payments, see
 * PAYMENTS.md). App stores require their own payment systems, so the iPhone app sells the same packs through
 * Apple's in-app purchases (src/lib/applePurchases.js) and never opens the web checkout.
 */
export const APPLE_PURCHASES_ENABLED = isNativeApp && platformName === 'ios';
export const PAYMENTS_ENABLED = !isNativeApp || APPLE_PURCHASES_ENABLED;

/** Sign in with Apple: App Store rules require it next to Google sign-in in the iPhone app. */
export const APPLE_SIGN_IN_ENABLED = isNativeApp;

/** Public address of the game, used in share messages. */
export const PUBLIC_GAME_URL = 'https://lumipals.app/';
