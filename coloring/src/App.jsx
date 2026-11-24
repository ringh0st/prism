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
import PageThumb from './components/PageThumb.jsx';
import SketchThumb from './components/SketchThumb.jsx';
import { StampRow, ToolRack } from './components/ToolRack.jsx';
import Sheet from './components/Sheet.jsx';
import Sketch from './components/Sketch.jsx';
import BackButton from './components/BackButton.jsx';
import { PAGES } from './pages.js';
import { BOOKS } from './books.js';
import { CRAYONS, GLITTER, RAINBOW, canUndo, cleanPage, coloredPageIds, colorFor, isPageDone, paintPart, restoreBook, undoOnPage } from './book.js';
import { DEFAULT_SIZE, addStroke, clearSketch, isBlank, moveStamp, newSketch, undoStroke } from './sketches.js';
import { deleteSketch, loadSketches, saveSketch } from './sketchStore.js';
import { spreadColor } from './drawingDom.js';
import { savePicture } from './savePicture.js';
import { music, sfx } from './audio.js';
import { store } from './storage.js';
import { currentTheme, saveTheme } from './theme.js';

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
  remove: 'M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6',
  done: 'M5 12.5l4.5 4.5L19 7.5',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun: 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM12 1.5V4M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8',
};

/**
 * My Pals Coloring Book: two books for 3 to 10 (easy to start, with more to find: glitter, stamps, crayon sizes,
 * replays, and the big book's detailed pages to fill or paint by hand).
 * Places, each with one way back (a picture of where it goes, top left):
 * - the room: two walls, My Drawings and My Pals, and on the desk the two books and a blank pad;
 * - a wall up close: every picture with its day; a tap opens it again (a drawing replays itself first);
 * - a book: only for choosing, so turning pages never gets in the way of coloring; a tap on a Pal takes it out;
 * - the sheet: the Pal (or a blank page) big on the desk, with the crayon box. Nothing moves there: tap or slide
 *   a finger to color, paint by hand on the big book's pages, or draw and stamp freely on the blank page.
 */
