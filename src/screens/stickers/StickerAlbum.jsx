import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import StickerBadge from '../../components/stickers/StickerBadge.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useLevels } from '../../state/LevelsContext.jsx';
import { STICKERS, earnedStickers, stickersForWorld } from '../../game/stickers.js';
import { totalStars } from '../../game/progress.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { worldName } from '../../i18n/gameText.js';
import { splitAround } from '../../i18n/groveText.js';
import styles from './StickerAlbum.module.css';

/** The sticker album: six stickers for every world you've reached, earned by playing it well. */
export default function StickerAlbum() {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  const { worlds } = useLevels();
  const stars = totalStars(progress);
  const reached = worlds.filter((world) => stars >= world.starsToUnlock);
  const earned = earnedStickers(progress.levels).size;
  const [earnedBefore, earnedAfter] = splitAround(t('stickers.count', { earned: '\u0000', total: worlds.length * STICKERS.length }));

  return (
    <div className={styles.page}>
      <ScreenHeader title={t('stickers.title')} backHref="#/settings" />
      <main className={styles.main}>
        <p className={styles.count}>
          {earnedBefore}
          <strong className="game-title">{earned}</strong>
          {earnedAfter}
        </p>
        {reached.map((world) => (
          <section key={world.id} className={styles.page2} aria-labelledby={`stickers-${world.id}`}>
            <h2 id={`stickers-${world.id}`} className={`game-title ${styles.world}`}>
              {lang === 'en' ? t('stickers.world', { n: world.id, name: world.name }) : worldName(lang, world)}
            </h2>
            <ul className={styles.stickers}>
              {stickersForWorld(world.id, progress.levels).map((sticker) => (
                <li key={sticker.id} className={styles.slot}>
                  <StickerBadge sticker={sticker} world={world.id} isEarned={sticker.isEarned} size={64} />
                  <span className={styles.name}>{t(`sticker.${sticker.id}`, {}, sticker.name)}</span>
                  <span className={styles.how}>
                    {sticker.isEarned ? t('stickers.earned') : t(`sticker.${sticker.id}.how`, {}, sticker.how)}
                    <span className="visually-hidden">{sticker.isEarned ? '' : t('stickers.notEarned')}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <BottomNav active="settings" />
    </div>
  );
}
