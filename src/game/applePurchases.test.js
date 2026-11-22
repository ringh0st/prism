import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DIAMOND_PACKS } from './catalog.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

/** Every `'key': 'value'` pair inside the object literal that starts at `name`. */
function pairsOf(source, name) {
  const body = source.slice(source.indexOf(name));
  const block = body.slice(body.indexOf('{') + 1, body.indexOf('}'));
  return [...block.matchAll(/'([^']+)':\s*'([^']+)'/g)].map(([, key, value]) => [key, value]);
}

test('App Store products: the app and the server agree, and every diamond pack has one', () => {
  const app = pairsOf(read('../lib/applePurchases.js'), 'export const APPLE_PRODUCT_IDS');
  const server = pairsOf(read('../../supabase/functions/_shared/appStore.ts'), 'export const PACK_FOR_PRODUCT');
  assert.deepEqual(
    server.map(([product, pack]) => [pack, product]),
    app,
  );
  assert.deepEqual(
    app.map(([pack]) => pack),
    DIAMOND_PACKS.map((pack) => pack.id),
  );
});
