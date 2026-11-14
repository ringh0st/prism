import styles from './PalCard.module.css';

/** A little leafy sprig for a card corner. */
const SPRIG = 'M2 22C6 14 12 9 22 6c-3 1-6 1-8-1 2 4 1 7-1 9 3-1 5 0 7 2-6-1-11 1-18 6z';
/** A golden corner with a gem, for Legend cards. */
const FILIGREE = 'M2 2h17a3 3 0 0 1 3 3v17h-2.4V5.4A1 1 0 0 0 18.6 4.4H2zM13 8l3 3-3 3-3-3z';

/**
 * The card's corner decor grows with the Pal: none for a Baby, leafy sprigs from Junior, and golden
 * corners for a Legend. Only the top corners, so the card's button stays clear.
 */
export default function PalCardOrnament({ stageId }) {
  if (stageId === 'baby') return null;
  const isLegend = stageId === 'legend';
  return ['topLeft', 'topRight'].map((corner) => (
    <svg key={corner} className={`${styles.ornament} ${styles[corner]}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={isLegend ? FILIGREE : SPRIG} />
    </svg>
  ));
}
