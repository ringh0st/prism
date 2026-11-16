/*
 * One-time tips that point at parts of the level screen the first time they matter (shown with a
 * spotlight and a pointer, a few words each). `target` is the element they highlight. Seen tips are remembered
 * on the device.
 */
export const LEVEL_TIPS = [
  { id: 'stars', target: '[data-tour="meter"]', title: 'Fewer taps, more ★' },
  // Your partner Pal and the power it brings (only when one is helping).
  { id: 'pal', target: '[data-tour="pal"]', title: '{name} helps you: {power}', needsPal: true },
];

/** The tips still to show, in order. (Helpers are taught when the player gets stuck, not up front.) */
export const unseenTips = (seenIds, { hasPal = false } = {}) => LEVEL_TIPS.filter((tip) => !seenIds.includes(tip.id) && (hasPal || !tip.needsPal));
