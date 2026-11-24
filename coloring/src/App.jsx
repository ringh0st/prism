import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Book from './components/Book.jsx';
import Cover from './components/Cover.jsx';
import Contents from './components/Contents.jsx';
import PageFace from './components/PageFace.jsx';
import CrayonBox from './components/CrayonBox.jsx';
import Spiral from './components/Spiral.jsx';
import Dialog from './components/Dialog.jsx';
import Room from './components/Room.jsx';
import Gallery from './components/Gallery.jsx';
import { StampRow, ToolRack } from './components/ToolRack.jsx';
import Sheet from './components/Sheet.jsx';
import Sketch from './components/Sketch.jsx';
import BackButton from './components/BackButton.jsx';
import { PAGES } from './pages.js';
import { CRAYONS, GLITTER, RAINBOW, canUndo, cleanPage, coloredPageIds, colorFor, isPageDone, paintPart, restoreBook, undoOnPage } from './book.js';
import { DEFAULT_SIZE, addStroke, clearSketch, isBlank, newSketch, undoStroke } from './sketches.js';
import { deleteSketch, loadSketches, saveSketch } from './sketchStore.js';
import { spreadColor } from './drawingDom.js';
import { savePicture } from './savePicture.js';
import { music, sfx } from './audio.js';
import { store } from './storage.js';

const PAINT_SECONDS = 0.55;
const COVER_MS = 950;
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
  clean: 'M4 20h16M7.5 16.5 4 13l8.5-8.5a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L11 18H8.5M9 8l7 7',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13',
  sound: 'M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  mute: 'M11 5 6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6',
  music: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
};

/**
 * My Pals Coloring Book, for 3 to 7 (easy to start, with more to find: glitter, stamps, crayon sizes, replays).
 * Places, each with one way back (a picture of where it goes, top left):
 * - the room: two walls, My Drawings and My Pals, and on the desk the coloring book and a blank pad;
 * - a wall up close: every picture with its day; a tap opens it again (a drawing replays itself first);
 * - the book: only for choosing, so turning pages never gets in the way of coloring; a tap on a Pal takes it out;
 * - the sheet: the Pal (or a blank page) big on the desk, with the crayon box. Nothing moves there: tap or slide
 *   a finger to color, or draw and stamp freely on the blank page.
 */
