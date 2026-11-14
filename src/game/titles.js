/** Player titles, earned by collecting stars. Each has its own color (see TitleBadge). */
export const PLAYER_TITLES = [
  { name: 'Spark Scout', stars: 0, tone: 'scout' },
  { name: 'Beam Bender', stars: 30, tone: 'bender' },
  { name: 'Mirror Mender', stars: 120, tone: 'mender' },
  { name: 'Prism Pro', stars: 300, tone: 'pro' },
  { name: 'Light Legend', stars: 900, tone: 'legend' },
  { name: 'Sun Sage', stars: 2000, tone: 'sage' },
  { name: 'Master of Light', stars: 3000, tone: 'master' },
];

/** The current title, the next one (null at the top) and progress toward it (0 to 1). */
export function titleFor(stars) {
  const index = PLAYER_TITLES.findLastIndex((title) => stars >= title.stars);
  const current = PLAYER_TITLES[index];
  const next = PLAYER_TITLES[index + 1] ?? null;
  const progress = next ? (stars - current.stars) / (next.stars - current.stars) : 1;
  return { current, next, progress };
}

/*
 * Player level: a number that climbs with stars, quickly at first (Lv 2 at 5 ★, Lv 5 at 50 ★) and
 * slower later (Lv 20 at 950 ★, Lv 35 at 2975 ★), so there is always a next level in sight.
 */
const STARS_PER_LEVEL_STEP = 5;

/** Stars needed to reach a player level. */
export const starsForPlayerLevel = (level) => (STARS_PER_LEVEL_STEP * (level - 1) * level) / 2;

/** The player level for a star total, the stars it started at, the stars the next one needs, and progress (0 to 1). */
export function playerLevelFor(stars) {
  let level = 1;
  while (stars >= starsForPlayerLevel(level + 1)) level += 1;
  const from = starsForPlayerLevel(level);
  const to = starsForPlayerLevel(level + 1);
  return { level, from, to, progress: (stars - from) / (to - from) };
}

const starsIn = (levels) => Object.values(levels).reduce((sum, entry) => sum + (entry.stars ?? 0), 0);

/** What a solve climbed to: { levelUp: new player level or null, newTitle: new title or null }. */
export function climbFor(levelsBefore, levelsAfter) {
  const before = starsIn(levelsBefore);
  const after = starsIn(levelsAfter);
  const levelAfter = playerLevelFor(after).level;
  const titleAfter = titleFor(after).current;
  return {
    levelUp: levelAfter > playerLevelFor(before).level ? levelAfter : null,
    newTitle: titleAfter !== titleFor(before).current ? titleAfter : null,
  };
}

/** Solved built-in levels ("w3-01" … "w3-20", at least one star) per world number. */
function solvedCountByWorld(levels) {
  const solvedPerWorld = new Map();
  for (const [id, entry] of Object.entries(levels)) {
    const world = /^w(\d+)-\d{2}$/.exec(id)?.[1];
    if (world && entry.stars > 0) solvedPerWorld.set(Number(world), (solvedPerWorld.get(Number(world)) ?? 0) + 1);
  }
  return solvedPerWorld;
}

/** Worlds where every built-in level has at least one star. */
export function finishedWorldCount(levels, levelsPerWorld = 20) {
  return [...solvedCountByWorld(levels).values()].filter((count) => count >= levelsPerWorld).length;
}
