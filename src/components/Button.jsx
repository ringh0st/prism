import styles from './Button.module.css';
import Icon from './Icon.jsx';

/**
 * Tactile button. variant: primary | secondary | ghost. Use `as="a"` with href for links.
 * Icon-only buttons must pass `label` for screen readers.
 */
export default function Button({ variant = 'primary', size = 'md', icon, label, children, as: Component = 'button', className = '', ...rest }) {
  const isIconOnly = icon && !children;
  return (
    <Component
      className={`${styles.button} ${styles[variant]} ${styles[size] ?? ''} ${isIconOnly ? styles.iconOnly : ''} ${className}`}
      aria-label={isIconOnly ? label : undefined}
      type={Component === 'button' ? 'button' : undefined}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 20} />}
      {children && <span>{children}</span>}
    </Component>
  );
}
