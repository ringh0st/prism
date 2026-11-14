import { en as meEn } from './strings/sections/me.js';
import { en as giftsEn } from './strings/sections/gifts.js';

/*
 * Player-facing messages that come from game modules or the server in English (EconomyError), shown
 * in the player's language when we know them; anything else is shown as it came.
 */
const KNOWN_ERRORS = new Map(
  Object.entries({ ...meEn, ...giftsEn })
    .filter(([key]) => key.startsWith('ui.error.') || key.startsWith('me.nickname.rule.') || key === 'ui.signInDiamonds')
    .map(([key, english]) => [english, key]),
);

/** `message` in the player's language (via `t`), or unchanged when it isn't one we know. */
export const errorText = (t, message) => (KNOWN_ERRORS.has(message) ? t(KNOWN_ERRORS.get(message)) : message);
