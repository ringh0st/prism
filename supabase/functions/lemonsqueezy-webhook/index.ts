// Receives payment events from Lemon Squeezy and credits (or refunds) diamonds. Lemon Squeezy stops taking payments
// on 31 March 2027; Stripe takes over (stripe-webhook) once PAYMENTS_PROVIDER is set to "stripe".
// Deployed without JWT verification; every request is verified with the webhook signing secret instead.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireEnv } from '../_shared/http.ts';
import { hmacSha256Hex, safeEqual } from '../_shared/signatures.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const rawBody = await req.text();
  const expected = await hmacSha256Hex(requireEnv('LEMONSQUEEZY_WEBHOOK_SECRET'), rawBody);
  if (!safeEqual(expected, req.headers.get('X-Signature') ?? '')) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName: string = event.meta?.event_name;
  const userId: string | undefined = event.meta?.custom_data?.user_id;
  const order = event.data;
  const orderId = `lemonsqueezy_${order?.id}`;
  const admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));

  if (eventName === 'order_created' && order?.attributes?.status === 'paid') {
    // The pack is looked up from the variant that was actually paid for, never from client data.
    const variantId = String(order.attributes.first_order_item?.variant_id ?? '');
    const { data: pack } = await admin.from('diamond_packs').select('id').eq('variant_id', variantId).maybeSingle();
    if (!pack || !userId) {
      console.error('Paid order could not be matched', { orderId, variantId, userId });
      return new Response('Unmatched order recorded in logs', { status: 200 });
    }
    const { error } = await admin.rpc('grant_purchase', {
      p_order_id: orderId,
      p_user_id: userId,
      p_pack_id: pack.id,
      p_amount_cents: order.attributes.total,
      p_currency: order.attributes.currency,
      p_provider: 'lemonsqueezy',
    });
    if (error) {
      console.error('grant_purchase failed', error);
      return new Response('Try again', { status: 500 }); // Lemon Squeezy retries failed deliveries
    }
  } else if (eventName === 'order_refunded') {
    const { error } = await admin.rpc('refund_purchase', { p_order_id: orderId });
    if (error) {
      console.error('refund_purchase failed', error);
      return new Response('Try again', { status: 500 });
    }
  }

  return new Response('ok', { status: 200 });
});
