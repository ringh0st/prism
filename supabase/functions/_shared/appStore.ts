// Talking to Apple's App Store Server API: used to check an in-app purchase with Apple itself, so the game never
// has to be trusted about what was paid. Needs three secrets from App Store Connect (see PAYMENTS.md):
// APPLE_IAP_ISSUER_ID, APPLE_IAP_KEY_ID and APPLE_IAP_PRIVATE_KEY (the .p8 file's text).
import { requireEnv } from './http.ts';

export const APPLE_BUNDLE_ID = 'app.lumipals';

/** App Store product → diamond pack. Must match APPLE_PRODUCT_IDS in src/lib/applePurchases.js (a test checks). */
export const PACK_FOR_PRODUCT: Record<string, string> = {
  'app.lumipals.diamonds10': 'diamonds-10',
  'app.lumipals.diamonds60': 'diamonds-60',
  'app.lumipals.diamonds130': 'diamonds-130',
};

/** One purchase per App Store transaction. */
export const orderIdFor = (transactionId: string) => `apple_${transactionId}`;

const PRODUCTION = 'https://api.storekit.itunes.apple.com';
const SANDBOX = 'https://api.storekit-sandbox.itunes.apple.com';

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
const encodeJson = (value: unknown) => base64Url(new TextEncoder().encode(JSON.stringify(value)));

/** The middle part of a signed token (JWS), as an object. Only for tokens that came straight from Apple's API. */
export function decodePayload(jws: string): Record<string, unknown> {
  const part = (jws.split('.')[1] ?? '').replaceAll('-', '+').replaceAll('_', '/');
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part), (char) => char.charCodeAt(0))));
}

/** A short-lived token that proves to Apple that the request comes from this app's owner. */
async function appStoreToken(): Promise<string> {
  const pem = requireEnv('APPLE_IAP_PRIVATE_KEY')
    .replace(/-----[A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const key = await crypto.subtle.importKey(
    'pkcs8',
    Uint8Array.from(atob(pem), (char) => char.charCodeAt(0)),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const now = Math.floor(Date.now() / 1000);
  const head = encodeJson({ alg: 'ES256', kid: requireEnv('APPLE_IAP_KEY_ID'), typ: 'JWT' });
  const body = encodeJson({ iss: requireEnv('APPLE_IAP_ISSUER_ID'), iat: now, exp: now + 300, aud: 'appstoreconnect-v1', bid: APPLE_BUNDLE_ID });
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${base64Url(new Uint8Array(signature))}`;
}

export type AppleTransaction = {
  transactionId: string;
  bundleId: string;
  productId: string;
  appAccountToken?: string;
  revocationDate?: number;
  price?: number; // in thousandths of the currency unit
  currency?: string;
};

/**
 * Asks Apple for a transaction by its id: the live store first, then the sandbox (test purchases, and Apple's
 * reviewers, buy there). Returns null when Apple doesn't know it. The answer arrives from Apple over HTTPS, so it
 * is trusted as it is.
 */
export async function fetchAppleTransaction(transactionId: string): Promise<AppleTransaction | null> {
  const token = await appStoreToken();
  for (const host of [PRODUCTION, SANDBOX]) {
    const response = await fetch(`${host}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const { signedTransactionInfo } = await response.json();
      return decodePayload(signedTransactionInfo) as AppleTransaction;
    }
    if (response.status !== 404) throw new Error(`App Store answered ${response.status}: ${await response.text()}`);
  }
  return null;
}
