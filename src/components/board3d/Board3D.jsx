import { useEffect, useRef } from 'react';
import { createBoardScene, DEFAULT_THEME } from './boardScene.js';
import Icon from '../Icon.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './Board3D.module.css';

/**
 * The world's board colors as plain colors, so the 3D table matches the flat board. The theme mixes them with
 * color-mix(), which three.js can't read, so each is painted onto a 1-pixel canvas and read back.
 */
function worldTheme(element) {
  const probe = document.createElement('span');
  element.parentElement.appendChild(probe);
  const pixel = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const resolve = (name, fallback) => {
    probe.style.color = `var(${name}, ${fallback})`;
    pixel.clearRect(0, 0, 1, 1);
    pixel.fillStyle = getComputedStyle(probe).color;
    pixel.fillRect(0, 0, 1, 1);
    const [r, g, b] = pixel.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  };
  const theme = {
    board: resolve('--surface-board', DEFAULT_THEME.board),
    cell: resolve('--surface-cell', DEFAULT_THEME.cell),
    cellAlt: resolve('--surface-cell-alt', DEFAULT_THEME.cellAlt),
    honey: resolve('--color-honey', DEFAULT_THEME.honey),
    piece: resolve('--world-piece', DEFAULT_THEME.piece),
    pivot: resolve('--world-tint', DEFAULT_THEME.pivot),
  };
  probe.remove();
  return theme;
}

const prefersCalm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** A drag shorter than this (pixels) is a tap. */
const TAP_SLOP = 8;
/** How much one button press turns (a quarter turn) or zooms. */
const TURN_STEP = Math.PI / 2;
const ZOOM_STEP = 1.25;

/**
 * The 3D tabletop under the board's buttons (they stay for the keyboard and screen readers). Taps are found by
 * pointing into the scene; a drag turns and tilts the table, a pinch or the mouse wheel zooms, and small buttons
 * do the same. `onLayout` gets each cell's box on screen so the buttons (hint rings, the coach hand) sit over
 * the pieces; `onTapCell` gets the cell under a tap.
 * @param state what to show: { turns, trace, turnsLeft, revealedCells, darkenedTile, glooms } (boardScene's update)
 * @param surfaceRef the board element, which receives the touches
 */
export default function Board3D({ level, state, onLayout, onTapCell, surfaceRef }) {
  const { t } = useI18n();
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const wakeRef = useRef(() => {});
  const viewChangedRef = useRef(() => {});
  const callbacks = useRef({ onLayout, onTapCell });
  callbacks.current = { onLayout, onTapCell };

  useEffect(() => {
    const canvas = canvasRef.current;
    const theme = worldTheme(canvas);
    const board = createBoardScene(canvas, level, { theme });
    sceneRef.current = board;
    const calm = prefersCalm();
    let frame = 0;
    let last = performance.now();
    let size = { width: 0, height: 0 };
    let isLayoutStale = false;
    // Draw every frame while something moves (or lit gems twinkle); otherwise sleep until the next change.
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const isMoving = board.tick(dt, now / 1000, calm);
      board.render();
      if (isLayoutStale && size.width) {
        isLayoutStale = false;
        callbacks.current.onLayout?.(board.cellRects(size.width, size.height));
      }
      frame = isMoving || !calm ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };
    wakeRef.current = wake;
    viewChangedRef.current = () => {
      isLayoutStale = true;
      wake();
    };
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      size = { width, height };
      board.resize(width, height);
      viewChangedRef.current();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else wake();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(frame);
      board.dispose();
      sceneRef.current = null;
    };
  }, [level]);

  useEffect(() => {
    sceneRef.current?.update(state);
    wakeRef.current();
  }, [state]);

  // Touches on the board: one finger taps or drags (turn and tilt), two fingers pinch (zoom); the wheel zooms.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return undefined;
    const pointers = new Map();
    let gesture = null;
    const local = (event) => {
      const box = canvasRef.current.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top, width: box.width, height: box.height };
    };
    const spread = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const onDown = (event) => {
      if (event.target.closest('[data-view-controls]')) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      surface.setPointerCapture?.(event.pointerId);
      const view = sceneRef.current.getView();
      gesture =
        pointers.size === 1 ? { kind: 'tap', startX: event.clientX, startY: event.clientY, view } : { kind: 'pinch', startSpread: spread(), view };
    };
    const onMove = (event) => {
      const pointer = pointers.get(event.pointerId);
      if (!pointer || !gesture) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      const scene = sceneRef.current;
      if (gesture.kind === 'pinch' && pointers.size === 2) {
        scene.setView({ zoom: gesture.view.zoom * (spread() / gesture.startSpread) });
      } else if (gesture.kind !== 'pinch') {
        const dx = event.clientX - gesture.startX;
        const dy = event.clientY - gesture.startY;
        if (gesture.kind === 'tap' && Math.hypot(dx, dy) < TAP_SLOP) return;
        gesture.kind = 'turn';
        scene.setView({ yaw: gesture.view.yaw - dx * 0.008, tilt: gesture.view.tilt - dy * 0.005 });
      }
      viewChangedRef.current();
    };
    const onUp = (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);
      if (gesture?.kind === 'tap' && pointers.size === 0) {
        const point = local(event);
        const cell = sceneRef.current.cellAt(point.x, point.y, point.width, point.height);
        if (cell >= 0) callbacks.current.onTapCell?.(cell);
      }
      if (pointers.size === 0) gesture = null;
      else gesture = { kind: 'pinchEnd' };
    };
    const onWheel = (event) => {
      event.preventDefault();
      const scene = sceneRef.current;
      scene.setView({ zoom: scene.getView().zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1) });
      viewChangedRef.current();
    };
    surface.addEventListener('pointerdown', onDown);
    surface.addEventListener('pointermove', onMove);
    surface.addEventListener('pointerup', onUp);
    surface.addEventListener('pointercancel', onUp);
    surface.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      surface.removeEventListener('pointerdown', onDown);
      surface.removeEventListener('pointermove', onMove);
      surface.removeEventListener('pointerup', onUp);
      surface.removeEventListener('pointercancel', onUp);
      surface.removeEventListener('wheel', onWheel);
    };
  }, [surfaceRef]);

  const changeView = (change) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (change === 'reset') scene.resetView();
    else {
      const view = scene.getView();
      scene.setView({ yaw: view.yaw + (change.turn ?? 0), zoom: view.zoom * (change.zoom ?? 1) });
    }
    viewChangedRef.current();
  };

  const controls = [
    { icon: 'turnLeft', label: 'board.view.turnLeft', change: { turn: -TURN_STEP } },
    { icon: 'turnRight', label: 'board.view.turnRight', change: { turn: TURN_STEP } },
    { icon: 'minus', label: 'board.view.zoomOut', change: { zoom: 1 / ZOOM_STEP } },
    { icon: 'plus', label: 'board.view.zoomIn', change: { zoom: ZOOM_STEP } },
    { icon: 'recenter', label: 'board.view.reset', change: 'reset' },
  ];

  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.controls} data-view-controls>
        {controls.map((control) => (
          <button
            key={control.icon}
            type="button"
            className={styles.control}
            aria-label={t(control.label)}
            onClick={() => changeView(control.change)}
          >
            <Icon name={control.icon} size={18} />
          </button>
        ))}
      </div>
    </>
  );
}
