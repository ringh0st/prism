import styles from './Skeleton.module.css';

/**
 * A soft placeholder block the size of the content that is still loading, so the page keeps its
 * shape and nothing jumps when the real thing arrives. Hidden from screen readers: the loading
 * region itself carries `aria-busy`. `shape` is "line" (rounded text bar), "pill" or "circle".
 * Size it with `width`/`height` or with a class (it fills its width and is 16px tall by default).
 */
export default function Skeleton({ width, height, shape = 'line', className = '' }) {
  return <span className={`${styles.skeleton} ${styles[shape]} ${className}`} style={{ width, height }} aria-hidden="true" />;
}
