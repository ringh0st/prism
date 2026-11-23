import Drawing from './Drawing.jsx';
import Sticker from './Sticker.jsx';
import { PageCorners } from './PageFace.jsx';

/** The first page: every friend in the book as a little picture in its colors so far; a tap goes to its page. */
export default function Contents({ pages, book, doneIds, isOpen, onOpenPage, onNext }) {
  const finished = pages.filter((p) => doneIds.has(p.id)).length;
  return (
    <div className="paper contents" data-face="contents">
      <h2 className="page-name">My friends</h2>
      <p className="tally" aria-label={`${finished} of ${pages.length} pages finished`}>
        <Sticker small /> {finished} / {pages.length}
      </p>
      <ul className="thumbs">
        {pages.map((page, i) => (
          <li key={page.id}>
            <button onClick={() => onOpenPage(i + 1)} tabIndex={isOpen ? 0 : -1} aria-label={`${page.name}${doneIds.has(page.id) ? ', finished' : ''}`}>
              <Drawing page={page} colors={book.colors[page.id]} />
              {doneIds.has(page.id) && <Sticker small />}
            </button>
          </li>
        ))}
      </ul>
      <div className="grain" aria-hidden="true" />
      <PageCorners isOpen={isOpen} onNext={onNext} />
    </div>
  );
}
