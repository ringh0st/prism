import { useEffect, useRef, useState } from 'react';
import PalArt from '../../components/pals/PalArt.jsx';
import StageBadge from '../../components/pals/StageBadge.jsx';
import PalGrowthBar from '../../components/pals/PalGrowthBar.jsx';
import PalPowerBadge from '../../components/pals/PalPowerBadge.jsx';
import { palPower } from '../../game/palPowers.js';
import PalDetailDialog from './PalDetailDialog.jsx';
import PalGuide from './PalGuide.jsx';
import GuideButton from '../../components/guide/GuideButton.jsx';
import { useFirstTimeGuide } from '../../hooks/useFirstTimeGuide.js';
import { readJson } from '../../lib/storage.js';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { palById, palStage, stageOf, unannouncedPals } from '../../game/pals.js';
import { SEEN_PALS_KEY } from './PalUnlockNotice.jsx';
import { nextTreat, treatsWaiting } from '../../game/treats.js';
import { useFeature } from '../../hooks/useFeature.js';
import { sfx } from '../../audio/sfx.js';
import styles from './PartnerSwitcher.module.css';
import { palName, treatName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** Remembers that the "How Pals work" card was seen, so it opens by itself only the first time. */
const SEEN_GUIDE_KEY = 'prism.seenPalGuide.v1';

/**
 * Your partner Pal, big on a little stage (tap it for a hop and a word; it twirls when its outfit
 * changes), how close it is to its next form (tap the silhouette for all forms), its power in levels and its treats.
 * A ? button opens "How Pals work" (PalGuide), which also opens by itself on the first visit.
 * Switching partner is in the Team tab (TeamSwitcher).
 */
export default function PartnerSwitcher() {
  const player = usePlayer();
  const { progress } = player;
  const { t, line, lang } = useI18n();
  const [isLooking, setIsLooking] = useState(false);
  // The first visit opens the guide, unless another notice (new Pals, a Lucky Pal) is up: then it waits for the next visit.
  const guide = useFirstTimeGuide(SEEN_GUIDE_KEY, !player.luckyGift && unannouncedPals(progress, readJson(SEEN_PALS_KEY, [])).length === 0);
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
  const hasTreats = useFeature('treats');
  const waiting = hasTreats ? treatsWaiting(progress) : 0;

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
          <PalGrowthBar pal={partner} owned={progress.pal.owned[partner.id]} onNext={() => setIsLooking(true)} />
        </div>
        <PalPowerBadge power={palPower(partner, stage.index)} withLine className={styles.power} />
        {waiting > 0 && (
          <button
            type="button"
            className={styles.feed}
            onClick={feed}
            aria-label={t('pals.partner.feedLabel', { name, treat: treatName(lang, nextTreat(progress)), n: waiting })}
          >
            <span aria-hidden="true" dir="ltr">
              {nextTreat(progress).emoji} ×{waiting}
            </span>
          </button>
        )}
      </div>
      <GuideButton label={t('palGuide.open')} onOpen={guide.open} className={styles.guide} />
      {isLooking && <PalDetailDialog pal={partner} onClose={() => setIsLooking(false)} />}
      {guide.isOpen && <PalGuide pal={partner} onClose={guide.close} />}
    </section>
  );
}
