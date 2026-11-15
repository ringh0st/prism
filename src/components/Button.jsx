import styles from './Button.module.css';
import Icon from './Icon.jsx';
import { sfx } from '../audio/sfx.js';

/**
 * Tactile button. variant: primary | secondary | ghost. Use `as="a"` with href for links.
 * Icon-only buttons must pass `label` for screen readers. Every press answers with a soft click and a light tap
 * (feedback you can hear and feel); `silent` skips it where the moment has its own sound.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  label,
  children,
  as: Component = 'button',
  className = '',
  silent = false,
  ...rest
}) {
  const isIconOnly = icon && !children;
  return (
    <Component
      className={`${styles.button} ${styles[variant]} ${styles[size] ?? ''} ${isIconOnly ? styles.iconOnly : ''} ${className}`}
      aria-label={isIconOnly ? label : undefined}
      type={Component === 'button' ? 'button' : undefined}
      {...rest}
      onPointerDown={(event) => {
        if (!silent && !rest.disabled) sfx.press();
        rest.onPointerDown?.(event);
      }}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 20} />}
      {children && <span>{children}</span>}
    </Component>
  );
}
