import { useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import PalFormsStrip from '../../components/pals/PalFormsStrip.jsx';
import PalGrowthBar from '../../components/pals/PalGrowthBar.jsx';
import RarityBadge from '../../components/pals/RarityBadge.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PAL_GROWTH_LEVELS, PAL_STAGES, growthOf, palStage, stageOf } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './PalDetail.module.css';

/** Levels still to solve (as partner) before a Pal reaches form `target`. */
const levelsUntil = (owned, target) => (target - stageOf(owned)) * PAL_GROWTH_LEVELS - growthOf(owned);

/**
 * One Pal up close: every form it has grown through, the next one as a sneak peek, and the rest as
 * mystery silhouettes. Tap a form to look at it.
 */
export default function PalDetailDialog({ pal, onClose }) {
  const { progress, choosePal } = usePlayer();
  const owned = progress.pal.owned[pal.id];
  const current = owned ? stageOf(owned) : 0;
  const revealedUpTo = Math.min(PAL_STAGES.length - 1, current + 1);
  const [selected, setSelected] = useState(current);
  const isPartner = progress.pal.id === pal.id;
  const isMystery = selected > revealedUpTo;
  const isFuture = selected > current;

  const select = (index) => {
    setSelected(index);
    sfx.tap();
  };

  let caption;
  if (!isFuture) caption = selected === current ? `${pal.name} is a ${palStage(current).name} now.` : `${pal.name} was a ${palStage(selected).name}.`;
  else if (!owned) caption = `Add ${pal.name} to your team to watch it grow.`;
  else {
    const left = levelsUntil(owned, selected);
    const form = isMystery ? 'this mystery form' : `a ${palStage(selected).name}`;
    caption = `${left} more ${left === 1 ? 'level' : 'levels'} as your partner to grow into ${form}.`;
  }

  return (
    <Dialog title={pal.name} onClose={onClose}>
      <p className={styles.species}>
        {pal.species} <RarityBadge pal={pal} />
      </p>
      <div className={`${styles.stage} ${isFuture ? styles.future : ''}`} key={selected}>
        <PalArt
          palId={pal.id}
          stage={selected}
          wearing={isPartner && !isFuture ? progress.pal.wearing : []}
          size={150}
          className={isMystery ? styles.mystery : ''}
          label={isMystery ? 'A mystery form' : `${pal.name} as a ${palStage(selected).name}`}
        />
      </div>
      <p className={styles.caption} role="status">
        {caption}
      </p>
      <PalFormsStrip palId={pal.id} current={current} revealedUpTo={revealedUpTo} selected={selected} onSelect={select} />
      {owned && isPartner && <PalGrowthBar pal={pal} owned={owned} />}
      {owned && !isPartner && (
        <div className={styles.actions}>
          <p className={styles.note}>Only your partner grows. Play with {pal.name} to grow it!</p>
          <Button
            onClick={() => {
              choosePal(pal.id);
              sfx.sparkle();
              onClose();
            }}
          >
            Make {pal.name} my partner
          </Button>
        </div>
      )}
    </Dialog>
  );
}
