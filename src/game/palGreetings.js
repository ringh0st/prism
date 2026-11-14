import { PAL_GROWTH_LEVELS, growthOf, palStage, stageOf } from './pals.js';
import { eventProgressOf, eventThemeFor, eventWeekendOf, isEventPrizeReady, solvedEventCount } from './events.js';
import { currentStreak } from './progress.js';
import { todayKey } from './daily.js';

/*
 * Pal of the day: once a day your partner Pal says hello on the map with a line that fits the moment
 * (almost grown, an event weekend, a streak to keep, or just the time of day).
 */
const HELLOS = {
  morning: ['Good morning! I saved you a sunbeam.', 'Morning! Let’s bend some light!', 'Rise and shine! The gems missed you.'],
  afternoon: ['Hi hi! Ready for a puzzle?', 'There you are! Let’s play!', 'I polished all the mirrors for you!'],
  evening: ['Evening! One more puzzle before bed?', 'The fireflies are out. Let’s play!', 'Cozy puzzle time!'],
  night: ['Psst… still awake? Me too!', 'Late-night puzzles are the best puzzles.'],
};

const partOfDay = (date) => {
  const hour = date.getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return hour < 22 ? 'evening' : 'night';
};

/** Every line that fits right now, the most exciting first. */
export function palGreetingsFor(progress, date = new Date()) {
  const lines = [];
  const owned = progress.pal.owned[progress.pal.id];
  const stage = palStage(stageOf(owned));
  const toGrow = PAL_GROWTH_LEVELS - growthOf(owned);
  if (stage.next && toGrow <= 3) lines.push(`Just ${toGrow} more ${toGrow === 1 ? 'level' : 'levels'} and I grow into a ${stage.next.name}!`);

  const weekend = eventWeekendOf(date);
  if (weekend) {
    const eventProgress = eventProgressOf(progress, weekend);
    if (isEventPrizeReady(eventProgress)) lines.push('We finished the weekend event! Let’s open the prize!');
    else if (!eventProgress.claimed)
      lines.push(`It’s ${eventThemeFor(weekend).name} weekend! ${solvedEventCount(eventProgress) ? 'Let’s finish it!' : 'Wanna play?'}`);
  }

  const today = todayKey(date);
  const streak = currentStreak(progress, today);
  if (progress.daily.lastDate !== today && streak > 1) lines.push(`Don’t forget our ${streak}-day streak! The daily puzzle is waiting.`);

  lines.push(...HELLOS[partOfDay(date)]);
  return lines;
}

/** Today's line: the most exciting news if there is any, otherwise a hello (picked by `roll`, 0–1). */
export function palGreetingFor(progress, date = new Date(), roll = Math.random()) {
  const lines = palGreetingsFor(progress, date);
  const news = lines.length - HELLOS[partOfDay(date)].length;
  return news > 0 ? lines[0] : lines[Math.floor(roll * lines.length)];
}
