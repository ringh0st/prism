import Drawing from './Drawing.jsx';
import SketchThumb from './SketchThumb.jsx';
import Tape from './Tape.jsx';
import { DrawingsSign, PalsSign } from './Signs.jsx';
import waffles from '../../../src/assets/pals/drawn/waffles-1.svg?raw';

/**
 * The child's room: two walls, "My Drawings" (what they drew on blank paper) and "My Pals" (the pictures they
 * colored), each showing its newest little pictures; and on the desk the coloring book and a pad of blank paper.
 */
export default function Room({ drawings, pals, onOpenWall, onOpenBook, onNewSketch }) {
  return (
    <div className="room">
      <div className="boards">
        <Board kind="drawings" title="My Drawings" sign={<DrawingsSign />} items={drawings} onOpen={() => onOpenWall('drawings')} />
        <Board kind="pals" title="My Pals" sign={<PalsSign />} items={pals} onOpen={() => onOpenWall('pals')} />
      </div>
      <div className="desk-row">
        <button className="desk-item desk-book" onClick={onOpenBook} aria-label="Open the coloring book">
          <span className="mini-cover">
            <span className="mini-spiral" />
            <span className="mini-label">My Pals</span>
            <span className="mini-pal" dangerouslySetInnerHTML={{ __html: waffles }} />
          </span>
        </button>
        <button className="desk-item desk-pad" onClick={onNewSketch} aria-label="A blank sheet to draw on">
          <BlankPad />
        </button>
      </div>
    </div>
  );
}

/** A wall in the room: its sign, and its four newest pictures taped up (or empty frames waiting for some). */
function Board({ kind, title, sign, items, onOpen }) {
  const newest = items.slice(0, 4);
  return (
    <button className={`board ${kind}`} onClick={onOpen} aria-label={`${title}, ${items.length} ${items.length === 1 ? 'picture' : 'pictures'}`}>
      <span className="board-sign">
        {sign}
        <span>{title}</span>
      </span>
      <span className="board-wall">
        {newest.map((item, i) => (
          <span key={item.id} className="mini-frame" style={{ '--tilt': `${[-5, 4, 3, -3][i]}deg` }}>
            <Tape single color={['#f2a67e', '#9fd3c7', '#f4c443', '#f5a8c8'][i]} />
            {item.page ? <Drawing page={item.page} colors={item.colors} /> : <SketchThumb sketch={item.sketch} />}
          </span>
        ))}
        {Array.from({ length: 4 - newest.length }, (_, i) => (
          <span key={`empty-${i}`} className="mini-frame empty" />
        ))}
      </span>
    </button>
  );
}

export function BlankPad() {
  return (
    <span className="pad">
      <span className="pad-sheet" />
      <svg className="pad-scribble" viewBox="0 0 100 60" aria-hidden="true">
        <path d="M12 40c10-22 20 12 30-6s18 10 28-4 14 6 20-2" fill="none" stroke="#5bb7ea" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <svg className="pad-crayon" viewBox="0 0 30 120" aria-hidden="true">
        <path d="M8 30 15 4 22 30Z" fill="#e8524f" />
        <rect x="6" y="28" width="18" height="92" rx="3" fill="#e8524f" />
        <rect x="6" y="40" width="18" height="70" fill="#000" opacity=".14" />
        <path d="M6 46h18M6 104h18" stroke="#fff" strokeOpacity=".7" strokeWidth="2.5" />
      </svg>
    </span>
  );
}
