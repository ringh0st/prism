import { useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import PalFormsStrip from '../../components/pals/PalFormsStrip.jsx';
import PalGrowthBar from '../../components/pals/PalGrowthBar.jsx';
import PalRecords from '../../components/pals/PalRecords.jsx';
import RarityBadge from '../../components/pals/RarityBadge.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PAL_GROWTH_LEVELS, PAL_STAGES, growthOf, palStage, stageOf } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import stageStyles from '../../components/pals/PalStage.module.css';
import styles from './PalDetail.module.css';
import { palName, palSpecies, stageName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** Levels still to solve (as partner) before a Pal reaches form `target`. */
const levelsUntil = (owned, target) => (target - stageOf(owned)) * PAL_GROWTH_LEVELS - growthOf(owned);

/**
 * One Pal up close: every form it has grown through, the next one as a sneak peek, and the rest as
 * mystery silhouettes. Tap a form to look at it.
 */
export default function PalDetailDialog({ pal, onClose }) {
  const { progress, choosePal } = usePlayer();
  const { t, lang } = useI18n();
  const name = palName(lang, pal);
  const formName = (index) => stageName(lang, palStage(index));
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
  if (!isFuture) caption = t(selected === current ? 'pals.detail.isNow' : 'pals.detail.was', { name, stage: formName(selected) });
  else if (!owned) caption = t('pals.detail.addToWatch', { name });
  else {
    const count = levelsUntil(owned, selected);
    caption = isMystery ? t('pals.detail.growIntoMystery', { count }) : t('pals.detail.growInto', { count, stage: formName(selected) });
  }

  return (
    <Dialog title={name} onClose={onClose}>
      <p className={styles.species}>
        {palSpecies(lang, pal)} <RarityBadge pal={pal} />
      </p>
      <div
        className={`${styles.stage} ${isMystery ? styles.future : `${stageStyles.backdrop} ${stageStyles[PAL_STAGES[selected].id]}`}`}
        key={selected}
      >
        <PalArt
          palId={pal.id}
          stage={selected}
          wearing={isPartner && !isFuture ? progress.pal.wearing : []}
          size={150}
          alive={!isMystery}
          className={isMystery ? styles.mystery : ''}
          label={isMystery ? t('pals.detail.mystery') : t('pals.detail.artLabel', { name, stage: formName(selected) })}
        />
      </div>
      <p className={styles.caption} role="status">
        {caption}
      </p>
      <PalFormsStrip palId={pal.id} current={current} revealedUpTo={revealedUpTo} selected={selected} onSelect={select} />
      {owned && isPartner && <PalGrowthBar pal={pal} owned={owned} />}
      {owned && !isPartner && (
        <div className={styles.actions}>
          <p className={styles.note}>{t('pals.detail.onlyPartner', { name })}</p>
          <Button
            onClick={() => {
              choosePal(pal.id);
              sfx.sparkle();
              onClose();
            }}
          >
            {t('pals.detail.makePartner', { name })}
          </Button>
        </div>
      )}
      {owned && <PalRecords palId={pal.id} />}
    </Dialog>
  );
}
