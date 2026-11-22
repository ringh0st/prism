import { supabase } from './supabase.js';
import { EconomyError } from '../game/progress.js';

/*
 * Diamonds bought inside the iPhone app, through Apple's in-app purchases (StoreKit). Apple requires this for
 * anything bought with real money in an app; the website sells the same packs through Stripe.
 *
 * A purchase goes: Apple's payment sheet → the app tells our server the transaction's id → the server asks Apple
 * what was bought and adds the diamonds (supabase/functions/apple-purchase) → the app tells Apple it's delivered
 * ("finish"). A purchase that was paid but not delivered (the app closed, no network) stays waiting on the device
 * and is delivered the next time the app opens (deliverWaitingApplePurchases).
 */

/** Diamond pack → App Store product. Must match PACK_FOR_PRODUCT in supabase/functions/_shared/appStore.ts. */
export const APPLE_PRODUCT_IDS = {
  'diamonds-10': 'app.lumipals.diamonds10',
  'diamonds-60': 'app.lumipals.diamonds60',
  'diamonds-130': 'app.lumipals.diamonds130',
};

// The StoreKit plugin is only loaded in the app, and only when the Shop needs it.
let store = null;
async function appStore() {
  if (!store) {
    const { NativePurchases } = await import('@capgo/native-purchases');
    // Nothing is marked as delivered until our server has added the diamonds.
    await NativePurchases.configure({ autoFinishTransactions: false });
    store = NativePurchases;
  }
  return store;
}

/** Has the server add the diamonds for a paid transaction, then tells Apple it was delivered. */
async function deliver(transactionId) {
  const { data, error } = await supabase.functions.invoke('apple-purchase', { body: { transactionId } });
  if (error || !data?.granted)
    throw new EconomyError('Your payment went through, but the diamonds are late. They’ll arrive when you open the app again.');
  await (await appStore()).finishTransaction({ transactionId });
}

/** Each pack's price as the App Store shows it in the player's own currency: { 'diamonds-10': '0,99 €', … }. */
export async function fetchApplePrices() {
  const { products } = await (await appStore()).getProducts({ productIdentifiers: Object.values(APPLE_PRODUCT_IDS) });
  const priceOf = Object.fromEntries(products.map((product) => [product.identifier, product.priceString]));
  return Object.fromEntries(Object.entries(APPLE_PRODUCT_IDS).map(([packId, productId]) => [packId, priceOf[productId]]));
}

/**
 * Opens Apple's payment sheet for a pack and delivers the diamonds.
 * @returns {Promise<boolean>} false when the player closed the sheet without buying
 */
export async function buyDiamondPackInApp(packId, userId) {
  const shop = await appStore();
  let transaction;
  try {
    transaction = await shop.purchaseProduct({
      productIdentifier: APPLE_PRODUCT_IDS[packId],
      quantity: 1,
      // Stamps the purchase with the buyer's account, so the server credits the right player.
      appAccountToken: userId,
      autoAcknowledgePurchases: false,
    });
  } catch (error) {
    if (/cancel/i.test(error?.message ?? '')) return false;
    throw new EconomyError('The purchase didn’t go through. You were not charged.');
  }
  await deliver(transaction.transactionId);
  return true;
}

/**
 * Delivers purchases that were paid but never reached the server (called when a signed-in player opens the app).
 * @returns {Promise<number>} how many were delivered
 */
export async function deliverWaitingApplePurchases() {
  const { transactions } = await (await appStore()).getUnfinishedTransactions();
  let delivered = 0;
  for (const transaction of transactions) {
    if (!Object.values(APPLE_PRODUCT_IDS).includes(transaction.productIdentifier)) continue;
    try {
      await deliver(transaction.transactionId);
      delivered += 1;
    } catch {
      // Still waiting: it is tried again on the next start.
    }
  }
  return delivered;
}
