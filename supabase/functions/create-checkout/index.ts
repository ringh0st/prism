// Creates a checkout page for a diamond pack and returns its URL. Called by the game's store; requires a signed-in
// player (Supabase verifies the JWT). The PAYMENTS_PROVIDER secret picks who sells: "stripe" (Stripe Managed
// Payments, the merchant of record) or, until it shuts down on 31 March 2027, "lemonsqueezy" (the default).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json, requireEnv } from '../_shared/http.ts';

// Lemon Squeezy store "Ringhost games" (ringhost.lemonsqueezy.com). Not a secret.
const LEMONSQUEEZY_STORE_ID = '523117';
// The Stripe API version that has Managed Payments on Checkout Sessions.
const STRIPE_API_VERSION = '2026-04-22.dahlia';

// Players may only be sent back to the game's own site after paying (the old GitHub address still works).
const ALLOWED_RETURN_PREFIXES = ['https://lumipals.app/', 'https://ringh0st.github.io/prism/'];
const DEFAULT_RETURN_URL = 'https://lumipals.app/play/#/store/thanks';
const CANCEL_URL = 'https://lumipals.app/play/#/store';

type Pack = { id: string; variant_id: string | null; stripe_price_id: string | null };
type Buyer = { id: string; email?: string };

/** A Stripe Checkout page with Managed Payments: Stripe sells, handles tax, refunds and disputes, and pays out. */
async function stripeCheckout(pack: Pack, buyer: Buyer, redirectUrl: string): Promise<string | null> {
  const form = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': pack.stripe_price_id ?? '',
    'line_items[0][quantity]': '1',
    'managed_payments[enabled]': 'true',
    success_url: redirectUrl,
    cancel_url: CANCEL_URL,
    client_reference_id: buyer.id,
    // Read back by stripe-webhook to know whose account to credit (also on the payment, for refunds).
    'metadata[user_id]': buyer.id,
    'metadata[pack_id]': pack.id,
    'payment_intent_data[metadata][user_id]': buyer.id,
    'payment_intent_data[metadata][pack_id]': pack.id,
  });
  if (buyer.email) form.set('customer_email', buyer.email);
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('STRIPE_SECRET_KEY')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
    },
    body: form,
  });
  if (!response.ok) {
    console.error('Stripe checkout failed', response.status, await response.text());
    return null;
  }
  return (await response.json()).url;
}

/** A Lemon Squeezy checkout (until it shuts down). */
async function lemonSqueezyCheckout(pack: Pack, buyer: Buyer, redirectUrl: string): Promise<string | null> {
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
          checkout_data: { email: buyer.email, custom: { user_id: buyer.id, pack_id: pack.id } },
          product_options: { redirect_url: redirectUrl, enabled_variants: [Number(pack.variant_id)] },
        },
        relationships: {
          store: { data: { type: 'stores', id: LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: 'variants', id: String(pack.variant_id) } },
        },
      },
    }),
  });
  if (!response.ok) {
    console.error('Lemon Squeezy checkout failed', response.status, await response.text());
    return null;
  }
  return (await response.json()).data.attributes.url;
}

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

    const isStripe = Deno.env.get('PAYMENTS_PROVIDER') === 'stripe';
    const { packId, returnUrl } = await req.json();
    const { data: pack } = await supabase.from('diamond_packs').select('id, variant_id, stripe_price_id').eq('id', packId).maybeSingle();
    if (!pack || !(isStripe ? pack.stripe_price_id : pack.variant_id)) return json({ error: 'That pack is not available.' }, 400);

    const redirectUrl =
      typeof returnUrl === 'string' && ALLOWED_RETURN_PREFIXES.some((prefix) => returnUrl.startsWith(prefix)) ? returnUrl : DEFAULT_RETURN_URL;
    const buyer = { id: user.id, email: user.email };
    const url = isStripe ? await stripeCheckout(pack, buyer, redirectUrl) : await lemonSqueezyCheckout(pack, buyer, redirectUrl);
    return url ? json({ url }) : json({ error: 'Checkout is not available right now.' }, 502);
  } catch (error) {
    console.error(error);
    return json({ error: 'Checkout is not available right now.' }, 500);
  }
});
