// Public client configuration. The publishable key is designed to be public;
// Row Level Security in the database (supabase/schema.sql) protects the data.
export const SUPABASE_URL = 'https://wapxwfpgrijxaclsbwkq.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_P96gX4pjrmkFtvrbHGQdRg_6K1eXEtc';

import { isNativeApp } from './platform.js';

// Full addresses, so they also work inside the app (where they open in Safari).
export const HOME_PAGE_URL = 'https://lumipals.app/';
export const PRIVACY_URL = 'https://lumipals.app/privacy.html';
export const TERMS_URL = 'https://lumipals.app/terms.html';

/**
 * Real-money diamond purchases on the website (Stripe Managed Payments, see PAYMENTS.md). App stores require
 * their own payment systems, so the apps don't sell diamonds (yet): players earn them by playing.
 */
export const PAYMENTS_ENABLED = !isNativeApp;

/** Sign in with Apple: App Store rules require it next to Google sign-in in the iPhone app. */
export const APPLE_SIGN_IN_ENABLED = isNativeApp;

/** Public address of the game, used in share messages. */
export const PUBLIC_GAME_URL = 'https://lumipals.app/';
