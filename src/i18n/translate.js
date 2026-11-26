import { en } from './strings/en.js';
import { he } from './strings/he.js';

/*
 * Translations: one dictionary per language (src/i18n/strings/). Keys read like "win.next". English is
 * the fallback for anything missing. Values may use {name} placeholders; a `count` param picks the
 * plural form from "key.one" / "key.other" (Intl rules). An array value is a set of lines to pick from.
 */
export const LANGUAGES = [
  { id: 'en', name: 'English', dir: 'ltr' },
  { id: 'he', name: 'עברית', dir: 'rtl' },
];

const DICTIONARIES = { en, he };

/** The language to start in: the device's own if we have it, else English. */
export function detectLanguage(preferred = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])) {
  for (const tag of preferred) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (base === 'iw') return 'he';
    if (DICTIONARIES[base]) return base;
  }
  return 'en';
}

/** A language that is no longer offered (Spanish was taken out before the app release) falls back to the device's. */
export const isOffered = (lang) => LANGUAGES.some((language) => language.id === lang);

export const directionOf = (lang) => LANGUAGES.find((language) => language.id === lang)?.dir ?? 'ltr';

function lookup(lang, key, count) {
  const dictionary = DICTIONARIES[lang] ?? en;
  if (typeof count === 'number') {
    const form = new Intl.PluralRules(lang).select(count);
    const plural = dictionary[`${key}.${form}`] ?? dictionary[`${key}.other`] ?? en[`${key}.${form === 'one' ? 'one' : 'other'}`];
    if (plural !== undefined) return plural;
  }
  return dictionary[key] ?? en[key];
}

/** The text for `key` in `lang`, with {placeholders} filled in. Falls back to English, then to `fallback`, then the key. */
export function translate(lang, key, params = {}, fallback) {
  const value = lookup(lang, key, params.count) ?? fallback ?? key;
  if (Array.isArray(value)) return value;
  return String(value).replace(/\{(\w+)\}/g, (match, name) => (params[name] !== undefined ? String(params[name]) : match));
}

/** A random line from a set of lines (Lumi's quips) in `lang`, or from the English `fallbackLines`. */
export function pickLine(lang, key, fallbackLines = [], random = Math.random) {
  const lines = lookup(lang, key) ?? fallbackLines;
  const list = Array.isArray(lines) && lines.length ? lines : fallbackLines;
  return list[Math.floor(random() * list.length)] ?? '';
}
