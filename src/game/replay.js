import { rotationGroup, traceBeams } from './beam.js';

/*
 * The solve replay: the taps of a winning attempt, played back as a short video. This part is pure: it
 * turns the taps into steps (which tiles turn, and the board after each tap) and times them.
 */
export const REPLAY_TIMING = { introMs: 1400, stepMs: 620, turnMs: 320, outroMs: 2600 };
/** Long solves play faster so the video stays short. */
const MAX_STEPS_MS = 9000;

/**
 * @param level   { width, height, tiles }
 * @param history tile indices tapped, in order
 * @returns {{ steps: [{ turning: number[], before: number[], after: number[] }], start: number[], stepMs, turnMs, isSolved }}
 */
export function replayTimeline(level, history) {
  const start = level.tiles.map((tile) => tile.orient ?? 0);
  let orients = start;
  const steps = history.map((tileIndex) => {
    const turning = rotationGroup(level.tiles, tileIndex);
    const after = orients.slice();
    for (const i of turning) after[i] ^= 1;
    const step = { turning, before: orients, after };
    orients = after;
    return step;
  });
  const scale = Math.min(1, MAX_STEPS_MS / Math.max(1, steps.length * REPLAY_TIMING.stepMs));
  return {
    start,
    steps,
    stepMs: REPLAY_TIMING.stepMs * scale,
    turnMs: REPLAY_TIMING.turnMs * Math.max(0.6, scale),
    isSolved: traceBeams(level, orients).isSolved,
  };
}

/** The whole video's length in milliseconds. */
export const replayDuration = (timeline) => REPLAY_TIMING.introMs + timeline.steps.length * timeline.stepMs + REPLAY_TIMING.outroMs;

/**
 * Where the replay is at time t: the phase, the board's orientations, and how far the turning tiles are
 * through their turn (0–1), for drawing one frame.
 */
export function replayStateAt(timeline, t) {
  const { introMs } = REPLAY_TIMING;
  if (t < introMs) return { phase: 'intro', orients: timeline.start, turning: [], progress: 0, movesDone: 0 };
  const intoSteps = t - introMs;
  const index = Math.floor(intoSteps / timeline.stepMs);
  if (index >= timeline.steps.length) {
    const last = timeline.steps.at(-1);
    return {
      phase: 'outro',
      orients: last ? last.after : timeline.start,
      turning: [],
      progress: 0,
      movesDone: timeline.steps.length,
      outroT: intoSteps - timeline.steps.length * timeline.stepMs,
    };
  }
  const step = timeline.steps[index];
  const progress = Math.min(1, (intoSteps - index * timeline.stepMs) / timeline.turnMs);
  return {
    phase: 'play',
    orients: progress < 1 ? step.before : step.after,
    turning: progress < 1 ? step.turning : [],
    progress,
    movesDone: index + (progress >= 1 ? 1 : 0),
  };
}
