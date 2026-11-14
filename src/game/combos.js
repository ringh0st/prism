/** How many gems one tap lit at once, as a cheer (null below two). */
export function comboFor(gemsLitByTap) {
  if (gemsLitByTap >= 4) return { size: gemsLitByTap, word: 'MEGA!' };
  if (gemsLitByTap === 3) return { size: 3, word: 'Triple!' };
  if (gemsLitByTap === 2) return { size: 2, word: 'Double!' };
  return null;
}
