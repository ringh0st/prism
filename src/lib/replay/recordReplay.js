import { drawReplayFrame, VIDEO_SIZE } from './drawReplayFrame.js';
import { replayDuration, replayStateAt, replayTimeline } from '../../game/replay.js';

/** The best video format this browser can record (MP4 where possible, so it plays everywhere). */
function videoType() {
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  return types.find((type) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) ?? null;
}

/** Can this browser make replay videos? */
export const canRecordReplay = () =>
  typeof document !== 'undefined' && typeof MediaRecorder !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype && videoType() !== null;

const loadImage = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

/**
 * Records the solve as a short vertical video. Plays in real time (a few seconds), reporting progress.
 * @param info { title, subtitle, stars, moves, words } (words: the video's texts, see drawReplayFrame)
 * @returns Promise<File>
 */
export async function recordReplay(level, history, info, onProgress = () => {}) {
  const timeline = replayTimeline(level, history);
  const duration = replayDuration(timeline);
  const canvas = document.createElement('canvas');
  canvas.width = VIDEO_SIZE.width;
  canvas.height = VIDEO_SIZE.height;
  const ctx = canvas.getContext('2d');
  await document.fonts?.load?.('700 48px Fredoka').catch(() => {});
  const icon = await loadImage('./icon-192.png');
  const frameInfo = { ...info, icon };

  const type = videoType();
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 4_000_000 });
  const chunks = [];
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  const stopped = new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  const turnsUsed = [];
  const countTurns = (state) => {
    turnsUsed.length = 0;
    timeline.steps.slice(0, state.movesDone).forEach((step) => step.turning.forEach((i) => (turnsUsed[i] = (turnsUsed[i] ?? 0) + 1)));
  };

  recorder.start(250);
  const started = performance.now();
  await new Promise((resolve) => {
    const frame = () => {
      const t = performance.now() - started;
      const state = replayStateAt(timeline, Math.min(t, duration));
      countTurns(state);
      drawReplayFrame(ctx, level, state, frameInfo, turnsUsed);
      onProgress(Math.min(1, t / duration));
      if (t < duration) requestAnimationFrame(frame);
      else resolve();
    };
    frame();
  });
  recorder.stop();
  await stopped;
  stream.getTracks().forEach((track) => track.stop());

  const extension = type.startsWith('video/mp4') ? 'mp4' : 'webm';
  return new File(chunks, `lumipals-${level.id}.${extension}`, { type: type.split(';')[0] });
}
