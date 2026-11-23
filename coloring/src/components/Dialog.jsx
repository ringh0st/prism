import { useEffect, useRef } from 'react';

/** A small question with pictures for answers (a parent reads the words; a child sees ✓ and ✗). */
export default function Dialog({ title, picture, yesLabel, onYes, onNo }) {
  const no = useRef(null);
  useEffect(() => {
    no.current?.focus({ preventScroll: true });
    const onKey = (event) => event.key === 'Escape' && onNo();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNo]);
  return (
    <div className="scrim" onClick={onNo}>
      <div className="dialog" role="alertdialog" aria-labelledby="dialog-title" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-picture" aria-hidden="true">
          {picture}
        </div>
        <h2 id="dialog-title">{title}</h2>
        <div className="dialog-buttons">
          <button ref={no} className="round no" onClick={onNo} aria-label="No">
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <path d="M12 12l16 16M28 12L12 28" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </button>
          <button className="round yes" onClick={onYes} aria-label={yesLabel}>
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <path d="M10 21l7 7 13-15" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
