import { useEffect, useRef, useState } from 'react';
import Drawing from './Drawing.jsx';
import Sticker from './Sticker.jsx';
import { PageCorners } from './PageFace.jsx';

/**
 * The first page: every friend in the book as a little picture in its colors so far; a tap goes to its page.
 * The list is longer than the page, so it shows that more waits below (owner: children didn't know they could
 * scroll): the last row fades out under a bouncing arrow that scrolls on, an arrow up appears once scrolled, and
 * the first time the page opens the list peeks down a little and back, the way a hand would try it.
 */
export default function Contents({ pages, book, doneIds, isOpen, isReduced, onOpenPage, onNext }) {
  const listRef = useRef(null);
  const [edges, setEdges] = useState({ top: true, bottom: true });
  const hasPeeked = useRef(false);

  const measure = () => {
    const list = listRef.current;
    if (!list) return;
    const top = list.scrollTop < 8;
    const bottom = list.scrollTop + list.clientHeight > list.scrollHeight - 8;
    setEdges((was) => (was.top === top && was.bottom === bottom ? was : { top, bottom }));
  };

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(list);
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!isOpen || isReduced || hasPeeked.current || !list || list.scrollHeight <= list.clientHeight + 8) return undefined;
    hasPeeked.current = true;
    const down = setTimeout(() => list.scrollTo({ top: Math.min(70, list.clientHeight / 4), behavior: 'smooth' }), 700);
    const back = setTimeout(() => list.scrollTo({ top: 0, behavior: 'smooth' }), 1500);
    return () => {
      clearTimeout(down);
      clearTimeout(back);
    };
  }, [isOpen, isReduced]);

  const scrollBy = (dir) => {
    const list = listRef.current;
    list?.scrollBy({ top: dir * list.clientHeight * 0.8, behavior: isReduced ? 'auto' : 'smooth' });
  };

  return (
    <div className="paper contents" data-face="contents">
      <h2 className="page-name">My friends</h2>
      <div className={`thumbs-window ${edges.top ? '' : 'more-above'} ${edges.bottom ? '' : 'more-below'}`}>
        <ul className="thumbs" ref={listRef} onScroll={measure}>
          {pages.map((page, i) => (
            <li key={page.id}>
              <button onClick={() => onOpenPage(i + 1)} tabIndex={isOpen ? 0 : -1} aria-label={`${page.name}${doneIds.has(page.id) ? ', finished' : ''}`}>
                <Drawing page={page} colors={book.colors[page.id]} />
                {doneIds.has(page.id) && <Sticker small />}
              </button>
            </li>
          ))}
        </ul>
        {!edges.top && (
          <button className="scroll-arrow up" onClick={() => scrollBy(-1)} tabIndex={isOpen ? 0 : -1} aria-label="See the friends above">
            <Chevron />
          </button>
        )}
        {!edges.bottom && (
          <button className="scroll-arrow down" onClick={() => scrollBy(1)} tabIndex={isOpen ? 0 : -1} aria-label="See more friends">
            <Chevron />
          </button>
        )}
      </div>
      <div className="grain" aria-hidden="true" />
      <PageCorners isOpen={isOpen} onNext={onNext} />
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M11 15l9 9 9-9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
