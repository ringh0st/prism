import { cloneElement, isValidElement } from 'react';
import { translate } from './translate.js';

/** A weekend event theme's name and tagline in `lang` (the English lives in src/game/events.js). */
export const eventThemeText = (lang, theme) => ({
  name: translate(lang, `eventTheme.${theme.id}.name`, {}, theme.name),
  tagline: translate(lang, `eventTheme.${theme.id}.tagline`, {}, theme.tagline),
});

/**
 * Fills a translated text's {placeholders} with elements (say, a <strong> name), so the words around
 * them can move freely between languages. Placeholders without a value stay as they are.
 */
export const withParts = (text, parts) =>
  text.split(/\{(\w+)\}/g).map((piece, i) => {
    if (i % 2 === 0) return piece;
    const part = parts[piece];
    if (part === undefined) return `{${piece}}`;
    return isValidElement(part) ? cloneElement(part, { key: i }) : part;
  });
