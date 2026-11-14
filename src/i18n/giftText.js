import { translate } from './translate.js';
import { helperText } from './gameText.js';
import { outfitName, palName } from './palText.js';
import { decorName } from './groveText.js';
import { accessoryById } from '../game/pals.js';
import { groveItemById } from '../game/grove.js';

/**
 * What came out of a gift, in the player's language, one entry per thing:
 * { key, text, art } where art is { kind: 'shop', id } (sparks, helpers, diamonds) or { kind: 'outfit' | 'decor', id }.
 * `gift` is { sparks, helper?, diamonds?, item? }; `partner` names who an outfit is for.
 */
export function giftItems(lang, gift, partner = null) {
  const items = [];
  if (gift.sparks) {
    items.push({
      key: 'sparks',
      text: translate(lang, 'gift.sparks', { count: gift.sparks }),
      art: { kind: 'shop', id: gift.sparks >= 50 ? 'sparks2' : 'sparks1' },
    });
  }
  if (gift.diamonds)
    items.push({ key: 'diamonds', text: translate(lang, 'gift.diamonds', { count: gift.diamonds }), art: { kind: 'shop', id: 'diamonds0' } });
  if (gift.helper)
    items.push({
      key: 'helper',
      text: translate(lang, 'gift.helper', { name: helperText(lang, gift.helper).name }),
      art: { kind: 'shop', id: gift.helper },
    });
  if (gift.item?.type === 'outfit') {
    const name = outfitName(lang, accessoryById(gift.item.id));
    const text = partner ? translate(lang, 'gift.outfitFor', { name, pal: palName(lang, partner) }) : translate(lang, 'gift.outfit', { name });
    items.push({ key: 'item', text, art: { kind: 'outfit', id: gift.item.id } });
  }
  if (gift.item?.type === 'decor') {
    items.push({
      key: 'item',
      text: translate(lang, 'gift.decor', { name: decorName(lang, groveItemById(gift.item.id)) }),
      art: { kind: 'decor', id: gift.item.id },
    });
  }
  return items;
}
