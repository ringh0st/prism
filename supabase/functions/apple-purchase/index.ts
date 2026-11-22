// Credits diamonds for an in-app purchase made in the iPhone app. The app sends only the App Store transaction id;
// this function asks Apple what was really bought (and by whom) before adding anything. Requires a signed-in player.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json, requireEnv } from '../_shared/http.ts';
import { APPLE_BUNDLE_ID, fetchAppleTransaction, orderIdFor, PACK_FOR_PRODUCT } from '../_shared/appStore.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const asCaller = createClient(supabaseUrl, requireEnv('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: caller } = await asCaller.auth.getUser();
    if (!caller?.user) return json({ error: 'Sign in first' }, 401);

    const { transactionId } = await req.json().catch(() => ({}));
    if (typeof transactionId !== 'string' || !/^\d{1,32}$/.test(transactionId)) return json({ error: 'Unknown purchase' }, 400);

    const transaction = await fetchAppleTransaction(transactionId);
    const packId = transaction ? PACK_FOR_PRODUCT[transaction.productId] : undefined;
    if (!transaction || transaction.bundleId !== APPLE_BUNDLE_ID || !packId) return json({ error: 'Unknown purchase' }, 400);
    if (transaction.revocationDate) return json({ error: 'This purchase was refunded' }, 409);

    // The app stamps each purchase with the buyer's account id; the diamonds always go to that account, whoever
    // reports the purchase (so a purchase finished later, after a restart, still reaches its buyer).
    const buyerId = UUID.test(transaction.appAccountToken ?? '') ? transaction.appAccountToken!.toLowerCase() : caller.user.id;

    const admin = createClient(supabaseUrl, requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: isNew, error } = await admin.rpc('grant_purchase', {
      p_order_id: orderIdFor(transaction.transactionId),
      p_user_id: buyerId,
      p_pack_id: packId,
      p_amount_cents: Number.isFinite(transaction.price) ? Math.round(transaction.price! / 10) : null,
      p_currency: transaction.currency ?? null,
      p_provider: 'apple',
    });
    if (error) throw error;
    return json({ granted: true, isNew: Boolean(isNew) });
  } catch (error) {
    console.error('apple-purchase failed', error);
    return json({ error: 'Could not confirm the purchase' }, 500);
  }
});
