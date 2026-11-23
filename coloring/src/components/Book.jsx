import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '../audio.js';

const TURN_MS = 650;
const DRAG_START = 14; // px a finger moves sideways before it's turning a page, not coloring
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * A spiral-bound book that turns its pages: swipe a page (it follows the finger and turns around the spiral),
 * tap the curled corner, or ask for a page (`request`). Turning back brings the page in from behind the spiral.
 * A jump of more than one page flicks through the pages between. A short tap that isn't a swipe goes to `onTap`.
 *
 * `renderFace(index, isOpen)` draws a page; only the open page (not turning) takes taps.
 */
export default function Book({ index, count, request, isReduced, onTurned, onTap, renderFace }) {
  const [turn, setTurn] = useState(null);
  const press = useRef(null);
  const book = useRef(null);
  const turnRef = useRef(null);
  turnRef.current = turn;

  const finish = useCallback(() => {
    const t = turnRef.current;
    if (!t || !t.settling) return;
    setTurn(null);
    if (t.final === 'done') onTurned(t.to);
  }, [onTurned]);

  /** Turns to a page with an animation (or straight away when motion is reduced). */
  const go = useCallback(
    (to) => {
      if (to === index || to < 0 || to >= count || turnRef.current) return;
      const dir = to > index ? 1 : -1;
      const isRiffle = Math.abs(to - index) > 1;
      if (isRiffle) sfx.riffle(Math.min(8, Math.abs(to - index) + 2));
      else sfx.turn();
      if (isReduced) {
        onTurned(to);
        return;
      }
      setTurn({ to, dir, angle: dir > 0 ? 0 : -180, isRiffle, settling: false, final: null });
      requestAnimationFrame(() => requestAnimationFrame(() => setTurn((t) => t && { ...t, angle: dir > 0 ? -180 : 0, settling: true, final: 'done' })));
    },
    [index, count, isReduced, onTurned],
  );

  useEffect(() => {
    if (request) go(request.to);
  }, [request]); // eslint-disable-line react-hooks/exhaustive-deps

  // If a transition never reports its end (a hidden tab), the turn still finishes.
  useEffect(() => {
    if (!turn?.settling) return undefined;
    const timer = setTimeout(finish, TURN_MS + 250);
    return () => clearTimeout(timer);
  }, [turn?.settling, finish]);

  const onPointerDown = (event) => {
    if (turnRef.current || event.button > 0) return;
    sfx.unlock();
    press.current = { x: event.clientX, y: event.clientY, id: event.pointerId, dragging: false, lastX: event.clientX, lastT: performance.now(), speed: 0 };
  };
  const onPointerMove = (event) => {
    const p = press.current;
    if (!p || p.id !== event.pointerId) return;
    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;
    if (!p.dragging) {
      if (Math.abs(dx) < DRAG_START || Math.abs(dx) < Math.abs(dy) * 1.2 || p.blocked) return;
      const dir = dx < 0 ? 1 : -1;
      if (index + dir < 0 || index + dir >= count) {
        p.blocked = true;
        return;
      }
      p.dragging = true;
      p.dir = dir;
      book.current.setPointerCapture?.(event.pointerId);
      setTurn({ to: index + dir, dir, angle: dir > 0 ? 0 : -180, dragging: true, settling: false, final: null });
    }
    const width = book.current.getBoundingClientRect().width;
    const pulled = (dx / width) * 190;
    const angle = p.dir > 0 ? clamp(pulled, -180, 0) : clamp(-180 + pulled, -180, 0);
    const now = performance.now();
    p.speed = (event.clientX - p.lastX) / Math.max(1, now - p.lastT);
    p.lastX = event.clientX;
    p.lastT = now;
    setTurn((t) => t && { ...t, angle });
  };
  const release = (isCancelled) => {
    const p = press.current;
    press.current = null;
    const t = turnRef.current;
    if (!p?.dragging || !t) return;
    // Far enough, or flicked: the page goes over. Otherwise it falls back.
    const flick = p.dir > 0 ? p.speed < -0.5 : p.speed > 0.5;
    const isOver = !isCancelled && (flick || (p.dir > 0 ? t.angle < -70 : t.angle > -110));
    if (isOver) sfx.turn();
    const target = isOver === p.dir > 0 ? -180 : 0;
    setTurn({ ...t, dragging: false, settling: true, angle: target, final: isOver ? 'done' : 'back' });
    if (Math.abs(t.angle - target) < 0.5) requestAnimationFrame(() => requestAnimationFrame(finish));
  };
  const onPointerUp = (event) => {
    const p = press.current;
    if (!p || p.id !== event.pointerId) return;
    if (p.dragging) return release(false);
    press.current = null;
    const isTap = !p.blocked && Math.abs(event.clientX - p.x) < DRAG_START && Math.abs(event.clientY - p.y) < DRAG_START;
    if (isTap && !event.target.closest('button')) onTap(event.clientX, event.clientY);
    return undefined;
  };

  const under = turn ? (turn.dir > 0 ? turn.to : index) : index;
  const turning = turn ? (turn.dir > 0 ? index : turn.to) : null;
  const lift = turn ? Math.sin((Math.abs(turn.angle) / 180) * Math.PI) : 0;
  // The turning page fades as it goes behind the spiral (and appears as it comes back).
  const isGone = turn && turn.settling && turn.final === 'done' && turn.dir > 0;
  const isArriving = turn && turn.dir < 0 && !turn.dragging && !turn.settling;
  return (
    <div
      ref={book}
      className={`book ${turn ? 'is-turning' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => release(true)}
    >
      <div className="sheet-stack" aria-hidden="true" />
      <div className="sheet under">
        {renderFace(under, !turn)}
        <div className="cast" style={{ opacity: lift * 0.5 }} aria-hidden="true" />
      </div>
      {turn?.isRiffle &&
        [0, 1, 2, 3].map((i) => (
          <div key={i} className={`ghost ${turn.dir > 0 ? 'forward' : 'backward'}`} style={{ animationDelay: `${i * 70}ms` }} aria-hidden="true" />
        ))}
      {turn && (
        <div
          className="turner"
          style={{
            transform: `rotateY(${turn.angle}deg)`,
            transition:
              turn.dragging || !turn.settling ? 'none' : `transform ${TURN_MS}ms cubic-bezier(.3,.6,.25,1), opacity 220ms ease ${isGone ? TURN_MS - 260 : 0}ms`,
            opacity: isGone || isArriving ? 0 : 1,
          }}
          onTransitionEnd={(event) => event.propertyName === 'transform' && finish()}
          aria-hidden="true"
        >
          <div className="face front">
            {renderFace(turning, false)}
            <div className="shade" style={{ opacity: lift * 0.35 }} />
          </div>
          <div className="face back">
            <div className="paper back-paper" />
          </div>
        </div>
      )}
    </div>
  );
}
