import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';

const BACKDROP_GRACE_MS = 600;

/**
 * Accessible modal: labelled, traps Tab focus, closes on Escape, restores focus on close.
 * The first element with [data-autofocus] (or the dialog itself) receives focus.
 * Rendered at the end of <body>, so it always sits above the screen it was opened from.
 * tone: default | celebrate | gentle (a light scrim, so the board stays visible behind the sheet)
 * closesOnBackdrop: false for result screens, so a leftover tap on the board can't leave the level.
 * Taps on the backdrop in the first moments after opening are ignored either way (they were meant for
 * whatever was there before the dialog slid in).
 */
export default function Dialog({ title, onClose, children, tone = 'default', closesOnBackdrop = true, hideTitle = false }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const openedAt = useRef(0);

  useEffect(() => {
    openedAt.current = performance.now();
  }, []);

  const onBackdropClick = () => {
    if (closesOnBackdrop && onClose && performance.now() - openedAt.current > BACKDROP_GRACE_MS) onClose();
  };

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
    <div className={`${styles.backdrop} ${styles[`${tone}Backdrop`] ?? ''}`} onClick={onBackdropClick}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles[tone] ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={hideTitle ? 'visually-hidden' : styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