export default function App() {
  const [book, setBook] = useState(() => restoreBook(store.get('coloring.book', null)));
  const [sketches, setSketches] = useState([]);
  const [index, setIndex] = useState(() => Math.min(store.get('coloring.page', 0), PAGES.length));
  const [view, setView] = useState({ name: 'room' }); // room | wall { kind } | book | page { pageId, from } | sketch { id, from, replay }
  const [tool, setTool] = useState({ kind: 'draw', size: DEFAULT_SIZE, stamp: 'star' }); // room | book | page { pageId, from } | sketch { id, from }
  const [isCoverOpen, setIsCoverOpen] = useState(false);
  const [crayonId, setCrayonId] = useState(() => store.get('coloring.crayon', 'red'));
  const [isSoundOn, setIsSoundOn] = useState(() => store.get('coloring.sound', true));
  const [isMusicOn, setIsMusicOn] = useState(() => store.get('coloring.music', true));
  const [request, setRequest] = useState(null);
  const [celebrate, setCelebrate] = useState(null); // { pageId, id }
  const [pinnedId, setPinnedId] = useState(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const taps = useRef(0);
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const bookRef = useRef(book);
  bookRef.current = book;
  const isReduced = useMemo(reducedMotion, []);

  const page = view.name === 'page' ? PAGES.find((p) => p.id === view.pageId) : null;
  const sketch = view.name === 'sketch' ? sketches.find((s) => s.id === view.id) : null;
  const doneIds = useMemo(() => new Set(PAGES.filter((p) => isPageDone(book, p)).map((p) => p.id)), [book]);
  const palItems = useMemo(
    () =>
      coloredPageIds(book)
        .map((id) => {
          const p = PAGES.find((x) => x.id === id);
          return p && { id: `page-${id}`, page: p, colors: book.colors[id], isDone: doneIds.has(id), at: book.touched[id] ?? 0 };
        })
        .filter(Boolean),
    [book, doneIds],
  );
  const drawingItems = useMemo(
    () =>
      sketches
        .filter((s) => !isBlank(s))
        .map((s) => ({ id: s.id, sketch: s, at: s.created ?? s.updated }))
        .sort((a, b) => b.at - a.at),
    [sketches],
  );

  useEffect(() => {
    loadSketches().then((saved) => setSketches((now) => (now.length ? now : saved)));
  }, []);
  useEffect(() => store.set('coloring.book', book), [book]);
  useEffect(() => store.set('coloring.page', index), [index]);
  useEffect(() => store.set('coloring.crayon', crayonId), [crayonId]);
  useEffect(() => {
    sfx.setOn(isSoundOn);
    store.set('coloring.sound', isSoundOn);
  }, [isSoundOn]);
  useEffect(() => {
    store.set('coloring.music', isMusicOn);
    if (isMusicOn && isSoundOn && hasStarted) music.start();
    else music.stop();
    return () => music.stop();
  }, [isMusicOn, isSoundOn, hasStarted]);

  const start = () => {
    sfx.unlock();
    setHasStarted(true);
  };

  // --- Moving between the room, the book and the sheet ---------------------------------------------------
  const openBook = () => {
    start();
    sfx.openCover();
    setIsCoverOpen(isReduced);
    setView({ name: 'book' });
    if (!isReduced) setTimeout(() => setIsCoverOpen(true), COVER_MS);
  };
  const openPage = (pageId, from) => {
    start();
    sfx.turn();
    const i = PAGES.findIndex((p) => p.id === pageId) + 1;
    if (from === 'book') setIndex(i);
    setCelebrate(null);
    setView({ name: 'page', pageId, from });
  };
  const openSketch = (existing) => {
    start();
    sfx.turn();
    const s = existing ?? newSketch();
    if (!existing) setSketches((all) => [...all, s]);
    setView({ name: 'sketch', id: s.id, from: 'drawings', replay: Boolean(existing) });
  };
  const openWall = (kind) => {
    start();
    sfx.turn();
    setPinnedId(null);
    setView({ name: 'wall', kind });
  };
  /** Back to where the child came from; a new drawing or colored page is pinned on its wall as they arrive. */
  const goBack = () => {
    sfx.turn();
    if (view.name === 'wall' || view.name === 'book') return setView({ name: 'room' });
    if (view.name === 'sketch') {
      if (isBlank(sketch)) {
        setSketches((all) => all.filter((s) => s.id !== sketch.id));
        deleteSketch(sketch.id);
      } else setPinnedId(sketch.id);
      return setView({ name: 'wall', kind: 'drawings' });
    }
    if (view.from === 'book') {
      setIsCoverOpen(true);
      return setView({ name: 'book' });
    }
    setPinnedId(`page-${view.pageId}`);
    return setView({ name: 'wall', kind: 'pals' });
  };
  const openWallItem = (item) => (item.page ? openPage(item.page.id, 'pals') : openSketch(item.sketch));

  const turnTo = useCallback((to) => setRequest({ to, id: performance.now() }), []);
  const onTurned = useCallback((to) => setIndex(to), []);

  // --- Coloring a Pal ------------------------------------------------------------------------------------
  const paint = async (part, x, y) => {
    const svg = svgRef.current;
    if (!page || !svg) return;
    if (part == null) return sfx.tap();
    const color = colorFor(crayonId, taps.current++);
    const wasDone = isPageDone(bookRef.current, page);
    sfx.paint(
      CRAYONS.findIndex((c) => c.id === crayonId),
      PAINT_SECONDS,
    );
    if (color === GLITTER) sfx.twinkle();
    navigator.vibrate?.(8);
    await spreadColor(svg, part, color, x, y, isReduced ? 0 : PAINT_SECONDS);
    const next = paintPart(bookRef.current, page.id, part, color);
    bookRef.current = next;
    setBook(next);
    if (!wasDone && isPageDone(next, page)) {
      sfx.finished();
      setTimeout(() => sfx.sticker(), 1100);
      setCelebrate({ pageId: page.id, id: performance.now() });
    }
    return undefined;
  };

  // --- Free drawing --------------------------------------------------------------------------------------
  const updateSketch = (change) => {
    setSketches((all) =>
      all.map((s) => {
        if (s.id !== sketch.id) return s;
        const next = change(s);
        saveSketch(next);
        return next;
      }),
    );
  };
  const pickStrokeColor = () => {
    const color = colorFor(crayonId, taps.current++);
    if (color === GLITTER) sfx.twinkle();
    return color;
  };
  const chooseTool = (next) => {
    sfx.pick(next.kind === 'stamp' ? 9 : next.size * 2);
    setTool(next);
  };

  // --- The tray and the top bar --------------------------------------------------------------------------
  const pick = (id) => {
    start();
    sfx.pick(CRAYONS.findIndex((c) => c.id === id));
    setCrayonId(id);
  };
  const canTakeBack = page ? canUndo(book, page.id) : Boolean(sketch?.strokes.length);
  const undo = () => {
    if (page) {
      const { book: next, part } = undoOnPage(book, page.id);
      if (part == null) return;
      setBook(next);
    } else if (sketch?.strokes.length) updateSketch(undoStroke);
    else return;
    sfx.undo();
  };
  const clean = () => {
    sfx.clean();
    if (page) setBook(cleanPage(book, page.id));
    else if (sketch) updateSketch(clearSketch);
    setCelebrate(null);
    setIsCleaning(false);
  };
  const hasMarks = page ? Boolean(Object.keys(book.colors[page.id] ?? {}).length) : Boolean(sketch?.strokes.length);
  const share = () => (page ? savePicture(svgRef.current, page.name) : savePicture(canvasRef.current, ''));

  // Keyboard: arrows turn the book's pages; Enter or Space on a part of the sheet colors it.
  useEffect(() => {
    const onKey = (event) => {
      if (isCleaning) return;
      if (view.name === 'book' && event.key === 'ArrowRight') turnTo(index + 1);
      else if (view.name === 'book' && event.key === 'ArrowLeft') turnTo(index - 1);
      else if (page && (event.key === 'Enter' || event.key === ' ') && event.target.dataset?.r != null) {
        event.preventDefault();
        const box = event.target.getBoundingClientRect();
        paint(Number(event.target.dataset.r), box.left + box.width / 2, box.top + box.height / 2);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const renderFace = (i, isTop) => {
    const isOpen = isTop && isCoverOpen;
    if (i === 0)
      return (
        <Contents pages={PAGES} book={book} doneIds={doneIds} isOpen={isOpen} onOpenPage={(n) => openPage(PAGES[n - 1].id, 'book')} onNext={() => turnTo(1)} />
      );
    const p = PAGES[i - 1];
    return (
      <PageFace
        page={p}
        number={i}
        colors={book.colors[p.id]}
        isDone={doneIds.has(p.id)}
        isOpen={isOpen}
        onColor={() => openPage(p.id, 'book')}
        onNext={i < PAGES.length ? () => turnTo(i + 1) : null}
        onBack={() => turnTo(i - 1)}
      />
    );
  };

  const isOnSheet = view.name === 'page' || view.name === 'sketch';
  const backTo = { wall: 'room', book: 'room', sketch: 'drawings', page: view.from === 'book' ? 'book' : 'pals' }[view.name];
  const stampColor = crayonId === 'rainbow' ? RAINBOW[0] : crayonId === 'glitter' ? '#f2c14a' : CRAYONS.find((c) => c.id === crayonId)?.color;
  return (
    <div className={`desk at-${view.name}`}>
      <header className="bar">
        <div className="bar-side">
          {view.name === 'room' ? (
            <a className="icon-btn" href="../" aria-label="All games" title="All games">
              <Glyph d={ICONS.games} />
            </a>
          ) : (
            <BackButton to={backTo} isBeckoning={Boolean(page && celebrate)} onClick={goBack} />
          )}
        </div>
        <div className="bar-side">
          {isOnSheet && hasMarks && (
            <>
              <button className="icon-btn" onClick={share} aria-label="Save or share the picture" title="Save picture">
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
        {view.name === 'room' && (
          <Room drawings={drawingItems} pals={palItems} onOpenWall={openWall} onOpenBook={openBook} onNewSketch={() => openSketch(null)} />
        )}
        {view.name === 'wall' && (
          <Gallery
            kind={view.kind}
            items={view.kind === 'drawings' ? drawingItems : palItems}
            pinnedId={pinnedId}
            onOpenItem={openWallItem}
            onStart={view.kind === 'drawings' ? () => openSketch(null) : openBook}
          />
        )}
        {view.name === 'book' && (
          <div className="book-frame">
            <Book index={index} count={PAGES.length + 1} request={request} isReduced={isReduced} onTurned={onTurned} onTap={() => {}} renderFace={renderFace} />
            {!isCoverOpen && <Cover />}
            <Spiral />
          </div>
        )}
        {page && (
          <div className="sheet-frame" key={page.id}>
            <Sheet
              page={page}
              colors={book.colors[page.id]}
              isDone={doneIds.has(page.id)}
              celebrate={celebrate?.pageId === page.id ? celebrate.id : null}
              svgRef={svgRef}
              onPaint={paint}
            />
          </div>
        )}
        {sketch && (
          <div className="sheet-frame" key={sketch.id}>
            <Sketch
              sketch={sketch}
              tool={tool}
              pickColor={pickStrokeColor}
              canvasRef={canvasRef}
              isReplaying={Boolean(view.replay)}
              onReplayed={() => setView((v) => ({ ...v, replay: false }))}
              onStroke={(stroke) => updateSketch((s) => addStroke(s, stroke))}
            />
          </div>
        )}
      </main>
      {isOnSheet && (
        <footer className={`tray ${sketch ? 'with-tools' : ''}`}>
          {sketch && tool.kind === 'stamp' && <StampRow tool={tool} color={stampColor} onTool={chooseTool} />}
          {sketch && <ToolRack tool={tool} onTool={chooseTool} />}
          <CrayonBox crayonId={crayonId} onPick={pick} />
          <button className="undo" onClick={undo} disabled={!canTakeBack} aria-label="Take back the last color">
            <Glyph d={ICONS.undo} />
          </button>
        </footer>
      )}
      {isCleaning && (
        <Dialog title="Clean this page?" picture={<div className="blank-page" />} yesLabel="Yes, clean it" onYes={clean} onNo={() => setIsCleaning(false)} />
      )}
    </div>
  );
}
