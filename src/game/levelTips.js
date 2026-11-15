/*
 * One-time tips that point at parts of the level screen the first time they matter (shown with a
 * spotlight and a pointer, a few words each). `target` is the element they highlight. Seen tips are remembered
 * on the device.
 */
export const LEVEL_TIPS = [
  { id: 'stars', target: '[data-tour="meter"]', title: 'Fewer taps, more ★' },
  // Only on levels with hearts (`feature`).
  { id: 'hearts', target: '[data-tour="hearts"]', title: 'A wrong turn breaks a ❤', feature: 'hearts' },
];

/** The tips still to show, in order, for a level with these `features`. (Helpers are taught when the player gets stuck.) */
export const unseenTips = (seenIds, features = []) =>
  LEVEL_TIPS.filter((tip) => !seenIds.includes(tip.id) && (!tip.feature || features.includes(tip.feature)));
