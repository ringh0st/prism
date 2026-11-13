import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';

/**
 * Accessible modal: labelled, traps Tab focus, closes on Escape, restores focus on close.
 * The first element with [data-autofocus] (or the dialog itself) receives focus.
 * Rendered at the end of <body>, so it always sits above the screen it was opened from.
 * tone: default | celebrate | gentle (a light scrim, so the board stays visible behind the sheet)
 */
export default function Dialog({ title, onClose, children, tone = 'default' }) {
  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    (dialog.querySelector('[data-autofocus]') ?? dialog).focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const focusable = dialog.querySelectorAll('button:not(:disabled), a[href], input, select, [tabindex="0"]');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className={`${styles.backdrop} ${styles[`${tone}Backdrop`] ?? ''}`} onClick={onClose ? () => onClose() : undefined}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles[tone] ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
