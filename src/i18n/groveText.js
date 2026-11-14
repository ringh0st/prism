import { translate } from './translate.js';
import { GLOWBUG_COLORS, GLOWBUG_KINDS } from '../game/glowbugs.js';

/*
 * Grove decor and Glowbugs in the player's language. The game modules keep the English (grove.js,
 * themes.js, glowbugs.js); these look up the translation by id and fall back to that English.
 */

/** A piece of Grove decor's name (regular or from a weekly theme). */
export const decorName = (lang, item) => translate(lang, `decor.${item.id}`, {}, item.name);

/** A Grove spot's name ("Homes", "Seats & swings"…). */
export const spotName = (lang, spot) => translate(lang, `decor.spot.${spot.id}`, {}, spot.name);

/** A Glowbug's own name ("Pip"): kept in Latin letters in Spanish, spelled in Hebrew letters in Hebrew. */
export const glowbugName = (lang, bug) => translate(lang, `bug.name.${bug.id}`, {}, bug.name);

/** "Peach Firefly" in English; each language puts the color and kind in its own order. */
export function glowbugTitle(lang, bug) {
  if (lang === 'en') return bug.title;
  const kind = GLOWBUG_KINDS.find((entry) => entry.id === bug.kind);
  const color = GLOWBUG_COLORS.find((entry) => entry.id === bug.color);
  return translate(lang, 'bug.title', {
    kind: translate(lang, `bug.kind.${kind.id}`, {}, kind.name),
    color: translate(lang, `bug.color.${color.id}`, {}, color.name),
  });
}

/** "Pip blinks hello in morse code…": the Glowbug's name and its kind's bio. */
export function glowbugBio(lang, bug) {
  if (lang === 'en') return bug.bio;
  return translate(lang, 'bug.bio', { name: glowbugName(lang, bug), bio: translate(lang, `bug.bio.${bug.kind}`) });
}

/**
 * A sentence split around one of its placeholders, so the screen can show that part big:
 * "{found} of 60 Glowbugs found" → ['', ' of 60 Glowbugs found']. Word order follows the language.
 */
export function splitAround(text, marker = '\u0000') {
  const [before = '', after = ''] = text.split(marker);
  return [before, after];
}
