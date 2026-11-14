import ClothesShelf from './ClothesShelf.jsx';
import { DecorItem } from './GroveShelf.jsx';
import { nextTheme, themeOfWeek } from '../../game/themes.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { themeText } from '../../i18n/shopText.js';
import styles from './Stall.module.css';

/**
 * This week's theme collection: outfit pieces and Grove decor that go together, some for sparks and the
 * showpieces for diamonds. Every collection comes back later in the year, so there's no rush.
 */
export default function ThemeShelf({ onTry }) {
  const { t, lang } = useI18n();
  const theme = themeOfWeek();
  const { name, tagline } = themeText(lang, theme);
  const outfits = theme.items.filter((item) => item.kind === 'outfit');
  const decor = theme.items.filter((item) => item.kind === 'decor');
  return (
    <>
      <div className={styles.themeBanner}>
        <span className={styles.themeIcon} aria-hidden="true">
          {theme.icon}
        </span>
        <div>
          <p className={styles.themeKicker}>{t('shop.theme.kicker')}</p>
          <h2 className={`game-title ${styles.themeName}`}>{name}</h2>
          <p className={styles.themeTagline}>{tagline}</p>
        </div>
      </div>
      <h3 className={`game-title ${styles.slotHeading}`}>{t('shop.theme.outfits')}</h3>
      <ClothesShelf items={outfits} onTry={onTry} intro={false} />
      <h3 className={`game-title ${styles.slotHeading}`}>{t('shop.theme.forGrove')}</h3>
      <ul className={styles.shelf}>
        {decor.map((item) => (
          <DecorItem key={item.id} item={item} onTry={onTry} />
        ))}
      </ul>
      <p className={styles.shelfIntro}>
        {t('shop.theme.next')} <strong>{themeText(lang, nextTheme()).name}</strong>. {t('shop.theme.comesBack')}
      </p>
    </>
  );
}
