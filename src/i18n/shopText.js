import { translate } from './translate.js';
import { outfitName } from './palText.js';
import { decorName } from './groveText.js';
import { accessoryById } from '../game/pals.js';

/*
 * Shop content in the player's language. The game modules keep the English names (themes.js, catalog.js);
 * these look up the translation by id and fall back to that English.
 */

/** A weekly theme collection's name and tagline. */
export const themeText = (lang, theme) => ({
  name: translate(lang, `themeSet.${theme.id}.name`, {}, theme.name),
  tagline: translate(lang, `themeSet.${theme.id}.tagline`, {}, theme.tagline),
});

/** The name of anything on the Pal shelves: an outfit piece or a decoration (regular or from a weekly theme). */
export const shopItemName = (lang, item) => (accessoryById(item.id) ? outfitName(lang, item) : decorName(lang, item));

/** A diamond pack's ribbon ("Popular", "Best value") or null. */
export const packTag = (lang, pack) => (pack.tag ? translate(lang, `item.${pack.id}.tag`, {}, pack.tag) : null);
