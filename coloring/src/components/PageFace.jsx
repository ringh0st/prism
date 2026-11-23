import Drawing from './Drawing.jsx';
import Sticker from './Sticker.jsx';

/**
 * One page of the book: paper with punched holes for the spiral, the Pal's name written at the top, its
 * drawing, the page number, and a gold star once it's finished. The book is for choosing: a tap on the picture
 * takes it out onto the desk to color (the big sheet), so a finger can never turn a page while coloring.
 */
export default function PageFace({ page, number, colors, isDone, isOpen, onColor, onNext, onBack }) {
  return (
    <div className="paper" data-face="drawing">
      <h2 className="page-name">{page.name}</h2>
      <button className="page-open" onClick={onColor} tabIndex={isOpen ? 0 : -1} aria-label={`Color ${page.name}`}>
        <Drawing page={page} colors={colors} />
        {isOpen && <span className="tap-hint" aria-hidden="true" />}
      </button>
      <div className="grain" aria-hidden="true" />
      {isDone && <Sticker />}
      <span className="folio" aria-hidden="true">
        {number}
      </span>
      <PageCorners isOpen={isOpen} onNext={onNext} onBack={onBack} />
    </div>
  );
}

/** The curled corner that turns to the next page and the tab that goes back. */
export function PageCorners({ isOpen, onNext, onBack }) {
  return (
    <>
      {onBack && (
        <button className="corner back" onClick={onBack} tabIndex={isOpen ? 0 : -1} aria-label="Turn back a page">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path d="M24 12l-9 8 9 8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {onNext && (
        <button className="corner next" onClick={onNext} tabIndex={isOpen ? 0 : -1} aria-label="Turn the page">
          <span className="curl" aria-hidden="true" />
        </button>
      )}
    </>
  );
}
