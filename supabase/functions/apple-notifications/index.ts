// Receives App Store Server Notifications (version 2). Only refunds matter here: when Apple refunds or revokes a
// purchase, the diamonds are taken back. Deployed without JWT verification: nothing in the message is trusted;
// it only names a transaction, which is then looked up at Apple itself.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireEnv } from '../_shared/http.ts';
import { decodePayload, fetchAppleTransaction, orderIdFor } from '../_shared/appStore.ts';

const REFUND_TYPES = ['REFUND', 'REVOKE'];

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let transactionId: unknown;
  try {
    const { signedPayload } = await req.json();
    const notice = decodePayload(signedPayload) as { notificationType?: string; data?: { signedTransactionInfo?: string } };
    if (!REFUND_TYPES.includes(notice.notificationType ?? '') || !notice.data?.signedTransactionInfo) return new Response('ok');
    transactionId = decodePayload(notice.data.signedTransactionInfo).transactionId;
  } catch {
    return new Response('Unreadable notification', { status: 400 });
  }
  if (typeof transactionId !== 'string' || !/^\d{1,32}$/.test(transactionId)) return new Response('ok');

  try {
    // Apple confirms it: only a transaction Apple itself reports as revoked is refunded.
    const transaction = await fetchAppleTransaction(transactionId);
    if (!transaction?.revocationDate) return new Response('ok');
    const admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const { error } = await admin.rpc('refund_purchase', { p_order_id: orderIdFor(transaction.transactionId) });
    if (error) throw error;
    return new Response('ok');
  } catch (error) {
    console.error('apple-notifications failed', error);
    return new Response('Try again', { status: 500 }); // Apple retries failed deliveries
  }
});
