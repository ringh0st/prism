import { hashString } from '../lib/random.js';
import { DIFFICULTY } from './constants.js';
import { difficultyFor, levelId } from './worlds.js';
import { questWeekOf } from './quests.js';

/*
 * Light Rush: a weekly run of 30 built-in puzzles, the same for everyone, from World 1 up to World 15.
 * One pot of spare moves lasts the whole run: solving a puzzle in its par costs nothing, every extra
 * move (and every move thrown away by restarting) uses a spare, and running out ends the run. Every 5
 * puzzles adds a few spares. The score is how many puzzles you clear. Mirrors supabase/rush.sql.
 */
export const RUSH_LENGTH = 30;
export const RUSH_START_SPARE = 12;
export const RUSH_BONUS_EVERY = 5;
export const RUSH_BONUS_SPARE = 3;
/** Light Rush opens once World 3 is finished. */
export const RUSH_UNLOCK_WORLDS = 3;
/** Sparks for reaching each milestone, once a week. */
export const RUSH_MILESTONES = [
  { cleared: 5, sparks: 20 },
  { cleared: 10, sparks: 40 },
  { cleared: 20, sparks: 80 },
  { cleared: 30, sparks: 150 },
];

/** Runs follow the Pal-quest week: Monday to Sunday, UTC. */
export const rushWeekOf = questWeekOf;

/** This week's 30 puzzles: two different ones from each of Worlds 1–15; Hard levels join in the last third. */
export function rushLevelIds(week) {
  return Array.from({ length: RUSH_LENGTH }, (_, k) => {
    const world = 1 + Math.floor(k / 2);
    const allowed = k >= 20 ? [DIFFICULTY.NORMAL, DIFFICULTY.HARD] : [DIFFICULTY.NORMAL];
    const shuffled = Array.from({ length: 19 }, (_, i) => i + 1)
      .filter((index) => allowed.includes(difficultyFor(index)) && !(world === 1 && index <= 3))
      .sort((a, b) => hashString(`rush-${week}-${world}-${a}`) - hashString(`rush-${week}-${world}-${b}`));
    return levelId(world, shuffled[k % 2]);
  });
}

/** A run: puzzles cleared, spares left, and the moves made so far on the current puzzle (`pending`). */
export const newRun = (week) => ({ week, cleared: 0, spare: RUSH_START_SPARE, pending: 0 });

/** The most moves this puzzle allows: its par plus every spare left. */
export const rushMoveLimit = (run, par) => par + run.spare;

/** After a solve: the extra moves come out of the spares, and every 5th clear adds a bonus. */
export function afterRushSolve(run, par, moves) {
  const cleared = run.cleared + 1;
  const bonus = cleared % RUSH_BONUS_EVERY === 0 ? RUSH_BONUS_SPARE : 0;
  return { ...run, cleared, spare: Math.max(0, run.spare - Math.max(0, moves - par)) + bonus, pending: 0 };
}

/** Restarting a puzzle throws its moves away, so they come out of the spares. */
export const afterRushRestart = (run, movesMade) => ({ ...run, spare: Math.max(0, run.spare - movesMade), pending: 0 });

/** Coming back to a run after leaving mid-puzzle: the moves made there are spent, like a restart. */
export const resumeRushRun = (run) => afterRushRestart(run, run.pending ?? 0);

export const isRushComplete = (run) => run.cleared >= RUSH_LENGTH;

/** This week's best and paid milestones: { week, best, paid: [cleared…] }. */
export function rushRecordFor(progress, week) {
  const record = progress.rush;
  return record?.week === week ? record : { week, best: 0, paid: [] };
}

/** Milestones reached by `cleared` that haven't been paid yet this week. */
export const unpaidMilestones = (record, cleared) =>
  RUSH_MILESTONES.filter((milestone) => cleared >= milestone.cleared && !record.paid.includes(milestone.cleared));

/** A finished (or milestone) run for guests: keeps the best and pays new milestones. @returns { progress, sparksWon } */
export function recordRushRunLocally(progress, week, cleared) {
  const record = rushRecordFor(progress, week);
  const newlyPaid = unpaidMilestones(record, cleared);
  const sparksWon = newlyPaid.reduce((sum, milestone) => sum + milestone.sparks, 0);
  return {
    sparksWon,
    progress: {
      ...progress,
      sparks: progress.sparks + sparksWon,
      rush: { week, best: Math.max(record.best, cleared), paid: [...record.paid, ...newlyPaid.map((milestone) => milestone.cleared)] },
    },
  };
}
