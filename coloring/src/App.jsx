import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Book from './components/Book.jsx';
import Cover from './components/Cover.jsx';
import Contents from './components/Contents.jsx';
import PageFace from './components/PageFace.jsx';
import CrayonBox from './components/CrayonBox.jsx';
import Spiral from './components/Spiral.jsx';
import Dialog from './components/Dialog.jsx';
import { PAGES } from './pages.js';
import { CRAYONS, canUndo, cleanPage, colorFor, isPageDone, paintPart, restoreBook, undoOnPage } from './book.js';
import { centerOf, partAt, spreadColor } from './drawingDom.js';
import { savePicture } from './savePicture.js';
import { music, sfx } from './audio.js';
import { store } from './storage.js';

const PAINT_SECONDS = 0.55;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const Glyph = ({ d }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
const ICONS = {
  games: 'M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z',
  contents: 'M5 4.5h10.5a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h10.5M9 8.5h5',
  clean: 'M4 20h16M7.5 16.5 4 13l8.5-8.5a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L11 18H8.5M9 8l7 7',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13',
  sound: 'M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  mute: 'M11 5 6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6',
  music: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
};

/**
 * My Pals Coloring Book: a spiral-bound book of the Pals from Lumipals for little ones (3 years and up).
 * Open the cover, turn the pages, pick a crayon and tap a part: the color spreads from the finger, with a
 * scribble and a soft note. Nothing to read and nothing to get wrong; a finished page gets a gold star.
 */
export default function App() {
  const [book, setBook] = useState(() => restoreBook(store.get('coloring.book', null)));
  const [index, setIndex] = useState(() => Math.min(store.get('coloring.page', 0), PAGES.length));
  const [cover, setCover] = useState('closed'); // closed → opening → open
  const [crayonId, setCrayonId] = useState(() => store.get('coloring.crayon', 'red'));
  const [isSoundOn, setIsSoundOn] = useState(() => store.get('coloring.sound', true));
  const [isMusicOn, setIsMusicOn] = useState(() => store.get('coloring.music', true));
  const [request, setRequest] = useState(null);
  const [celebrate, setCelebrate] = useState(null); // { pageId, id }
  const [isCleaning, setIsCleaning] = useState(false);
  const taps = useRef(0);
  const svgRef = useRef(null);
  const bookRef = useRef(book);
  bookRef.current = book;
  const isReduced = useMemo(reducedMotion, []);

  const page = index > 0 ? PAGES[index - 1] : null;
  const doneIds = useMemo(() => new Set(PAGES.filter((p) => isPageDone(book, p)).map((p) => p.id)), [book]);

  useEffect(() => store.set('coloring.book', book), [book]);
  useEffect(() => store.set('coloring.page', index), [index]);
  useEffect(() => store.set('coloring.crayon', crayonId), [crayonId]);
  useEffect(() => {
    sfx.setOn(isSoundOn);
    store.set('coloring.sound', isSoundOn);
  }, [isSoundOn]);
  useEffect(() => {
    store.set('coloring.music', isMusicOn);
    if (isMusicOn && isSoundOn && cover !== 'closed') music.start();
    else music.stop();
    return () => music.stop();
  }, [isMusicOn, isSoundOn, cover]);

  const openCover = () => {
    if (cover !== 'closed') return;
    sfx.unlock();
    sfx.openCover();
    setCover(isReduced ? 'open' : 'opening');
    if (!isReduced) setTimeout(() => setCover('open'), 950);
  };
  const turnTo = useCallback((to) => setRequest({ to, id: performance.now() }), []);
  const onTurned = useCallback((to) => {
    setIndex(to);
    setCelebrate(null);
  }, []);

  /** Colors the part under a finger (or the one a keyboard user is on). */
  const paintAt = async (x, y, part = null) => {
    const svg = svgRef.current;
    if (!page || !svg) return;
    const k = part ?? partAt(svg, x, y);
    if (k == null) return sfx.tap();
    const color = colorFor(crayonId, taps.current++);
    const wasDone = isPageDone(bookRef.current, page);
    sfx.paint(
      CRAYONS.findIndex((c) => c.id === crayonId),
      PAINT_SECONDS,
    );
    navigator.vibrate?.(8);
    await spreadColor(svg, k, color, x, y, isReduced ? 0 : PAINT_SECONDS);
    const next = paintPart(bookRef.current, page.id, k, color);
    bookRef.current = next;
    setBook(next);
    if (!wasDone && isPageDone(next, page)) {
      sfx.finished();
      setTimeout(() => sfx.sticker(), 1100);
      setCelebrate({ pageId: page.id, id: performance.now() });
    }
    return undefined;
  };

  // Keyboard: arrows turn pages; Enter or Space on a part colors it.
  useEffect(() => {
    const onKey = (event) => {
      if (cover !== 'open' || isCleaning) return;
      if (event.key === 'ArrowRight') turnTo(index + 1);
      else if (event.key === 'ArrowLeft') turnTo(index - 1);
      else if ((event.key === 'Enter' || event.key === ' ') && event.target.dataset?.r != null && svgRef.current) {
        event.preventDefault();
        const part = Number(event.target.dataset.r);
        const { x, y } = centerOf(svgRef.current, part);
        paintAt(x, y, part);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pick = (id) => {
    sfx.unlock();
    sfx.pick(CRAYONS.findIndex((c) => c.id === id));
    setCrayonId(id);
  };
  const undo = () => {
    if (!page) return;
    const { book: next, part } = undoOnPage(book, page.id);
    if (part == null) return;
    sfx.undo();
    setBook(next);
  };
  const clean = () => {
    sfx.clean();
    setBook(cleanPage(book, page.id));
    setCelebrate(null);
    setIsCleaning(false);
  };

  const renderFace = (i, isTop) => {
    const isOpen = isTop && cover === 'open';
    if (i === 0) return <Contents pages={PAGES} book={book} doneIds={doneIds} isOpen={isOpen} onOpenPage={turnTo} onNext={() => turnTo(1)} />;
    const p = PAGES[i - 1];
    return (
      <PageFace
        page={p}
        number={i}
        colors={book.colors[p.id]}
        isDone={doneIds.has(p.id)}
        isOpen={isOpen}
        celebrate={isOpen && celebrate?.pageId === p.id ? celebrate.id : null}
        svgRef={svgRef}
        onNext={i < PAGES.length ? () => turnTo(i + 1) : null}
        onBack={() => turnTo(i - 1)}
      />
    );
  };

  const hasColors = Boolean(page && Object.keys(book.colors[page.id] ?? {}).length);
  return (
    <div className="desk">
      <header className="bar">
        <div className="bar-side">
          <a className="icon-btn" href="../" aria-label="All games" title="All games">
            <Glyph d={ICONS.games} />
          </a>
          {cover === 'open' && index > 0 && (
            <button className="icon-btn" onClick={() => turnTo(0)} aria-label="All the friends in the book" title="Contents">
              <Glyph d={ICONS.contents} />
            </button>
          )}
        </div>
        <div className="bar-side">
          {hasColors && (
            <>
              <button className="icon-btn" onClick={() => savePicture(svgRef.current, page.name)} aria-label="Save or share the picture" title="Save picture">
                <Glyph d={ICONS.share} />
              </button>
              <button className="icon-btn" onClick={() => setIsCleaning(true)} aria-label="Clean this page" title="Clean page">
                <Glyph d={ICONS.clean} />
              </button>
            </>
          )}
          <button
            className={`icon-btn ${isMusicOn ? '' : 'off'}`}
            onClick={() => setIsMusicOn((on) => !on)}
            aria-pressed={isMusicOn}
            aria-label="Music"
            title="Music"
          >
            <Glyph d={ICONS.music} />
          </button>
          <button className="icon-btn" onClick={() => setIsSoundOn((on) => !on)} aria-pressed={isSoundOn} aria-label="Sound" title="Sound">
            <Glyph d={isSoundOn ? ICONS.sound : ICONS.mute} />
          </button>
        </div>
      </header>
      <main className="stage">
        <div className="book-frame">
          <Book index={index} count={PAGES.length + 1} request={request} isReduced={isReduced} onTurned={onTurned} onTap={paintAt} renderFace={renderFace} />
          {cover !== 'open' && <Cover isOpening={cover === 'opening'} onOpen={openCover} />}
          <Spiral />
        </div>
      </main>
      <footer className={`tray ${cover === 'open' ? '' : 'resting'}`}>
        <CrayonBox crayonId={crayonId} onPick={pick} />
        <button className="undo" onClick={undo} disabled={!page || !canUndo(book, page.id)} aria-label="Take back the last color">
          <Glyph d={ICONS.undo} />
        </button>
      </footer>
      {isCleaning && (
        <Dialog title="Clean this page?" picture={<div className="blank-page" />} yesLabel="Yes, clean it" onYes={clean} onNo={() => setIsCleaning(false)} />
      )}
    </div>
  );
}
