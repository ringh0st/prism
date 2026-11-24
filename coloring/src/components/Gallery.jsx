import PageThumb from './PageThumb.jsx';
import SketchThumb from './SketchThumb.jsx';
import Sticker from './Sticker.jsx';
import Tape from './Tape.jsx';
import { BlankPad, MiniCover } from './Room.jsx';
import { DrawingsSign, PalsSign } from './Signs.jsx';

const TAPES = ['#f2a67e', '#9fd3c7', '#f4c443', '#f5a8c8', '#a5d046', '#9cc3ef'];
/** The same small tilt for a picture every time (from its id), so the wall looks hung by hand. */
const tiltOf = (id) => ([...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 7) - 3;
const dayOf = (time) => new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/**
 * One wall, up close: every picture taped up with the day it was made, newest first; a tap opens it again (a
 * drawing replays itself). The first frame starts a new one: a blank sheet, or the coloring book. With the
 * remove button on, every picture wiggles with a ✗ to take it off (asked first, with ✓ and ✗).
 */
export default function Gallery({ kind, items, pinnedId, isRemoving, onOpenItem, onRemove, onStart }) {
  const isDrawings = kind === 'drawings';
  return (
    <section className={`gallery ${kind} ${isRemoving ? 'removing' : ''}`} aria-label={isDrawings ? 'My Drawings' : 'My Pals'}>
      <h2 className="gallery-sign">
        {isDrawings ? <DrawingsSign /> : <PalsSign />}
        {isDrawings ? 'My Drawings' : 'My Pals'}
      </h2>
      <ul className="wall-grid">
        <li className="start-new">
          <button className="framed new" onClick={onStart} aria-label={isDrawings ? 'Draw something new' : 'Open the coloring book'}>
            {isDrawings ? <BlankPad /> : <MiniCover bookId="little" />}
            <span className="plus" aria-hidden="true">
              +
            </span>
          </button>
        </li>
        {items.map((item) => (
          <li key={item.id} className={item.id === pinnedId ? 'just-pinned' : ''} style={{ '--tilt': `${tiltOf(item.id)}deg` }}>
            <button
              className="framed"
              onClick={() => onOpenItem(item)}
              aria-label={item.page ? `${item.page.name}, colored on ${dayOf(item.at)}` : `My drawing from ${dayOf(item.at)}`}
            >
              <Tape single color={TAPES[tiltOf(item.id) + 3]} />
              <span className="frame-paper">
                {item.page ? <PageThumb page={item.page} colors={item.colors} paint={item.paint} /> : <SketchThumb sketch={item.sketch} />}
              </span>
              {item.isDone && <Sticker small />}
            </button>
            {isRemoving && (
              <button className="take-off" onClick={() => onRemove(item)} aria-label="Take this picture off the wall">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <span className="made-on" aria-hidden="true">
              {dayOf(item.at)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
