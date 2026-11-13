import styles from './Ribbon.module.css';

/** A solid title pill on a darker ledge for screen and section titles. */
export default function Ribbon({ as: Component = 'h2', tone = 'sage', size = 'md', className = '', children, ...rest }) {
  return (
    <div className={`${styles.wrap} ${styles[size]} ${className}`}>
      <Component className={`${styles.ribbon} ${styles[tone] ?? ''}`} {...rest}>
        <span className="game-title on-color">{children}</span>
      </Component>
    </div>
  );
}
