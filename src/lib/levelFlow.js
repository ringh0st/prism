/*
 * The quick flow from one level to the next: a quiet win marks the next level, which then opens straight onto the
 * board. Kept for this tab only (sessionStorage), so opening a level from the map always shows its card.
 */
const FLOW_KEY = 'prism.flowInto';

export function markFlowInto(levelId) {
  try {
    sessionStorage.setItem(FLOW_KEY, levelId);
  } catch {
    // Without storage the next level just shows its card.
  }
}

/** True if this level was reached through the quick flow (read-only, so it's safe to call while rendering). */
export function isFlowInto(levelId) {
  try {
    return sessionStorage.getItem(FLOW_KEY) === levelId;
  } catch {
    return false;
  }
}

/** The flow mark is used once: cleared when the level has opened. */
export function clearFlow() {
  try {
    sessionStorage.removeItem(FLOW_KEY);
  } catch {
    // Nothing to clear without storage.
  }
}
