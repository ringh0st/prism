import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config.js';

let enabledProviders = null;

/**
 * Which sign-in providers are switched on in Supabase (e.g. { apple: true, google: true }), asked once.
 * Lets a sign-in button appear only when it works: Apple shows up on the web the moment it is set up.
 */
export function fetchEnabledProviders() {
  enabledProviders ??= fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } })
    .then((response) => (response.ok ? response.json() : {}))
    .then((settings) => settings.external ?? {})
    .catch(() => {
      enabledProviders = null; // try again next time
      return {};
    });
  return enabledProviders;
}
