import ClothesShelf from './ClothesShelf.jsx';
import { DecorItem } from './GroveShelf.jsx';
import { nextTheme, themeOfWeek } from '../../game/themes.js';
import styles from './Stall.module.css';

/**
 * This week's theme collection: outfit pieces and Grove decor that go together, some for sparks and the
 * showpieces for diamonds. Every collection comes back later in the year, so there's no rush.
 */
export default function ThemeShelf({ onTry }) {
  const theme = themeOfWeek();
  const outfits = theme.items.filter((item) => item.kind === 'outfit');
  const decor = theme.items.filter((item) => item.kind === 'decor');
  return (
    <>
      <div className={styles.themeBanner}>
        <span className={styles.themeIcon} aria-hidden="true">
          {theme.icon}
        </span>
        <div>
          <p className={styles.themeKicker}>This week’s collection</p>
          <h2 className={`game-title ${styles.themeName}`}>{theme.name}</h2>
          <p className={styles.themeTagline}>{theme.tagline}</p>
        </div>
      </div>
      <h3 className={`game-title ${styles.slotHeading}`}>Outfits</h3>
      <ClothesShelf items={outfits} onTry={onTry} intro={false} />
      <h3 className={`game-title ${styles.slotHeading}`}>For your Grove</h3>
      <ul className={styles.shelf}>
        {decor.map((item) => (
          <DecorItem key={item.id} item={item} onTry={onTry} />
        ))}
      </ul>
      <p className={styles.shelfIntro}>
        Next week: <strong>{nextTheme().name}</strong>. Every collection comes back later in the year.
      </p>
    </>
  );
}
