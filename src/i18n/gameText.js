import { translate } from './translate.js';
import { recipeOf } from '../game/recipes.js';
import { levelNameFor } from '../game/levelNames.js';
import { HELPERS } from '../game/catalog.js';
import { eventThemeFor, parseEventLevelId } from '../game/events.js';

/*
 * Game content in the player's language. The game modules keep the English text (pieces.js,
 * recipes.js, catalog.js…); these look up the translation by id and fall back to that English.
 */

/** A level's flavor ({ name, goal }) or null. */
export function flavorText(lang, level) {
  const base = recipeOf(level);
  if (!base) return null;
  const goals = translate(lang, `recipe.${level.recipe}.goals`);
  return {
    name: translate(lang, `recipe.${level.recipe}.name`, {}, base.name),
    goal: Array.isArray(goals) ? goals[(level.index ?? 0) % goals.length] : base.goal,
  };
}

/** A piece's name and short explanation. */
export const pieceText = (lang, piece) => ({
  name: translate(lang, `piece.${piece.id}.name`, {}, piece.name),
  text: translate(lang, `piece.${piece.id}.text`, {}, piece.text),
});

/** A helper's name and description. */
export const helperText = (lang, id) => ({
  name: translate(lang, `helper.${id}.name`, {}, HELPERS[id].name),
  description: translate(lang, `helper.${id}.description`, {}, HELPERS[id].description),
});

/** "Sunrise Sandbox" in English; "Mundo 1" / "עולם 1" elsewhere (the world names are English wordplay). */
export const worldName = (lang, world) => (lang === 'en' ? world.name : translate(lang, 'world.number', { n: world.id }));

/**
 * The level's title: its funny English name, or "Nivel 1-6" / "שלב 1-6" in other languages. A weekend-event
 * level is its theme's name and number in every language ("Portal Party 3").
 */
export function levelTitle(lang, level) {
  if (lang === 'en') return levelNameFor(level);
  if (Number.isInteger(level.world)) return translate(lang, 'level.title', { label: `${level.world}-${level.index}` });
  const event = parseEventLevelId(level.id);
  if (!event) return levelNameFor(level);
  const theme = eventThemeFor(event.weekend);
  return `${translate(lang, `eventTheme.${theme.id}.name`, {}, theme.name)} ${event.number}`;
}
