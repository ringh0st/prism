import Drawing from './Drawing.jsx';
import SketchThumb from './SketchThumb.jsx';
import Sticker from './Sticker.jsx';
import Tape from './Tape.jsx';
import waffles from '../../../src/assets/pals/drawn/waffles-1.svg?raw';

const TAPES = ['#f2a67e', '#9fd3c7', '#f4c443', '#f5a8c8', '#a5d046', '#9cc3ef'];
/** The same small tilt for a picture every time (from its id), so the wall looks hung by hand. */
const tiltOf = (id) => ([...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 7) - 3;

/**
 * The child's room: a wall with every picture they colored or drew (newest first, taped up, a tap opens it
 * again), and on the desk below the coloring book and a pad of blank paper.
 */
export default function Room({ items, pinnedId, onOpenBook, onNewSketch, onOpenItem }) {
  return (
    <div className="room">
      <section className="wall" aria-label="My wall">
        <ul className="wall-grid">
          {items.map((item) => (
            <li key={item.id} className={item.id === pinnedId ? 'just-pinned' : ''} style={{ '--tilt': `${tiltOf(item.id)}deg` }}>
              <button className="framed" onClick={() => onOpenItem(item)} aria-label={item.page ? `${item.page.name}, colored` : 'My drawing'}>
                <Tape single color={TAPES[tiltOf(item.id) + 3]} />
                {item.page ? <Drawing page={item.page} colors={item.colors} /> : <SketchThumb sketch={item.sketch} />}
                {item.isDone && <Sticker small />}
              </button>
            </li>
          ))}
          {Array.from({ length: Math.max(0, 6 - items.length) }, (_, i) => (
            <li key={`empty-${i}`} className="empty" aria-hidden="true" />
          ))}
        </ul>
      </section>
      <div className="desk-row">
        <button className="desk-item desk-book" onClick={onOpenBook} aria-label="Open the coloring book">
          <span className="mini-cover">
            <span className="mini-spiral" />
            <span className="mini-label">My Pals</span>
            <span className="mini-pal" dangerouslySetInnerHTML={{ __html: waffles }} />
          </span>
        </button>
        <button className="desk-item desk-pad" onClick={onNewSketch} aria-label="A blank sheet to draw on">
          <span className="pad">
            <span className="pad-sheet" />
            <svg className="pad-crayon" viewBox="0 0 30 120" aria-hidden="true">
              <path d="M8 30 15 4 22 30Z" fill="#e8524f" />
              <rect x="6" y="28" width="18" height="92" rx="3" fill="#e8524f" />
              <rect x="6" y="40" width="18" height="70" fill="#000" opacity=".14" />
              <path d="M6 46h18M6 104h18" stroke="#fff" strokeOpacity=".7" strokeWidth="2.5" />
            </svg>
            <svg className="pad-scribble" viewBox="0 0 100 60" aria-hidden="true">
              <path d="M12 40c10-22 20 12 30-6s18 10 28-4 14 6 20-2" fill="none" stroke="#5bb7ea" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
