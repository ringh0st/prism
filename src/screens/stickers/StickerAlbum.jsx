import { useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Icon from '../../components/Icon.jsx';
import StickerBadge from '../../components/stickers/StickerBadge.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useLevels } from '../../state/LevelsContext.jsx';
import { STICKERS, earnedStickers, stickersForWorld } from '../../game/stickers.js';
import { totalStars } from '../../game/progress.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { worldName } from '../../i18n/gameText.js';
import styles from './StickerAlbum.module.css';

/**
 * The sticker album: six stickers for every world you've reached, earned by playing it well. Earned ones
 * carry a check; tap any sticker for its name and how to get it.
 */
export default function StickerAlbum() {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  const { worlds } = useLevels();
  const [selected, setSelected] = useState(null);
  const stars = totalStars(progress);
  const reached = worlds.filter((world) => stars >= world.starsToUnlock);
  const earned = earnedStickers(progress.levels).size;
  const total = worlds.length * STICKERS.length;

  const choose = (key) => {
    sfx.tap();
    setSelected(selected === key ? null : key);
  };

  return (
    <div className={styles.page}>
      <ScreenHeader title={t('stickers.title')} backHref="#/settings" />
      <main className={styles.main}>
        <div
          className={styles.meter}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={earned}
          aria-label={t('stickers.count', { earned, total })}
        >
          <span className={styles.fill} style={{ width: `${(earned / total) * 100}%` }} />
          <span className={`game-title ${styles.count}`} aria-hidden="true">
            {earned}/{total}
          </span>
        </div>
        {reached.map((world) => {
          const stickers = stickersForWorld(world.id, progress.levels);
          const shown = stickers.find((sticker) => selected === `${world.id}-${sticker.id}`);
          return (
            <section key={world.id} className={styles.page2} aria-labelledby={`stickers-${world.id}`}>
              <h2 id={`stickers-${world.id}`} className={`game-title ${styles.world}`}>
                <span>{lang === 'en' ? t('stickers.world', { n: world.id, name: world.name }) : worldName(lang, world)}</span>
                <span className={styles.worldCount}>
                  {stickers.filter((sticker) => sticker.isEarned).length}/{STICKERS.length}
                </span>
              </h2>
              <ul className={styles.stickers}>
                {stickers.map((sticker) => {
                  const key = `${world.id}-${sticker.id}`;
                  const name = t(`sticker.${sticker.id}`, {}, sticker.name);
                  const how = t(`sticker.${sticker.id}.how`, {}, sticker.how);
                  return (
                    <li key={sticker.id}>
                      <button
                        type="button"
                        className={`${styles.slot} ${selected === key ? styles.selected : ''}`}
                        onClick={() => choose(key)}
                        aria-pressed={selected === key}
                        aria-label={`${name}: ${sticker.isEarned ? t('stickers.earned') : `${how}${t('stickers.notEarned')}`}`}
                      >
                        <StickerBadge sticker={sticker} world={world.id} isEarned={sticker.isEarned} size={64} />
                        {sticker.isEarned && (
                          <span className={styles.check} aria-hidden="true">
                            <Icon name="check" size={14} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {shown && (
                <p className={styles.how} role="status">
                  <strong>{t(`sticker.${shown.id}`, {}, shown.name)}</strong> ·{' '}
                  {shown.isEarned ? t('stickers.earned') : t(`sticker.${shown.id}.how`, {}, shown.how)}
                </p>
              )}
            </section>
          );
        })}
      </main>
      <BottomNav active="settings" />
    </div>
  );
}
