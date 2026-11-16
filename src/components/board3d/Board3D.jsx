import { useEffect, useRef } from 'react';
import { createBoardScene } from './boardScene.js';
import styles from './Board3D.module.css';

const prefersCalm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * The 3D tabletop under the board's tap targets (the board keeps its buttons for taps, the keyboard and screen
 * readers). `onLayout` gets each cell's box on screen so the buttons can sit over the pieces.
 */
export default function Board3D({ level, turns, trace, onLayout }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const wakeRef = useRef(() => {});
  const layoutRef = useRef(onLayout);
  layoutRef.current = onLayout;

  useEffect(() => {
    const canvas = canvasRef.current;
    const board = createBoardScene(canvas, level);
    sceneRef.current = board;
    const calm = prefersCalm();
    let frame = 0;
    let last = performance.now();
    // Draw every frame while something moves (or lit gems twinkle); otherwise sleep until the next change.
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const isMoving = board.tick(dt, now / 1000, calm);
      board.render();
      frame = isMoving || !calm ? requestAnimationFrame(loop) : 0;
    };
    wakeRef.current = () => {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      board.resize(width, height);
      layoutRef.current?.(board.cellRects(width, height));
      wakeRef.current();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else wakeRef.current();
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
    sceneRef.current?.update(turns, trace);
    wakeRef.current();
  }, [turns, trace]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
