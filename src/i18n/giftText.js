import { translate } from './translate.js';
import { helperText } from './gameText.js';
import { outfitName, palName } from './palText.js';
import { decorName } from './groveText.js';
import { accessoryById, palById } from '../game/pals.js';
import { groveItemById } from '../game/grove.js';

/**
 * What came out of a gift, in the player's language, one entry per thing:
 * { key, text, art } where art is { kind: 'shop', id } (sparks, helpers, diamonds) or { kind: 'outfit' | 'decor' | 'pal', id }.
 * `gift` is { sparks, diamonds?, helper? | helpers[], item? | items[] } (several gifts merged list them all);
 * `partner` names who an outfit is for.
 */
export function giftItems(lang, gift, partner = null) {
  const entries = [];
  if (gift.sparks) {
    entries.push({
      key: 'sparks',
      text: translate(lang, 'gift.sparks', { count: gift.sparks }),
      art: { kind: 'shop', id: gift.sparks >= 50 ? 'sparks2' : 'sparks1' },
    });
  }
  if (gift.diamonds)
    entries.push({ key: 'diamonds', text: translate(lang, 'gift.diamonds', { count: gift.diamonds }), art: { kind: 'shop', id: 'diamonds0' } });
  // The same helper twice (several gifts summed up) is one line: "+2 Lens".
  const helpers = gift.helpers ?? (gift.helper ? [gift.helper] : []);
  const helperCounts = helpers.reduce((counts, helper) => counts.set(helper, (counts.get(helper) ?? 0) + 1), new Map());
  helperCounts.forEach((count, helper) => {
    const name = helperText(lang, helper).name;
    entries.push({
      key: `helper-${helper}`,
      text: count > 1 ? translate(lang, 'gift.helperMany', { count, name }) : translate(lang, 'gift.helper', { name }),
      art: { kind: 'shop', id: helper },
    });
  });
  const pals = gift.pals ?? (gift.pal ? [gift.pal] : []);
  pals.forEach((id) => {
    entries.push({ key: `pal-${id}`, text: translate(lang, 'gift.pal', { name: palName(lang, palById(id)) }), art: { kind: 'pal', id } });
  });
  const items = gift.items ?? (gift.item ? [gift.item] : []);
  items.forEach((item) => {
    if (item.type === 'outfit') {
      const name = outfitName(lang, accessoryById(item.id));
      const text = partner ? translate(lang, 'gift.outfitFor', { name, pal: palName(lang, partner) }) : translate(lang, 'gift.outfit', { name });
      entries.push({ key: `item-${item.id}`, text, art: { kind: 'outfit', id: item.id } });
    } else {
      entries.push({
        key: `item-${item.id}`,
        text: translate(lang, 'gift.decor', { name: decorName(lang, groveItemById(item.id)) }),
        art: { kind: 'decor', id: item.id },
      });
    }
  });
  return entries;
}
