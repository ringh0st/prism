import styles from './Ribbon.module.css';

/** A banner ribbon with folded ends, for screen and section titles. */
export default function Ribbon({ as: Component = 'h2', tone = 'coral', size = 'md', className = '', children, ...rest }) {
  return (
    <div className={`${styles.wrap} ${styles[size]} ${className}`}>
      <Component className={`${styles.ribbon} ${styles[tone] ?? ''}`} {...rest}>
        <span className="game-title">{children}</span>
      </Component>
    </div>
  );
}
