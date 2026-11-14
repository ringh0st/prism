import { useState } from 'react';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { palById, stageOf } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './PalBuddy.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

/**
 * Your partner Pal, in its outfit, watching you play from the corner of the level header. It reacts to what happens:
 * a hop for each gem, a spin for a combo, a shake at a shadow crystal, a shiver on the last move, a dance
 * when you solve and a droop when moves run out. Tap it for a hop.
 * @param reaction { name: hop | spin | shake | shiver | dance | droop, key }
 */
export default function PalBuddy({ reaction }) {
  const { t } = useI18n();
  const { progress } = usePlayer();
  const [poke, setPoke] = useState(null);
  const pal = palById(progress.pal.id);
  if (!pal) return null;
  const shown = poke && (!reaction || poke.key > reaction.key) ? poke : reaction;
  return (
    <button
      data-scenery
      type="button"
      className={styles.buddy}
      onClick={() => {
        sfx.hello();
        setPoke({ name: 'hop', key: Date.now() });
      }}
      aria-label={t('buddy.cheering', { name: pal.name })}
    >
      <span key={shown?.key ?? 'idle'} className={`${styles.body} ${shown ? styles[shown.name] : ''}`}>
        <PalArt palId={pal.id} stage={stageOf(progress.pal.owned[pal.id])} wearing={progress.pal.wearing} size="100%" alive />
      </span>
    </button>
  );
}
