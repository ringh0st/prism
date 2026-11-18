/*
 * Speed for phones: the board is drawn only as often as it needs to be, and at a quality the device keeps up with.
 * - Busy (a tap's animation, a finger turning the room): every frame, and shadows are redrawn.
 * - Otherwise: a slow ambient pace, enough for flames and drifting dust; nothing at all for reduced motion.
 * - If busy frames come too slowly, the quality steps down once (boardQuality below) and stays there while the app runs.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

/** How long a tap's animation or a let-go spin can still be moving (ms). */
const SETTLE_MS = 1400;
/** Time between ambient frames (ms): about 20 a second. */
const AMBIENT_MS = 50;
/** Busy frames slower than this (ms, about 36 a second) mean the device is struggling. */
const SLOW_FRAME_MS = 28;
/** How many busy frames to judge by, and how long after opening to wait first (loading is always bumpy). */
const JUDGE_FRAMES = 40;
const WARM_UP_MS = 4000;

/**
 * Quality steps, best first: pixels per CSS pixel at most, the smoothing pass (multisampling), and the bloom pass.
 * Phones and tablets start one step down: fewer pixels and no smoothing is most of what a small graphics chip pays for.
 */
export const BOARD_QUALITIES = [
  { dpr: 2, smoothing: 4, bloom: true },
  { dpr: 1.5, smoothing: 0, bloom: true },
  { dpr: 1.25, smoothing: 0, bloom: false },
];
const isTouchDevice = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
/** The step this device has settled on while the app runs (found again on the next launch). */
let settledStep = null;
export const startingQualityStep = () => settledStep ?? (isTouchDevice() ? 1 : 0);
/** Remember a step down for the rest of this run of the app. */
export function settleQualityStep(step) {
  settledStep = step;
}

/**
 * @param stamp anything that changes when the board does (a turn, a rescue, a new level, a view reset)
 * @param calm reduced motion: no ambient frames
 * @param onSlow called once when busy frames are too slow, to step the quality down
 */
export default function Pace({ stamp, calm, onSlow }) {
  const gl = useThree((three) => three.gl);
  const invalidate = useThree((three) => three.invalidate);
  const busyUntil = useRef(0);
  const shadowsUntil = useRef(0);

  // Shadows are drawn once and kept: drawing them means drawing the whole room a second time.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);
  useFrame(() => {
    if (performance.now() < shadowsUntil.current) gl.shadowMap.needsUpdate = true;
  });

  useEffect(() => {
    busyUntil.current = shadowsUntil.current = performance.now() + SETTLE_MS;
    invalidate();
  }, [stamp, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    const wake = () => {
      busyUntil.current = performance.now() + SETTLE_MS;
      invalidate();
    };
    const events = ['pointerdown', 'pointermove', 'pointerup', 'wheel'];
    events.forEach((name) => canvas.addEventListener(name, wake, { passive: true }));
    return () => events.forEach((name) => canvas.removeEventListener(name, wake));
  }, [gl, invalidate]);

  useEffect(() => {
    const opened = performance.now();
    let request;
    let lastDrawn = 0;
    let lastTick = 0;
    let busyFrames = 0;
    let busyTime = 0;
    const tick = (now) => {
      request = requestAnimationFrame(tick);
      const gap = now - lastTick;
      lastTick = now;
      if (now < busyUntil.current) {
        lastDrawn = now;
        invalidate();
        // Judge the pace by frames that follow each other (a pause between taps isn't a slow frame).
        if (now - opened > WARM_UP_MS && gap < 250) {
          busyFrames += 1;
          busyTime += gap;
          if (busyFrames >= JUDGE_FRAMES) {
            if (busyTime / busyFrames > SLOW_FRAME_MS) onSlow?.();
            busyFrames = busyTime = 0;
          }
        }
      } else if (!calm && now - lastDrawn >= AMBIENT_MS) {
        lastDrawn = now;
        invalidate();
      }
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [calm, invalidate, onSlow]);
  return null;
}
