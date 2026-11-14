import { PALS } from './pals.js';

/**
 * Public nicknames are built from two safe word lists plus a number the server adds
 * ("Sparkly Dragon 42"), so no one can put a real name or rude word on the worldwide board.
 * Must match public.set_nickname() in supabase/nicknames.sql (a test checks).
 */
export const NICKNAME_WORDS = [
  'Brave', 'Bright', 'Bubbly', 'Calm', 'Clever', 'Cozy', 'Dreamy', 'Fluffy',
  'Gentle', 'Giggly', 'Golden', 'Happy', 'Jolly', 'Lucky', 'Mellow', 'Mighty',
  'Nimble', 'Quiet', 'Rosy', 'Silly', 'Sleepy', 'Sparkly', 'Sunny', 'Swift',
  'Tiny', 'Twinkly', 'Wise', 'Witty', 'Zippy', 'Shiny',
];

export const NICKNAME_NAMES = [...new Set([...PALS.map((pal) => pal.animal), 'Firefly', 'Comet', 'Rainbow', 'Pixel', 'Wizard', 'Explorer'])];

export const isValidNickname = (word, name) => NICKNAME_WORDS.includes(word) && NICKNAME_NAMES.includes(name);
