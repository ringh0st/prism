/*
 * A little life for the partner Pal in the Grove: it wanders around, visits the decor you placed and
 * reacts with emotes, follows the time of day and naps late at night. Pure logic, no React or DOM.
 */

/** Morning, day, evening or night, by the player's own clock. */
export function timeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 9) return 'dawn';
  if (hour >= 9 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'dusk';
  return 'night';
}

/** Late at night the Pal is asleep (tap to wake it for a moment). */
export const isNapTime = (date = new Date()) => date.getHours() >= 23 || date.getHours() < 6;

/** Where the Pal goes to use each spot's decor (% of the scene, by its feet), and how it reacts there. */
export const SPOT_VISITS = {
  home: { left: 26, top: 74, emote: '🏠', line: 'Home sweet home!' },
  seat: { left: 80, top: 68, emote: '♪', line: 'Ahh, comfy.' },
  light: { left: 56, top: 64, emote: '✨', line: 'So pretty and glowy!' },
  garden: { left: 16, top: 88, emote: '🌸', line: 'Mmm, smells lovely!' },
  water: { left: 78, top: 88, emote: '💧', line: 'Splish splash!' },
  sky: { left: 50, top: 72, emote: '☁️', line: 'Look up there!' },
};

/** Little moods the Pal shows now and then wherever it is. */
const IDLE_EMOTES = ['♥', '♪', '✦', '!', '♥'];

/** The bed spot for naps: by the house if there is one, else the middle of the clearing. */
export const napSpot = (spots) => (spots.includes('home') ? SPOT_VISITS.home : { left: 50, top: 76 });

/**
 * The Pal's next little activity: wander somewhere, visit a piece of decor, or just show a mood.
 * @param spots the Grove spots that have decor
 * @param roll  random numbers in [0, 1) (injected so tests are predictable)
 * @returns {{ left, top, emote, line }}
 */
export function nextActivity(spots, [kind, pick, x, y] = [Math.random(), Math.random(), Math.random(), Math.random()]) {
  if (spots.length && kind < 0.45) {
    const spot = spots[Math.floor(pick * spots.length)];
    return { ...SPOT_VISITS[spot] };
  }
  const left = 24 + x * 52;
  const top = 70 + y * 14;
  return { left, top, emote: kind < 0.8 ? null : IDLE_EMOTES[Math.floor(pick * IDLE_EMOTES.length)], line: null };
}
