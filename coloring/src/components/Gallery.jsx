import Drawing from './Drawing.jsx';
import SketchThumb from './SketchThumb.jsx';
import Sticker from './Sticker.jsx';
import Tape from './Tape.jsx';
import { BlankPad } from './Room.jsx';
import { BookPicture } from './BackButton.jsx';
import { DrawingsSign, PalsSign } from './Signs.jsx';

const TAPES = ['#f2a67e', '#9fd3c7', '#f4c443', '#f5a8c8', '#a5d046', '#9cc3ef'];
/** The same small tilt for a picture every time (from its id), so the wall looks hung by hand. */
const tiltOf = (id) => ([...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 7) - 3;
const dayOf = (time) => new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/**
 * One wall, up close: every picture taped up with the day it was made, newest first; a tap opens it again (a
 * drawing replays itself). The first frame starts a new one: a blank sheet, or the coloring book.
 */
export default function Gallery({ kind, items, pinnedId, onOpenItem, onStart }) {
  const isDrawings = kind === 'drawings';
  return (
    <section className={`gallery ${kind}`} aria-label={isDrawings ? 'My Drawings' : 'My Pals'}>
      <h2 className="gallery-sign">
        {isDrawings ? <DrawingsSign /> : <PalsSign />}
        {isDrawings ? 'My Drawings' : 'My Pals'}
      </h2>
      <ul className="wall-grid">
        <li className="start-new">
          <button className="framed new" onClick={onStart} aria-label={isDrawings ? 'Draw something new' : 'Open the coloring book'}>
            {isDrawings ? <BlankPad /> : <BookPicture />}
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
              {item.page ? <Drawing page={item.page} colors={item.colors} /> : <SketchThumb sketch={item.sketch} />}
              {item.isDone && <Sticker small />}
            </button>
            <span className="made-on" aria-hidden="true">
              {dayOf(item.at)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