export default function App() {
  const [book, setBook] = useState(() => restoreBook(store.get('coloring.book', null)));
  const [sketches, setSketches] = useState([]);
  const [paints, setPaints] = useState({}); // crayon painted by hand over big-book pages: { pageId: { strokes, updated } }
  const [bigPages, setBigPages] = useState(null);
  const [indexes, setIndexes] = useState(() => ({ little: store.get('coloring.page', 0), big: store.get('coloring.page.big', 0) }));
  const [view, setView] = useState({ name: 'room' }); // room | wall { kind } | book { bookId } | page { pageId, from } | sketch { id, from, replay }
  const [sketchTool, setSketchTool] = useState({ kind: 'draw', size: DEFAULT_SIZE, stamp: 'star' });
  const [pageTool, setPageTool] = useState({ kind: 'fill', size: 0 });
  const [isCoverOpen, setIsCoverOpen] = useState(false);
  const [crayonId, setCrayonId] = useState(() => store.get('coloring.crayon', 'red'));
  const [isSoundOn, setIsSoundOn] = useState(() => store.get('coloring.sound', true));
  const [isMusicOn, setIsMusicOn] = useState(() => store.get('coloring.music', true));
  const [request, setRequest] = useState(null);
  const [celebrate, setCelebrate] = useState(null); // { pageId, id }
  const [pinnedId, setPinnedId] = useState(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [theme, setTheme] = useState(currentTheme);
  const [isRemoving, setIsRemoving] = useState(false); // the wall's pictures show a ✗ to take one off
  const [toRemove, setToRemove] = useState(null); // the picture asked about
  const [hasStarted, setHasStarted] = useState(false);
  const taps = useRef(0);
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const paintRef = useRef(null);
  const actions = useRef({}); // per page, the order of fills and painted lines this visit, so Undo takes back the last
  const bookRef = useRef(book);
  bookRef.current = book;
  const isReduced = useMemo(reducedMotion, []);

  const allPages = useMemo(() => [...PAGES, ...(bigPages ?? [])], [bigPages]);
  const pagesOf = (bookId) => (bookId === 'big' ? (bigPages ?? []) : PAGES);
  const page = view.name === 'page' ? allPages.find((p) => p.id === view.pageId) : null;
  const sketch = view.name === 'sketch' ? sketches.find((s) => s.id === view.id) : null;
  const doneIds = useMemo(() => new Set(allPages.filter((p) => isPageDone(book, p)).map((p) => p.id)), [book, allPages]);
  const palItems = useMemo(() => {
    const ids = new Set([...coloredPageIds(book), ...Object.keys(paints).filter((id) => paints[id].strokes.length)]);
    return [...ids]
      .map((id) => {
        const p = allPages.find((x) => x.id === id);
        const at = Math.max(book.touched[id] ?? 0, paints[id]?.updated ?? 0);
        return p && { id: `page-${id}`, page: p, colors: book.colors[id], paint: paints[id]?.strokes, isDone: doneIds.has(id), at };
      })
      .filter(Boolean)
      .sort((a, b) => b.at - a.at);
  }, [book, paints, doneIds, allPages]);
  const drawingItems = useMemo(
    () =>
      sketches
        .filter((s) => !isBlank(s))
        .map((s) => ({ id: s.id, sketch: s, at: s.created ?? s.updated }))
        .sort((a, b) => b.at - a.at),
    [sketches],
  );

  useEffect(() => {
    loadSketches().then((saved) => {
      const kept = {};
      for (const record of saved) if (record.id.startsWith('paint-')) kept[record.id.slice(6)] = record;
      setPaints((now) => ({ ...kept, ...now }));
      setSketches((now) => (now.length ? now : saved.filter((record) => !record.id.startsWith('paint-'))));
    });
    // The big book's pages are bigger, so they load on their own once the room is up.
    import('./bigPages.js').then((module) => setBigPages(module.BIG_PAGES));
  }, []);
  useEffect(() => store.set('coloring.book', book), [book]);
  useEffect(() => {
    store.set('coloring.page', indexes.little);
    store.set('coloring.page.big', indexes.big);
  }, [indexes]);
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

  // --- Moving between the room, the walls, the books and the sheet ---------------------------------------
  const openBook = (bookId) => {
    if (bookId === 'big' && !bigPages) return;
    start();
    sfx.openCover();
    setIsCoverOpen(isReduced);
    setView({ name: 'book', bookId });
    if (!isReduced) setTimeout(() => setIsCoverOpen(true), COVER_MS);
  };
  const openPage = (pageId, from) => {
    start();
    sfx.turn();
    const p = allPages.find((x) => x.id === pageId);
    if (from === 'book') setIndexes((all) => ({ ...all, [p.book]: pagesOf(p.book).indexOf(p) + 1 }));
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
    setIsRemoving(false);
    setView({ name: 'wall', kind });
  };
  /** Back to where the child came from; a new drawing or colored page is pinned on its wall as they arrive. */
  const goBack = () => {
    sfx.turn();
    setIsRemoving(false);
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
      return setView({ name: 'book', bookId: page.book });
    }
    setPinnedId(`page-${view.pageId}`);
    return setView({ name: 'wall', kind: 'pals' });
  };
  const openWallItem = (item) => (item.page ? openPage(item.page.id, 'pals') : openSketch(item.sketch));

  const turnTo = useCallback((to) => setRequest({ to, id: performance.now() }), []);
  const onTurned = useCallback((to) => setIndexes((all) => ({ ...all, [view.bookId]: to })), [view.bookId]);

  const remember = (pageId, kind) => {
    actions.current[pageId] = [...(actions.current[pageId] ?? []), kind];
  };

  // --- Coloring a Pal: filling parts ---------------------------------------------------------------------
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
    remember(page.id, 'fill');
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

  // --- Crayon by hand: on big-book pages, and on blank sheets ------------------------------------------------
  const setPagePaint = (pageId, change) => {
    setPaints((all) => {
      const record = { id: `paint-${pageId}`, strokes: change(all[pageId]?.strokes ?? []), updated: Date.now() };
      saveSketch(record);
      return { ...all, [pageId]: record };
    });
  };
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
  const chooseTool = (setTool) => (next) => {
    sfx.pick(next.kind === 'draw' ? next.size * 3 : 9);
    setTool(next);
  };

  // --- The tray and the top bar --------------------------------------------------------------------------
  const pick = (id) => {
    start();
    sfx.pick(CRAYONS.findIndex((c) => c.id === id));
    setCrayonId(id);
  };
  const pagePaint = page ? (paints[page.id]?.strokes ?? []) : [];
  const canTakeBack = page ? canUndo(book, page.id) || pagePaint.length > 0 : Boolean(sketch?.strokes.length);
  const undo = () => {
    if (page) {
      const last = actions.current[page.id]?.pop() ?? (pagePaint.length ? 'paint' : 'fill');
      if (last === 'paint' && pagePaint.length) setPagePaint(page.id, (strokes) => strokes.slice(0, -1));
      else {
        const { book: next, part } = undoOnPage(book, page.id);
        if (part == null) return;
        setBook(next);
      }
    } else if (sketch?.strokes.length) updateSketch(undoStroke);
    else return;
    sfx.undo();
  };
  /** Takes a picture off its wall: a drawing is thrown away, a colored page becomes clean again. */
  const removePicture = () => {
    const item = toRemove;
    setToRemove(null);
    sfx.clean();
    if (item.sketch) {
      setSketches((all) => all.filter((s) => s.id !== item.sketch.id));
      deleteSketch(item.sketch.id);
    } else {
      setBook((now) => cleanPage(now, item.page.id));
      if (paints[item.page.id]) setPagePaint(item.page.id, () => []);
    }
  };
  const clean = () => {
    sfx.clean();
    if (page) {
      setBook(cleanPage(book, page.id));
      if (pagePaint.length) setPagePaint(page.id, () => []);
      actions.current[page.id] = [];
    } else if (sketch) updateSketch(clearSketch);
    setCelebrate(null);
    setIsCleaning(false);
  };
  const hasMarks = page ? Boolean(Object.keys(book.colors[page.id] ?? {}).length || pagePaint.length) : Boolean(sketch?.strokes.length);
  const share = () => (page ? savePicture(svgRef.current, page.name, pagePaint) : savePicture(canvasRef.current, ''));

  // Keyboard: arrows turn the book's pages; Enter or Space on a part of the sheet colors it.
  useEffect(() => {
    const onKey = (event) => {
      if (isCleaning) return;
      const index = indexes[view.bookId];
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
    const pages = pagesOf(view.bookId);
    const isOpen = isTop && isCoverOpen;
    if (i === 0)
      return (
        <Contents pages={pages} book={book} doneIds={doneIds} isOpen={isOpen} onOpenPage={(n) => openPage(pages[n - 1].id, 'book')} onNext={() => turnTo(1)} />
      );
    const p = pages[i - 1];
    return (
      <PageFace
        page={p}
        number={i}
        colors={book.colors[p.id]}
        isDone={doneIds.has(p.id)}
        isOpen={isOpen}
        onColor={() => openPage(p.id, 'book')}
        onNext={i < pages.length ? () => turnTo(i + 1) : null}
        onBack={() => turnTo(i - 1)}
      />
    );
  };

  const isOnSheet = view.name === 'page' || view.name === 'sketch';
  const canPaint = Boolean(page && BOOKS[page.book].canPaint);
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
          {view.name === 'wall' && (view.kind === 'drawings' ? drawingItems : palItems).length > 0 && (
            <button
              className={`icon-btn ${isRemoving ? 'on' : ''}`}
              onClick={() => setIsRemoving((on) => !on)}
              aria-pressed={isRemoving}
              aria-label={isRemoving ? 'Done taking pictures off' : 'Take pictures off the wall'}
              title={isRemoving ? 'Done' : 'Remove pictures'}
            >
              <Glyph d={isRemoving ? ICONS.done : ICONS.remove} />
            </button>
          )}
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
          {(view.name === 'room' || view.name === 'wall') && (
            <button
              className="icon-btn"
              onClick={() => {
                const next = theme === 'night' ? 'day' : 'night';
                sfx.pick(next === 'night' ? 2 : 7);
                saveTheme(next);
                setTheme(next);
              }}
              aria-label={theme === 'night' ? 'Day' : 'Night'}
              title={theme === 'night' ? 'Day' : 'Night'}
            >
              <Glyph d={theme === 'night' ? ICONS.sun : ICONS.moon} />
            </button>
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
          <Room
            drawings={drawingItems}
            pals={palItems}
            isBigReady={Boolean(bigPages)}
            onOpenWall={openWall}
            onOpenBook={openBook}
            onNewSketch={() => openSketch(null)}
          />
        )}
        {view.name === 'wall' && (
          <Gallery
            kind={view.kind}
            items={view.kind === 'drawings' ? drawingItems : palItems}
            pinnedId={pinnedId}
            onOpenItem={openWallItem}
            isRemoving={isRemoving}
            onRemove={setToRemove}
            onStart={view.kind === 'drawings' ? () => openSketch(null) : () => openBook('little')}
          />
        )}
        {view.name === 'book' && (
          <div className={`book-frame ${view.bookId}`}>
            <Book
              key={view.bookId}
              index={indexes[view.bookId]}
              count={pagesOf(view.bookId).length + 1}
              request={request}
              isReduced={isReduced}
              onTurned={onTurned}
              onTap={() => {}}
              renderFace={renderFace}
            />
            {!isCoverOpen && <Cover bookId={view.bookId} />}
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
              tool={canPaint ? pageTool : null}
              paint={pagePaint}
              pickColor={pickStrokeColor}
              paintRef={canPaint ? paintRef : null}
              onPaintLine={(line) => {
                remember(page.id, 'paint');
                setPagePaint(page.id, (strokes) => [...strokes, line]);
              }}
            />
          </div>
        )}
        {sketch && (
          <div className="sheet-frame" key={sketch.id}>
            <Sketch
              sketch={sketch}
              tool={sketchTool}
              pickColor={pickStrokeColor}
              canvasRef={canvasRef}
              isReplaying={Boolean(view.replay)}
              onReplayed={() => setView((v) => ({ ...v, replay: false }))}
              onStroke={(stroke) => updateSketch((s) => addStroke(s, stroke))}
              onMoveStamp={(index, x, y) => updateSketch((s) => moveStamp(s, index, x, y))}
            />
          </div>
        )}
      </main>
      {isOnSheet && (
        <footer className={`tray ${sketch || canPaint ? 'with-tools' : ''}`}>
          {sketch && sketchTool.kind === 'stamp' && <StampRow tool={sketchTool} color={stampColor} onTool={chooseTool(setSketchTool)} />}
          {sketch && <ToolRack tool={sketchTool} others={['stamp', 'bg']} onTool={chooseTool(setSketchTool)} />}
          {canPaint && <ToolRack tool={pageTool} others={['fill']} onTool={chooseTool(setPageTool)} />}
          <CrayonBox crayonId={crayonId} onPick={pick} />
          <button className="undo" onClick={undo} disabled={!canTakeBack} aria-label="Take back the last color">
            <Glyph d={ICONS.undo} />
          </button>
        </footer>
      )}
      {toRemove && (
        <Dialog
          title="Take it off the wall?"
          picture={
            <span className="framed small">
              <span className="frame-paper">
                {toRemove.page ? <PageThumb page={toRemove.page} colors={toRemove.colors} paint={toRemove.paint} /> : <SketchThumb sketch={toRemove.sketch} />}
              </span>
            </span>
          }
          yesLabel="Yes, take it off"
          onYes={removePicture}
          onNo={() => setToRemove(null)}
        />
      )}
      {isCleaning && (
        <Dialog title="Clean this page?" picture={<div className="blank-page" />} yesLabel="Yes, clean it" onYes={clean} onNo={() => setIsCleaning(false)} />
      )}
    </div>
  );
}
