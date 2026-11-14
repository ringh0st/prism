import styles from './ScreenTitle.module.css';

/**
 * Where you are: a plain title with a small hand-drawn underline. Deliberately not a pill, so it never
 * looks tappable. tone: calm (honey underline) | boss (terracotta underline).
 */
export default function ScreenTitle({ as: Component = 'h2', tone = 'calm', size = 'md', className = '', children, ...rest }) {
  return (
    <Component className={`game-title ${styles.title} ${styles[size]} ${styles[tone] ?? ''} ${className}`} {...rest}>
      <span className={styles.text}>{children}</span>
      <svg className={styles.underline} viewBox="0 0 60 8" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M2 5c10-4 18-4 28-1s18 2 28-2" />
      </svg>
    </Component>
  );
}
