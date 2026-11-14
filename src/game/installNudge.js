/*
 * When to suggest adding Lumipals to the Home Screen: only once the player has enjoyed a few levels,
 * and never pushy: after "Not now" it waits a week, and after three "Not now"s it stops asking
 * (Settings always has the option).
 */
export const INSTALL_NUDGE_AFTER_LEVELS = 3;
export const INSTALL_NUDGE_WAIT_DAYS = 7;
export const INSTALL_NUDGE_MAX_TIMES = 3;

const DAY_MS = 86_400_000;

export function shouldSuggestInstall({ solvedCount, dismissedAt = 0, timesDismissed = 0, now = Date.now() }) {
  if (solvedCount < INSTALL_NUDGE_AFTER_LEVELS) return false;
  if (timesDismissed >= INSTALL_NUDGE_MAX_TIMES) return false;
  return now - dismissedAt >= INSTALL_NUDGE_WAIT_DAYS * DAY_MS;
}
