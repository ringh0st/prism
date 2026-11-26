/**
 * In themed worlds the targets are Lumi's family, not gems: the same lines, with the gem words swapped for Lumis.
 * Pure text rules per language (English and Hebrew); anything else passes through.
 */
const RULES = {
  en: [
    [/\bGems\b/g, 'Lumis'],
    [/\bGem\b/g, 'Lumi'],
    [/\bgems\b/g, 'Lumis'],
    [/\bgem\b/g, 'Lumi'],
  ],
  he: [
    ['אבני החן', 'הלומים'],
    ['אבני חן', 'לומים'],
    ['אבן החן', 'הלומי'],
    ['אבן חן', 'לומי'],
  ],
};

export function rescueWording(text, lang) {
  if (typeof text !== 'string') return text;
  return (RULES[lang] ?? []).reduce((out, [from, to]) => out.replaceAll(from, to), text);
}
