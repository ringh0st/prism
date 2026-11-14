import { useEffect, useRef, useState } from 'react';
import PalArt from '../../components/pals/PalArt.jsx';
import StageBadge from '../../components/pals/StageBadge.jsx';
import PalGrowthBar from '../../components/pals/PalGrowthBar.jsx';
import PalDetailDialog from './PalDetailDialog.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { palById, palStage, stageOf } from '../../game/pals.js';
import { nextTreat, treatsWaiting } from '../../game/treats.js';
import { sfx } from '../../audio/sfx.js';
import styles from './PartnerSwitcher.module.css';
import { palName, treatName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/**
 * Your partner Pal, big on a little stage (tap it for a hop and a word; it twirls when its outfit
 * changes), and how close it is to its next form. Switching partner is in the Team tab (TeamSwitcher).
 */
export default function PartnerSwitcher() {
  const player = usePlayer();
  const { progress } = player;
  const { t, line, lang } = useI18n();
  const [isLooking, setIsLooking] = useState(false);
  const [moment, setMoment] = useState(null);
  const partner = palById(progress.pal.id);
  const outfit = progress.pal.wearing.join(',');
  const lastOutfit = useRef(outfit);

  // A new outfit: a little twirl to show it off.
  useEffect(() => {
    if (lastOutfit.current === outfit) return;
    lastOutfit.current = outfit;
    setMoment({ kind: 'twirl', line: line('pals.partner.outfitLines'), key: Date.now() });
  }, [outfit, line]);

  useEffect(() => {
    if (!moment) return undefined;
    const timer = setTimeout(() => setMoment(null), 2200);
    return () => clearTimeout(timer);
  }, [moment]);

  if (!partner) return null;
  const stage = palStage(stageOf(progress.pal.owned[partner.id]));
  const name = palName(lang, partner);

  const feed = () => {
    const fed = player.feedTreat();
    if (!fed) return;
    sfx.reward();
    setMoment({
      kind: fed.trick,
      line: t('pals.partner.yum', { treat: treatName(lang, fed.treat), trick: t(`pals.trick.${fed.trick}`) }),
      treat: fed.treat.emoji,
      key: Date.now(),
    });
  };
  const waiting = treatsWaiting(progress);

  const pet = () => {
    sfx.hello();
    setMoment({ kind: 'hop', line: line('pals.partner.petLines'), key: Date.now() });
  };

  return (
    <section className={styles.hero} aria-labelledby="partner-title">
      <div className={styles.stage}>
        <button type="button" className={styles.pal} onClick={pet} aria-label={t('pals.partner.pet', { name })}>
          <span key={moment?.key ?? 'still'} className={`${styles.body} ${moment ? styles[moment.kind] : ''}`}>
            <PalArt palId={partner.id} stage={stage.index} wearing={progress.pal.wearing} size="100%" alive />
          </span>
        </button>
        {moment?.treat && (
          <span key={`treat-${moment.key}`} className={styles.treat} aria-hidden="true">
            {moment.treat}
          </span>
        )}
        {moment?.kind === 'hearts' && (
          <span key={`hearts-${moment.key}`} className={styles.hearts} aria-hidden="true">
            <span>♥</span>
            <span>♥</span>
            <span>♥</span>
          </span>
        )}
        {moment && (
          <span key={moment.key} className={styles.bubble} role="status">
            {moment.line}
          </span>
        )}
      </div>

      <div className={styles.info}>
        <h2 id="partner-title" className={`game-title ${styles.name}`}>
          {name} <StageBadge stage={stage} className={styles.stageChip} />
        </h2>
        <div className={styles.growth}>
          <PalGrowthBar pal={partner} owned={progress.pal.owned[partner.id]} showLine={false} />
        </div>
        <div className={styles.buttons}>
          {waiting > 0 && (
            <button
              type="button"
              className={styles.feed}
              onClick={feed}
              aria-label={t('pals.partner.feedLabel', { name, treat: treatName(lang, nextTreat(progress)), n: waiting })}
            >
              <span aria-hidden="true">{nextTreat(progress).emoji}</span> {t('pals.partner.feed', { n: waiting })}
            </button>
          )}
          <button type="button" className={styles.forms} onClick={() => setIsLooking(true)}>
            {t('pals.partner.forms')}
          </button>
        </div>
      </div>
      {isLooking && <PalDetailDialog pal={partner} onClose={() => setIsLooking(false)} />}
    </section>
  );
}
