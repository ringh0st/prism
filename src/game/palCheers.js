/*
 * What your partner Pal shouts after a solved level. Bigger moments get bigger cheers, so the Pal feels
 * like it's playing along with you.
 */
const CHEERS = {
  world: ['We did the whole world!', 'World complete! Party time!', 'Best team ever!'],
  daily: ['Daily done! See you tomorrow!', 'Another day, another win!'],
  streak: ['We’re on fire!', 'Unstoppable!', 'Again! Again!'],
  perfect: ['Three stars! Wow!', 'Perfect!', 'You’re a genius!', 'Woo-hoo!'],
  good: ['Nice one!', 'Yay, we did it!', 'Good job!'],
  solved: ['Phew, we made it!', 'Solved! Let’s try for more stars?', 'Every win counts!'],
};

/** Which kind of cheer fits this result. */
export function cheerKindFor({ stars, completesWorld = false, isFirstToday = false }, hotStreak = 0) {
  if (completesWorld) return 'world';
  if (isFirstToday) return 'daily';
  if (stars === 3 && hotStreak >= 3) return 'streak';
  if (stars === 3) return 'perfect';
  return stars === 2 ? 'good' : 'solved';
}

/** The Pal's line for this result (`roll` in [0, 1) picks one, injected so tests are predictable). */
export function cheerFor(result, hotStreak = 0, roll = Math.random()) {
  const kind = cheerKindFor(result, hotStreak);
  const lines = CHEERS[kind];
  return { kind, line: lines[Math.floor(roll * lines.length)], isBig: kind !== 'good' && kind !== 'solved' };
}
