/*
 * Coming back from a payment page. The payment page sends the player back to `/play/?checkout=thanks` (or
 * `=cancel`) rather than to a #/ route, because a #fragment doesn't always survive the trip. Before the game
 * renders, this swaps the query for the store's own route, so the player lands on the thank-you screen.
 */
const RETURN_ROUTES = { thanks: '#/store/thanks', cancel: '#/store' };

/** Where the payment page sends the player afterwards (`outcome`: 'thanks' | 'cancel'). */
export const checkoutReturnUrl = (outcome) => `${window.location.origin}${window.location.pathname}?checkout=${outcome}`;

/** Turn ?checkout=… into the store route. Call once, before the first render. */
export function applyCheckoutReturn() {
  const outcome = new URLSearchParams(window.location.search).get('checkout');
  const route = RETURN_ROUTES[outcome];
  if (route) window.history.replaceState(null, '', `${window.location.pathname}${route}`);
}

/** Is this the thank-you screen after paying? (The splash is skipped there: the player only stepped out.) */
export const isCheckoutThanks = (route) => route.name === 'store' && route.params[0] === 'thanks';
