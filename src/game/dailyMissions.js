import { dailyNumber } from './daily.js';
import { glowbugForLevel } from './glowbugs.js';
import { solvedLevelCount } from './milestones.js';

/*
 * Daily missions: three small goals each day (the player's local midnight, like the win gifts), each paying a few
 * sparks, plus a small bonus for finishing all three. One "solve" mission every day, then two of other kinds, drawn
 * the same way for everyone on that day from the missions the player can already do (`minSolved` built-in levels
 * solved). Accounts only get missions the server can count (`guestOnly` ones are left out). The day's three are
 * kept once they're first counted, so they never change halfway through a day.
 * Mirrors supabase/daily_missions.sql (a test checks).
 */
export const DAILY_MISSIONS = [
  { id: 'solve2', kind: 'solved', target: 2, sparks: 10, minSolved: 0 },
  { id: 'solve3', kind: 'solved', target: 3, sparks: 15, minSolved: 0 },
  { id: 'solve4', kind: 'solved', target: 4, sparks: 20, minSolved: 0 },
  { id: 'perfect1', kind: 'perfect', target: 1, sparks: 10, minSolved: 0 },
  { id: 'perfect2', kind: 'perfect', target: 2, sparks: 15, minSolved: 0 },
  { id: 'daily1', kind: 'daily', target: 1, sparks: 15, minSolved: 3 },
  { id: 'hard1', kind: 'hard', target: 1, sparks: 20, minSolved: 4 },
  { id: 'glowbug1', kind: 'glowbug', target: 1, sparks: 15, minSolved: 40 },
  { id: 'present1', kind: 'present', target: 1, sparks: 10, minSolved: 5, guestOnly: true },
  { id: 'combo1', kind: 'combo', target: 1, sparks: 15, minSolved: 10, guestOnly: true },
];

/** Paid with the last of the day's three. */
export const MISSIONS_BONUS_SPARKS = 10;

/** Missions start once the map's extras show up (after the first steps). */
export const MISSIONS_AFTER_LEVELS = 3;

const KINDS_FROM_LEVELS = ['solved', 'perfect', 'hard', 'glowbug', 'combo'];

export const missionById = (id) => DAILY_MISSIONS.find((mission) => mission.id === id) ?? null;

/** A fixed shuffle key per mission and day (Knuth's multiplicative hash; exact in JS and in Postgres bigint). */
const shuffleKey = (day, index) => ((day + 1) * (2 * index + 1) * 2654435761) % 4294967296;

/**
 * The day's three mission ids: a "solve" mission (sizes take turns), then the two first missions of different
 * kinds in the day's shuffle among those the player can do. Empty before MISSIONS_AFTER_LEVELS.
 */
export function dailyMissionIdsFor(date, { solved, isSignedIn = false }) {
  if (solved < MISSIONS_AFTER_LEVELS) return [];
  const day = dailyNumber(date);
  const solves = DAILY_MISSIONS.filter((mission) => mission.kind === 'solved');
  const picked = [solves[((day % solves.length) + solves.length) % solves.length]];
  const others = DAILY_MISSIONS.map((mission, index) => ({ mission, index }))
    .filter(({ mission }) => mission.kind !== 'solved' && solved >= mission.minSolved && !(isSignedIn && mission.guestOnly))
    .sort((a, b) => shuffleKey(day, a.index) - shuffleKey(day, b.index) || a.index - b.index);
  for (const { mission } of others) {
    if (picked.length < 3 && picked.every((chosen) => chosen.kind !== mission.kind)) picked.push(mission);
  }
  return picked.map((mission) => mission.id);
}

const emptyLog = (date, missions) => ({ date, missions, solved: [], perfect: [], hard: [], glowbug: [], combo: [], present: [], claimed: [] });

/** Today's log: { date, missions: [ids], solved, perfect, hard, glowbug, combo, present: [counted], claimed: [ids] }. */
export function missionLogFor(progress, today, isSignedIn = false) {
  const log = progress.missions;
  if (log?.date === today) return log;
  return emptyLog(today, dailyMissionIdsFor(today, { solved: solvedLevelCount(progress), isSignedIn }));
}

/** Keeps today's three from the first thing counted today on (the draw depends on progress, which grows). */
export function startMissionDay(progress, today, isSignedIn = false) {
  if (progress.missions?.date === today) return progress;
  const log = missionLogFor(progress, today, isSignedIn);
  return log.missions.length ? { ...progress, missions: log } : progress;
}

export const todaysMissions = (log) => log.missions.map(missionById).filter(Boolean);

/** How far a mission is (the daily puzzle counts from the daily streak's date). */
export function missionCount(progress, log, mission) {
  if (mission.kind === 'daily') return progress.daily.lastDate === log.date ? 1 : 0;
  return log[mission.kind]?.length ?? 0;
}

export const isMissionReady = (progress, log, mission) => !log.claimed.includes(mission.id) && missionCount(progress, log, mission) >= mission.target;

/** Missions finished and not collected yet (for the badges). */
export function readyMissionCount(progress, today, isSignedIn = false) {
  const log = missionLogFor(progress, today, isSignedIn);
  return todaysMissions(log).filter((mission) => isMissionReady(progress, log, mission)).length;
}

const isHardLevel = (levelId) => Number(/^w\d+-(\d{2})$/.exec(levelId)?.[1]) % 5 === 0;

/**
 * A solved built-in level (not a Skip) counts toward today's missions, each level once a day. Call it on progress
 * that went through startMissionDay before the level was recorded. `bestStars` is the level's best after this win.
 */
export function recordMissionLevel(progress, levelId, { bestStars, combo = 0 }, today) {
  const log = progress.missions;
  if (log?.date !== today || !/^w\d+-\d{2}$/.test(levelId)) return progress;
  const counts = {
    solved: true,
    perfect: bestStars === 3,
    hard: isHardLevel(levelId),
    glowbug: bestStars === 3 && Boolean(glowbugForLevel(levelId)),
    combo: combo >= 2,
  };
  const next = { ...log };
  for (const kind of KINDS_FROM_LEVELS) {
    if (counts[kind] && !next[kind].includes(levelId)) next[kind] = [...next[kind], levelId];
  }
  return { ...progress, missions: next };
}

/** An opened present counts toward today's missions (guests). */
export function recordMissionPresent(progress, today) {
  const log = progress.missions;
  if (log?.date !== today) return progress;
  return { ...progress, missions: { ...log, present: [...log.present, progress.presents.opened] } };
}

/** The sparks a mission pays when collected: its own, plus the bonus when it's the last of the day's three. */
export function missionPayout(log, mission) {
  const isLast = log.claimed.length + 1 === log.missions.length;
  return { sparks: mission.sparks + (isLast ? MISSIONS_BONUS_SPARKS : 0), isLast };
}

/** Collect a finished mission's sparks (guests). @returns { progress, gift: { sparks } } @throws Error when it isn't ready */
export function claimMissionLocally(progress, missionId, today) {
  const started = startMissionDay(progress, today);
  const log = missionLogFor(started, today);
  const mission = log.missions.includes(missionId) ? missionById(missionId) : null;
  if (!mission || !isMissionReady(started, log, mission)) throw new Error('This mission isn’t finished yet.');
  const { sparks } = missionPayout(log, mission);
  return {
    progress: { ...started, sparks: started.sparks + sparks, missions: { ...log, claimed: [...log.claimed, missionId] } },
    gift: { sparks },
  };
}
