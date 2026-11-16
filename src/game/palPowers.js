/*
 * Pal powers: while a Pal is your partner it helps in every main-road level with one small power, so a Pal is
 * more than a pretty face. The power grows with the Pal (Baby/Junior 1, Buddy/Champ 2, Master 3) and Legendary
 * and Mythic Pals start one step stronger. Powers never lower the ★★★ target: extra moves and take-backs only
 * add to the move limit, and a free hint still caps the result at ★★ like any hint.
 * Not in the daily, events, Light Rush or challenges, where everyone plays the same puzzle on equal terms.
 */
import { palById, rarityOf, stageOf } from './pals.js';

export const PAL_POWERS = {
  moves: { id: 'moves', icon: 'plus' },
  undo: { id: 'undo', icon: 'undo' },
  hint: { id: 'hint', icon: 'hint' },
};

/** Strength by form: Baby, Junior, Buddy, Champ, Master. */
const STRENGTH_BY_FORM = [1, 1, 2, 2, 3];
export const MAX_POWER_STRENGTH = 3;

/** What a Pal does at a form: { id, icon, amount } (the words are power.<id>.line in the i18n strings). */
export function palPower(pal, stageIndex = 0) {
  const rareStep = rarityOf(pal) === 'common' ? 0 : 1;
  const amount = Math.min(MAX_POWER_STRENGTH, STRENGTH_BY_FORM[stageIndex] + rareStep);
  return { ...PAL_POWERS[pal.power], amount };
}

/** The power's strength at each form, for the Pal's card. */
export const powerByForm = (pal) => STRENGTH_BY_FORM.map((_, stageIndex) => palPower(pal, stageIndex).amount);

/** The partner Pal (or `palId`, one just picked), its form and the power it brings to the next level; null without one. */
export function partnerPower(progress, palId = progress.pal.id) {
  const pal = palById(palId);
  if (!pal) return null;
  const stage = stageOf(progress.pal.owned[pal.id]);
  return { pal, stage, ...palPower(pal, stage) };
}

/** Which modes the powers work in. */
export const powersWorkIn = (mode) => mode === 'level';
