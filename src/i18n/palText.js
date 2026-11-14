import { translate } from './translate.js';
import { RARITY_NAMES } from '../game/pals.js';
import { withArticle } from '../game/treats.js';

/*
 * Pal content in the player's language. src/game/pals.js, quests.js and treats.js keep the English;
 * these look up the translation by id (palName.*, palBio.*, outfit.*, quest.*, treat.*) and fall back to it.
 */

/** A Pal's name ("Ember"). */
export const palName = (lang, pal) => translate(lang, `palName.${pal.id}`, {}, pal.name);

/** What a Pal is ("Fox", "Phoenix"), kept under palBio.<id>. */
export const palSpecies = (lang, pal) => translate(lang, `palBio.${pal.id}`, {}, pal.species);

/** "Ember the Fox". */
export const palWithSpecies = (lang, pal) => translate(lang, 'pals.nameSpecies', { name: palName(lang, pal), species: palSpecies(lang, pal) });

/** A growth form's name ("Baby" … "Master"), from palStage() or PAL_STAGES. */
export const stageName = (lang, stage) => translate(lang, `stage.${stage.id}`, {}, stage.name);

/** "Basic", "Legendary" or "Mythic" (without the symbol). */
export const rarityName = (lang, rarity) => translate(lang, `pals.rarity.${rarity}`, {}, RARITY_NAMES[rarity]);

/** An outfit piece's name ("Cozy beanie"). Theme pieces use the same outfit.<id> keys. */
export const outfitName = (lang, item) => translate(lang, `outfit.${item.id}`, {}, item.name);

/** A wardrobe slot's heading ("Hats"), from PAL_SLOTS. */
export const slotName = (lang, slot) => translate(lang, `pals.slot.${slot.id}`, {}, slot.name);

/** A treat with its article: "a cookie", "una galleta" ("עוגייה" in Hebrew, which has no indefinite article). */
export const treatName = (lang, treat) => translate(lang, `treat.${treat.id}`, {}, withArticle(treat));

/** A quest's goal, with the partner's (already translated) name. */
export const questText = (lang, quest, name) => translate(lang, `quest.${quest.id}`, { name }, quest.text(name));

/** How a locked Pal is earned: "Collect 30 ★", "Finish 2 worlds", "Reach a 7-day streak" or "Lucky Pal gift". */
export function unlockText(lang, { stars, worlds, streak, lucky }) {
  if (lucky) return translate(lang, 'pals.lucky.title');
  if (stars) return translate(lang, 'pals.unlock.stars', { stars });
  if (worlds) return translate(lang, 'pals.unlock.worlds', { count: worlds });
  return translate(lang, 'pals.unlock.streak', { streak });
}
