import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PalCard from '../../components/pals/PalCard.jsx';
import PalDetailDialog from './PalDetailDialog.jsx';
import LuckyPalProgress from './LuckyPalProgress.jsx';
import TeamSwitcher from './TeamSwitcher.jsx';
import GlowbugGardenLink from './GlowbugGardenLink.jsx';
import { useFeature } from '../../hooks/useFeature.js';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, isPalUnlocked, palStage, stageOf } from '../../game/pals.js';
import { unlockText } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './Pals.module.css';
import { errorText } from '../../i18n/meText.js';

/** A locked Pal's goal as a picture and a number: ★ 90, a map and 2 worlds, a flame and a 7-day streak, or a gift. */
const UNLOCK_ICONS = { stars: 'star', worlds: 'map', streak: 'flame', lucky: 'gift' };
const unlockGoal = (unlock) => {
  const kind = Object.keys(UNLOCK_ICONS).find((key) => unlock[key]);
  return { icon: UNLOCK_ICONS[kind], n: kind === 'lucky' ? null : unlock[kind] };
};

/**
 * The lock line on a locked Pal card: a lock, a picture and a number (★ 90, a map and 2 worlds, a flame and a
 * 3-day streak, or a gift). Tapping it says the goal in words (a player asked what the lock and the flame meant).
 */
function LockHint({ unlock, label }) {
  const goal = unlockGoal(unlock);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <span className={styles.lockHint}>
      <button type="button" className={styles.lockGoal} aria-expanded={isOpen} aria-label={label} onClick={() => setIsOpen((open) => !open)}>
        <Icon name="lock" size={12} />
        <Icon name={goal.icon} size={16} />
        {goal.n !== null && <span className="game-title">{goal.n}</span>}
      </button>
      {isOpen && (
        <span className={styles.lockWords} role="status">
          {label}
        </span>
      )}
    </span>
  );
}

/** All Pals: yours and unlocked ones (pick one to play with; a new one joins as it's picked), and locked ones with how to get them. */
function Collection({ onError }) {
  const { progress, choosePal } = usePlayer();
  const [lookingAt, setLookingAt] = useState(null);
  const { t, lang } = useI18n();
  const pick = async (palId) => {
    try {
      await choosePal(palId);
      sfx.sparkle();
    } catch (error) {
      onError(errorText(t, error.message));
    }
  };

  return (
    <ul className={styles.collection}>
      {PALS.map((pal) => {
        const owned = progress.pal.owned[pal.id];
        const isPartner = progress.pal.id === pal.id;
        const isUnlocked = isPalUnlocked(progress, pal);
        const stage = palStage(stageOf(owned));
        return (
          <PalCard
            key={pal.id}
            pal={pal}
            stage={owned ? stage : null}
            isUnlocked={isUnlocked}
            isPartner={isPartner}
            wearing={isPartner ? progress.pal.wearing : []}
            onLook={isUnlocked ? () => setLookingAt(pal) : undefined}
          >
            {isUnlocked && !isPartner && (
              <button type="button" className={`${styles.pickButton} ${owned ? '' : styles.newPal}`} onClick={() => pick(pal.id)}>
                {t('pals.team.partnerUp')}
              </button>
            )}
            {!isUnlocked && <LockHint unlock={pal.unlock} label={unlockText(lang, pal.unlock)} />}
          </PalCard>
        );
      })}
      {lookingAt && <PalDetailDialog pal={lookingAt} onClose={() => setLookingAt(null)} />}
    </ul>
  );
}

/** The Pals tab's Collection: switch partner, the next Lucky Pal gift, and every Pal (pick one, see their forms). */
export default function PalTeam() {
  const [message, setMessage] = useState('');
  const hasGlowbugs = useFeature('glowbugs');
  const hasLuckyPal = useFeature('luckyPal');
  const { t } = useI18n();
  return (
    <>
      <TeamSwitcher />
      {hasGlowbugs && <GlowbugGardenLink />}
      {hasLuckyPal && <LuckyPalProgress />}
      <section className={styles.section} aria-label={t('pals.team.label')}>
        <Collection onError={setMessage} />
        {message && (
          <p className={styles.error} role="alert">
            {message}
          </p>
        )}
      </section>
    </>
  );
}
