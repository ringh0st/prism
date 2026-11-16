// Receives payment events from Stripe (Managed Payments: Stripe is the merchant of record) and credits or refunds
// diamonds. Deployed without JWT verification; every request is verified with the webhook signing secret instead.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireEnv } from '../_shared/http.ts';
import { hmacSha256Hex, safeEqual } from '../_shared/signatures.ts';

/** Signatures older than this are refused (replayed requests). */
const TOLERANCE_SECONDS = 300;

/** Checks the Stripe-Signature header ("t=…,v1=…"): an HMAC of "<t>.<body>" with the endpoint's signing secret. */
async function isSignedByStripe(header: string, rawBody: string): Promise<boolean> {
  const parts = header.split(',').map((part) => part.trim().split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;
  const expected = await hmacSha256Hex(requireEnv('STRIPE_WEBHOOK_SECRET'), `${timestamp}.${rawBody}`);
  return signatures.some((signature) => safeEqual(expected, signature));
}

/** One purchase per payment: refunds arrive on the charge, which carries the same payment intent. */
const orderIdFor = (paymentIntent: string) => `stripe_${paymentIntent}`;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const rawBody = await req.text();
  if (!(await isSignedByStripe(req.headers.get('Stripe-Signature') ?? '', rawBody))) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const object = event.data?.object ?? {};
  const admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));

  // A paid checkout (cards are paid at once; slower methods report later with async_payment_succeeded).
  const isPaidCheckout =
    (event.type === 'checkout.session.completed' && object.payment_status === 'paid') || event.type === 'checkout.session.async_payment_succeeded';
  if (isPaidCheckout) {
    // Whose account and which pack were written by create-checkout on the server, never by the game.
    const { user_id: userId, pack_id: packId } = object.metadata ?? {};
    if (!userId || !packId || !object.payment_intent) {
      console.error('Paid checkout could not be matched', { session: object.id, userId, packId });
      return new Response('Unmatched checkout recorded in logs', { status: 200 });
    }
    const { error } = await admin.rpc('grant_purchase', {
      p_order_id: orderIdFor(object.payment_intent),
      p_user_id: userId,
      p_pack_id: packId,
      p_amount_cents: object.amount_total,
      p_currency: String(object.currency ?? '').toUpperCase(),
      p_provider: 'stripe',
    });
    if (error) {
      console.error('grant_purchase failed', error);
      return new Response('Try again', { status: 500 }); // Stripe retries failed deliveries
    }
  } else if (event.type === 'charge.refunded' && object.refunded && object.payment_intent) {
    // Only a full refund takes the diamonds back.
    const { error } = await admin.rpc('refund_purchase', { p_order_id: orderIdFor(object.payment_intent) });
    if (error) {
      console.error('refund_purchase failed', error);
      return new Response('Try again', { status: 500 });
    }
  }

  return new Response('ok', { status: 200 });
});
