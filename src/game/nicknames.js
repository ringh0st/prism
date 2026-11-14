import { PALS } from './pals.js';

/**
 * Public Top-board nicknames: players type their own (or roll a random one). Because the board is
 * worldwide and for all ages, the same rules run in the game and on the server
 * (public.set_nickname() in supabase/nicknames.sql; a test keeps the blocked list in sync).
 */
export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 16;

/** Blocked word parts (checked after lowercasing, removing spaces and common look-alike digits). */
export const BLOCKED_NICKNAME_PARTS = [
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'cock', 'penis', 'vagina', 'boob', 'porn', 'sex',
  'slut', 'whore', 'nigg', 'fag', 'nazi', 'hitler', 'rape', 'kill', 'piss', 'bastard', 'admin', 'moderator',
];

const LOOK_ALIKES = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };

const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[\s_.-]/g, '')
    .replace(/[0134573@$]/g, (char) => LOOK_ALIKES[char] ?? char);

/** @returns a player-facing reason, or null when the nickname is fine */
export function nicknameProblem(raw) {
  const nickname = raw.trim().replace(/\s+/g, ' ');
  if (nickname.length < NICKNAME_MIN) return `At least ${NICKNAME_MIN} characters, please.`;
  if (nickname.length > NICKNAME_MAX) return `At most ${NICKNAME_MAX} characters, please.`;
  if (!/^[\p{L}\p{N} ]+$/u.test(nickname)) return 'Letters, numbers and spaces only.';
  if (/\d{5,}/.test(nickname)) return 'Too many numbers in a row.';
  if (BLOCKED_NICKNAME_PARTS.some((part) => normalize(nickname).includes(part))) return 'Let’s pick a friendlier name.';
  return null;
}

const RANDOM_WORDS = [
  'Brave', 'Bright', 'Bubbly', 'Calm', 'Clever', 'Cozy', 'Dreamy', 'Fluffy', 'Gentle', 'Giggly', 'Golden', 'Happy',
  'Jolly', 'Lucky', 'Mellow', 'Mighty', 'Nimble', 'Rosy', 'Silly', 'Sleepy', 'Sparkly', 'Sunny', 'Swift', 'Tiny', 'Zippy',
];
const RANDOM_NAMES = [...new Set([...PALS.map((pal) => pal.animal), 'Firefly', 'Comet', 'Rainbow', 'Pixel', 'Wizard'])];

/** A fun random nickname that always passes the rules, like "Sparkly Dragon 42". */
export function randomNickname(random = Math.random) {
  const pick = (list) => list[Math.floor(random() * list.length)];
  for (;;) {
    const nickname = `${pick(RANDOM_WORDS)} ${pick(RANDOM_NAMES)} ${10 + Math.floor(random() * 90)}`;
    if (!nicknameProblem(nickname)) return nickname;
  }
}
