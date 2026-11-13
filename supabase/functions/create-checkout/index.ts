// Creates a Lemon Squeezy checkout for a diamond pack and returns its URL.
// Called by the game's store; requires a signed-in player (Supabase verifies the JWT).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json, requireEnv } from '../_shared/http.ts';

// Lemon Squeezy store "Ringhost games" (ringhost.lemonsqueezy.com). Not a secret.
const STORE_ID = '523117';

// Players may only be sent back to the game's own site after paying.
const ALLOWED_RETURN_PREFIX = 'https://ringh0st.github.io/prism/';
const DEFAULT_RETURN_URL = `${ALLOWED_RETURN_PREFIX}play/#/store/thanks`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Please sign in.' }, 401);

    const { packId, returnUrl } = await req.json();
    const { data: pack } = await supabase.from('diamond_packs').select('id, variant_id').eq('id', packId).maybeSingle();
    if (!pack?.variant_id) return json({ error: 'That pack is not available.' }, 400);

    const redirectUrl =
      typeof returnUrl === 'string' && returnUrl.startsWith(ALLOWED_RETURN_PREFIX) ? returnUrl : DEFAULT_RETURN_URL;

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${requireEnv('LEMONSQUEEZY_API_KEY')}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            // custom data comes back in the webhook so we know whose account to credit
            checkout_data: { email: user.email, custom: { user_id: user.id, pack_id: pack.id } },
            product_options: { redirect_url: redirectUrl, enabled_variants: [Number(pack.variant_id)] },
          },
          relationships: {
            store: { data: { type: 'stores', id: STORE_ID } },
            variant: { data: { type: 'variants', id: String(pack.variant_id) } },
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('Lemon Squeezy checkout failed', response.status, await response.text());
      return json({ error: 'Checkout is not available right now.' }, 502);
    }
    const checkout = await response.json();
    return json({ url: checkout.data.attributes.url });
  } catch (error) {
    console.error(error);
    return json({ error: 'Checkout is not available right now.' }, 500);
  }
});
