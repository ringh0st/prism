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
  home: { left: 26, top: 74, emote: '🏠', line: 'Home sweet home!', action: 'wave' },
  seat: { left: 80, top: 68, emote: '♪', line: 'Ahh, comfy.', action: 'sit' },
  light: { left: 56, top: 64, emote: '✨', line: 'So pretty and glowy!', action: 'lookUp' },
  garden: { left: 16, top: 88, emote: '🌸', line: 'Mmm, smells lovely!', action: 'sniff' },
  water: { left: 78, top: 88, emote: '💧', line: 'Splish splash!', action: 'splash' },
  sky: { left: 50, top: 72, emote: '☁️', line: 'Look up there!', action: 'lookUp' },
};

/** Things a Pal does on the spot, just for fun. */
export const PLAY_ACTIONS = ['jump', 'spin', 'dance', 'stretch', 'lookAround', 'wiggle'];
const PLAY_EMOTES = { jump: '!', spin: '✦', dance: '♪', stretch: null, lookAround: '?', wiggle: '♥' };

/** Little moods the Pal shows now and then wherever it is. */
const IDLE_EMOTES = ['♥', '♪', '✦', '!', '♥'];

/** The bed spot for naps: by the house if there is one, else the middle of the clearing. */
export const napSpot = (spots) => (spots.includes('home') ? SPOT_VISITS.home : { left: 50, top: 76 });

/**
 * The Pal's next little activity: visit a piece of decor (and use it), play on the spot (jump, spin,
 * dance…), or wander somewhere, sometimes with a mood.
 * @param spots the Grove spots that have decor
 * @param roll  random numbers in [0, 1) (injected so tests are predictable)
 * @returns {{ left?, top?, emote, line, action }} no left/top means it stays where it is
 */
export function nextActivity(spots, [kind, pick, x, y] = [Math.random(), Math.random(), Math.random(), Math.random()]) {
  if (spots.length && kind < 0.4) {
    const spot = spots[Math.floor(pick * spots.length)];
    return { ...SPOT_VISITS[spot] };
  }
  if (kind < 0.65) {
    const action = PLAY_ACTIONS[Math.floor(pick * PLAY_ACTIONS.length)];
    return { emote: PLAY_EMOTES[action], line: null, action };
  }
  const left = 24 + x * 52;
  const top = 70 + y * 14;
  return { left, top, emote: kind < 0.85 ? null : IDLE_EMOTES[Math.floor(pick * IDLE_EMOTES.length)], line: null, action: null };
}

/** The season, by month (northern hemisphere): snow in winter, blossoms in spring, leaves in autumn. */
export function seasonOf(date = new Date()) {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

/**
 * Which friend from your team drops by today, if any: one of your other Pals, a different one each day,
 * visiting in the daytime for two hours out of every three. Never at night.
 * @returns a Pal id or null
 */
export function visitingFriend(ownedIds, partnerId, date = new Date()) {
  const friends = ownedIds.filter((id) => id !== partnerId);
  if (!friends.length || timeOfDay(date) === 'night' || date.getHours() % 3 === 0) return null;
  const day = Math.floor(date.getTime() / 86_400_000);
  return friends[day % friends.length];
}

/** What a Pal says when it's tapped while visiting. */
export const FRIEND_LINES = ['Just visiting!', 'Nice place!', 'Want to play?', 'Hi hi hi!', 'I brought snacks!'];
