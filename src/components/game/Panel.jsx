import styles from './Panel.module.css';

/** Thick-outlined game panel. `as` lets it be a section, li, etc. */
export default function Panel({ as: Component = 'div', tone = 'cream', className = '', children, ...rest }) {
  return (
    <Component className={`${styles.panel} ${styles[tone] ?? ''} ${className}`} {...rest}>
      {children}
    </Component>
  );
}
