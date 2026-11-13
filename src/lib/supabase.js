import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // PKCE returns ?code= in the query string, which keeps our #/hash routes intact.
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'prism.auth',
  },
});

/** Where Google sends players back after signing in: the game's own page, without hash or query. */
export function authRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}
