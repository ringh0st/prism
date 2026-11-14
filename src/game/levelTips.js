/*
 * One-time tips that point at parts of the level screen the first time they matter (shown with a
 * spotlight, a few words each). `target` is the element they highlight. Seen tips are remembered
 * on the device.
 */
export const LEVEL_TIPS = [
  { id: 'stars', target: '[data-tour="meter"]', title: 'Fewer moves, more stars', text: 'Solve it in just a few taps for ★★★.' },
];

/** The tips still to show, in order. (Helpers are taught when the player gets stuck, not up front.) */
export const unseenTips = (seenIds) => LEVEL_TIPS.filter((tip) => !seenIds.includes(tip.id));
