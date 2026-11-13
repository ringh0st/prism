import { hashString } from '../lib/random.js';
import { DIFFICULTY } from './constants.js';

const ADJECTIVES = [
  'Wobbly', 'Sneaky', 'Sparkly', 'Grumpy', 'Dizzy', 'Fancy', 'Sleepy', 'Bouncy', 'Shiny', 'Spicy', 'Jolly', 'Cheeky',
  'Fizzy', 'Glowing', 'Tiny', 'Mighty', 'Curious', 'Clumsy', 'Brave', 'Giggly', 'Zesty', 'Sassy', 'Toasty', 'Wiggly',
];
const NOUNS = [
  'Photon', 'Mirror', 'Gem', 'Beam', 'Lantern', 'Rainbow', 'Pickle', 'Noodle', 'Penguin', 'Waffle', 'Comet', 'Disco Ball',
  'Taco', 'Prism', 'Firefly', 'Pancake', 'Sunbeam', 'Llama', 'Teapot', 'Spotlight', 'Marshmallow', 'Unicorn', 'Toaster', 'Glowworm',
];
const BOSS_NAMES = [
  'The Big Glare', 'Beamzilla', 'Mirror Mirror on the Wall', 'The Final Flash', 'Lord of the Lights', 'Glare Bear',
  'The Photon Pharaoh', 'Shadow Supreme', 'Raging Rainbow', 'The Dazzler', 'Captain Glitter', 'Mega Mirrorball',
];
const HARD_NAMES = [
  'Brain Melter', 'Tricky Business', 'Sweat Mode', 'No Peeking', 'Spaghetti Beams', 'Knot Today', 'Twist & Shout',
  'Mind the Gap', 'Bendy Bonanza', 'Pretzel Logic', 'Hold My Prism', 'Uh-Oh Zone',
];

/** A funny, stable name for every level, so "Level 12-7" becomes "The Sneaky Pickle". */
export function levelNameFor(level) {
  if (level.name) return level.name;
  const hash = hashString(level.id);
  if (level.difficulty === DIFFICULTY.EXTRA) return BOSS_NAMES[hash % BOSS_NAMES.length];
  if (level.difficulty === DIFFICULTY.HARD) return HARD_NAMES[hash % HARD_NAMES.length];
  return `The ${ADJECTIVES[hash % ADJECTIVES.length]} ${NOUNS[(hash >>> 8) % NOUNS.length]}`;
}
