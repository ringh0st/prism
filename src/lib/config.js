// Public client configuration. The publishable key is designed to be public;
// Row Level Security in the database (supabase/schema.sql) protects the data.
export const SUPABASE_URL = 'https://wapxwfpgrijxaclsbwkq.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_P96gX4pjrmkFtvrbHGQdRg_6K1eXEtc';

export const HOME_PAGE_URL = '../';
export const PRIVACY_URL = '../privacy.html';
export const TERMS_URL = '../terms.html';

/**
 * Real-money diamond purchases. Turned on once the Lemon Squeezy store is set up
 * and the Supabase payment functions are deployed (see PAYMENTS.md).
 */
export const PAYMENTS_ENABLED = true;

/** Public address of the game, used in share messages. */
export const PUBLIC_GAME_URL = 'https://lumipals.app/';
