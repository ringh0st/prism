/*
 * Pal quests: each week your partner Pal asks for three small goals (solve some levels, get some
 * three-star levels, beat Hard levels), each paying sparks. Counted per level, once a week: replaying a
 * level counts again in a new week. Weeks start Monday (UTC). Mirrors supabase/quests.sql.
 */
export const QUEST_PAIRS = [
  [
    { id: 'solve5', kind: 'solved', target: 5, sparks: 25, text: (name) => `${name} wants to see 5 levels solved` },
    { id: 'solve10', kind: 'solved', target: 10, sparks: 50, text: (name) => `${name} wants to see 10 levels solved` },
  ],
  [
    { id: 'perfect3', kind: 'perfect', target: 3, sparks: 30, text: () => 'Get ★★★ on 3 levels' },
    { id: 'perfect6', kind: 'perfect', target: 6, sparks: 60, text: () => 'Get ★★★ on 6 levels' },
  ],
  [
    { id: 'hard1', kind: 'hard', target: 1, sparks: 30, text: (name) => `Beat a Hard level with ${name}` },
    { id: 'hard3', kind: 'hard', target: 3, sparks: 60, text: (name) => `Beat 3 Hard levels with ${name}` },
  ],
];

export const QUESTS = QUEST_PAIRS.flat();

const WEEK_MS = 7 * 86_400_000;
const FIRST_MONDAY = Date.UTC(2026, 0, 5);

/** The Monday (YYYY-MM-DD, UTC) of the quest week. */
export function questWeekOf(date = new Date()) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

/** This week's three quests: one of each kind, the bigger or smaller one taking turns. */
export function questsForWeek(week) {
  const n = Math.round((Date.parse(`${week}T00:00:00Z`) - FIRST_MONDAY) / WEEK_MS);
  const flips = [n, n + 1, Math.floor(n / 2)].map((value) => ((value % 2) + 2) % 2);
  return QUEST_PAIRS.map((pair, i) => pair[flips[i]]);
}

/** Built-in levels are w<world>-<nn>; every 5th is Hard (the 20th is the Extra Hard boss). */
const isHardLevel = (levelId) => {
  const match = /^w\d+-(\d+)$/.exec(levelId);
  return Boolean(match) && Number(match[1]) % 5 === 0;
};

/** This week's counts: { week, solved: [ids], perfect: [ids], hard: [ids], claimed: [questIds] } */
export function questLogFor(progress, week) {
  const log = progress.quests;
  return log?.week === week ? log : { week, solved: [], perfect: [], hard: [], claimed: [] };
}

export const questCount = (log, quest) => log[quest.kind].length;

export const isQuestReady = (log, quest) => !log.claimed.includes(quest.id) && questCount(log, quest) >= quest.target;

/** A finished built-in level counts toward this week's quests (each level once a week). */
export function recordQuestProgress(progress, levelId, bestStars, week) {
  if (!/^w\d+-\d+$/.test(levelId)) return progress;
  const log = questLogFor(progress, week);
  const add = (list, yes) => (yes && !list.includes(levelId) ? [...list, levelId] : list);
  return {
    ...progress,
    quests: {
      ...log,
      solved: add(log.solved, true),
      perfect: add(log.perfect, bestStars === 3),
      hard: add(log.hard, isHardLevel(levelId)),
    },
  };
}

/** Collect a finished quest's sparks (guests). @throws Error when it isn't ready */
export function claimQuestLocally(progress, questId, week) {
  const quest = questsForWeek(week).find((q) => q.id === questId);
  const log = questLogFor(progress, week);
  if (!quest || !isQuestReady(log, quest)) throw new Error('This quest isn’t finished yet.');
  return { ...progress, sparks: progress.sparks + quest.sparks, quests: { ...log, claimed: [...log.claimed, questId] } };
}
