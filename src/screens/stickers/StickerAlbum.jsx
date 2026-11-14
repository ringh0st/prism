import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import StickerBadge from '../../components/stickers/StickerBadge.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useLevels } from '../../state/LevelsContext.jsx';
import { STICKERS, earnedStickers, stickersForWorld } from '../../game/stickers.js';
import { totalStars } from '../../game/progress.js';
import styles from './StickerAlbum.module.css';

/** The sticker album: six stickers for every world you've reached, earned by playing it well. */
export default function StickerAlbum() {
  const { progress } = usePlayer();
  const { worlds } = useLevels();
  const stars = totalStars(progress);
  const reached = worlds.filter((world) => stars >= world.starsToUnlock);
  const earned = earnedStickers(progress.levels).size;

  return (
    <div className={styles.page}>
      <ScreenHeader title="Sticker album" backHref="#/settings" />
      <main className={styles.main}>
        <p className={styles.count}>
          <strong className="game-title">{earned}</strong> of {worlds.length * STICKERS.length} stickers
        </p>
        {reached.map((world) => (
          <section key={world.id} className={styles.page2} aria-labelledby={`stickers-${world.id}`}>
            <h2 id={`stickers-${world.id}`} className={`game-title ${styles.world}`}>
              World {world.id}: {world.name}
            </h2>
            <ul className={styles.stickers}>
              {stickersForWorld(world.id, progress.levels).map((sticker) => (
                <li key={sticker.id} className={styles.slot}>
                  <StickerBadge sticker={sticker} world={world.id} isEarned={sticker.isEarned} size={64} />
                  <span className={styles.name}>{sticker.name}</span>
                  <span className={styles.how}>
                    {sticker.isEarned ? 'Earned!' : sticker.how}
                    <span className="visually-hidden">{sticker.isEarned ? '' : ' (not earned yet)'}</span>
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
