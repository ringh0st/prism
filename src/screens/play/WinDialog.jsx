import { useEffect, useMemo, useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Stars from '../../components/Stars.jsx';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { sfx } from '../../audio/sfx.js';
import { celebrate } from '../../lib/effects.js';
import { DIFFICULTY } from '../../game/constants.js';
import { shareText } from '../../lib/shareText.js';
import PalArt from '../../components/pals/PalArt.jsx';
import PalGrowthBar from '../../components/pals/PalGrowthBar.jsx';
import PalPowerBadge from '../../components/pals/PalPowerBadge.jsx';
import { palPower } from '../../game/palPowers.js';
import PresentNote from '../../components/gifts/PresentNote.jsx';
import WinGiftLadder from '../../components/gifts/WinGiftLadder.jsx';
import PalRecordNote from '../../components/pals/PalRecordNote.jsx';
import { palById, stageOf } from '../../game/pals.js';
import ReplayShare from '../../components/replay/ReplayShare.jsx';
import GlowbugRescue from './GlowbugRescue.jsx';
import StickerBadge from '../../components/stickers/StickerBadge.jsx';
import { withArticle } from '../../game/treats.js';
import { cheerFor } from '../../game/palCheers.js';
import LevelUp from './LevelUp.jsx';
import ChallengeShare from './ChallengeShare.jsx';
import TapIcon from './TapIcon.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './WinDialog.module.css';
import { palName } from '../../i18n/palText.js';
import { useCountUp } from '../../hooks/useCountUp.js';

/** The headline's translation key. */
function headlineFor({ stars, isSkipped, completesWorld, isFirstToday, milestone }, difficulty) {
  if (isSkipped) return 'win.skipped';
  if (isFirstToday) return 'win.dailyDone';
  if (milestone) return 'win.milestone';
  if (completesWorld) return 'win.worldComplete';
  if (stars === 3 && difficulty === DIFFICULTY.EXTRA) return 'win.legendary';
  if (difficulty === DIFFICULTY.EXTRA) return 'win.bossBeaten';
  if (difficulty === DIFFICULTY.HARD) return 'win.hardBeaten';
  if (stars === 3) return 'win.brilliant';
  if (stars === 2) return 'win.great';
  return 'win.solved';
}

const SHARE_FEEDBACK = { shared: 'share.shared', copied: 'share.copied', failed: 'share.failed' };

/** Share button for the daily result; says how it went. */
function ShareResult({ text }) {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState('');
  return (
    <div className={styles.share}>
      <Button variant="secondary" icon="share" onClick={async () => setFeedback(t(SHARE_FEEDBACK[await shareText(text)] ?? '', {}, ''))}>
        {t('share.result')}
      </Button>
      <p className={styles.shareFeedback} role="status">
        {feedback}
      </p>
    </div>
  );
}

/**
 * backName says where onMap goes: 'map', or 'event' for weekend-event puzzles.
 * replay: { level, history, title, subtitle } for the "Share replay" video (null to hide it).
 * challenge: { levelId, levelLabel, moves } for "Challenge a friend" (null to hide it).
 * cap: { stars, icon } when a helper (or Keep going) held the stars down, so the screen shows why.
 */
export default function WinDialog({
  result,
  par,
  difficulty,
  cap = null,
  showWinGifts = false,
  hotStreak = 0,
  hasNext,
  shareMessage = null,
  replay = null,
  challenge = null,
  backName = 'map',
  onNext,
  onReplay,
  onMap,
}) {
  const { isSignedIn, progress } = usePlayer();
  const { t, lang } = useI18n();
  const partner = palById(progress.pal.id);
  const {
    stars,
    moves,
    sparksEarned = 0,
    diamondsEarned = 0,
    isNewBest,
    streak = 0,
    shieldsUsed = 0,
    shieldEarned = false,
    isSkipped,
    completesWorld,
    milestone = null,
    palGrewTo = null,
    isFirstToday = false,
  } = result;
  const cheer = useMemo(() => cheerFor(result, hotStreak), [result, hotStreak]);
  // The rewards pour in once the stars have landed.
  const rewardsAt = 350 + stars * 260 + 150;
  const shownSparks = useCountUp(sparksEarned, { delay: rewardsAt, onTick: sfx.countTick });

  useEffect(() => {
    const timers = Array.from({ length: stars }, (_, i) => setTimeout(() => sfx.star(i), 350 + i * 260));
    const afterStars = 350 + stars * 260 + 150;
    if (sparksEarned > 0 || diamondsEarned > 0) timers.push(setTimeout(() => sfx.coin(), afterStars));
    // The big moments get their own sounds once the stars have landed.
    const finale = milestone ? sfx.milestone : completesWorld ? sfx.worldComplete : palGrewTo ? sfx.palGrow : isFirstToday ? sfx.reward : null;
    if (finale) timers.push(setTimeout(finale, afterStars + 450));
    if (completesWorld || milestone || palGrewTo) timers.push(setTimeout(() => celebrate({ stars: 3, isBig: true }), afterStars + 450));
    return () => timers.forEach(clearTimeout);
  }, [stars, sparksEarned, diamondsEarned, completesWorld, milestone, palGrewTo, isFirstToday]);

  return (
    <Dialog title={t(headlineFor(result, difficulty), { count: milestone })} tone="celebrate" onClose={onMap} closesOnBackdrop={false}>
      {milestone && (
        // A milestone on the whole road: a trophy with the number of levels solved.
        <p className={`game-title ${styles.milestone}`} aria-hidden="true">
          <Icon name="trophy" size={36} />
          <span dir="ltr">{milestone}</span>
        </p>
      )}
      <Stars count={stars} size={46} animate className={styles.stars} />
      {/* Moves used, and (short of ★★★) the moves that would earn it: numbers and pictures, words for screen readers. */}
      {isSkipped ? (
        <p className={styles.tip}>{t('win.comeBack')}</p>
      ) : (
        <p className={styles.summary}>
          <span className={`game-title ${styles.moves}`} role="img" aria-label={t('win.solvedIn', { count: moves })}>
            <TapIcon size={24} />
            <span dir="ltr">{moves}</span>
          </span>
          {cap && stars >= cap.stars ? (
            // A helper kept the stars down: its picture, then the most it allows.
            <span className={`game-title ${styles.tip}`} role="img" aria-label={t('win.capped', { count: cap.stars })}>
              <Icon name={cap.icon} size={20} />
              <span className={styles.capArrow} aria-hidden="true">
                →
              </span>
              <span className={styles.tipStars}>{'★'.repeat(cap.stars)}</span>
            </span>
          ) : (
            stars < 3 && (
              <span className={`game-title ${styles.tip}`} role="img" aria-label={t('win.starTip', { count: par })}>
                <span className={styles.tipStars}>★★★</span>
                <TapIcon size={18} />
                <span dir="ltr">{par}</span>
              </span>
            )
          )}
        </p>
      )}

      {isFirstToday && (
        <p className={`game-title ${styles.dailyReward}`} role="img" aria-label={t('win.dailyReward')}>
          <Icon name="gift" size={26} />
          <Icon name="check" size={20} strokeWidth={3.2} />
        </p>
      )}
      <div className={styles.rewards}>
        {sparksEarned > 0 && (
          <span className={styles.reward}>
            <Icon name="spark" size={18} />
            <span dir="ltr" aria-hidden="true">
              +{shownSparks}
            </span>
            <span className="visually-hidden">{t('win.sparks', { count: sparksEarned })}</span>
          </span>
        )}
        {diamondsEarned > 0 && (
          <span className={`${styles.reward} ${styles.diamond}`}>
            <Icon name="diamond" size={18} />
            <span dir="ltr" aria-hidden="true">
              +{diamondsEarned}
            </span>
            <span className="visually-hidden">{t('win.diamonds', { count: diamondsEarned })}</span>
          </span>
        )}
        {isNewBest && <span className={`${styles.reward} ${styles.best}`}>{t('win.newBest')}</span>}
        {hotStreak >= 2 && (
          <span className={`${styles.reward} ${styles.streak}`} role="img" aria-label={t('win.perfectRow', { count: hotStreak })}>
            <Icon name="flame" size={18} />
            <span dir="ltr">×{hotStreak}</span>
          </span>
        )}
        {streak > 0 && (
          <span className={`${styles.reward} ${styles.streak}`} role="img" aria-label={t('win.dayStreak', { count: streak })}>
            <Icon name="calendar" size={18} />
            <Icon name="flame" size={16} />
            <span dir="ltr">{streak}</span>
          </span>
        )}
        {shieldsUsed > 0 && (
          <span className={`${styles.reward} ${styles.shield}`} role="img" aria-label={t('win.shieldsUsed', { count: shieldsUsed })}>
            <Icon name="shield" size={18} />
            <span dir="ltr">−{shieldsUsed}</span>
          </span>
        )}
        {shieldEarned && (
          <span className={`${styles.reward} ${styles.shield}`} role="img" aria-label={t('win.shieldEarned')}>
            <Icon name="shield" size={18} />
            <span dir="ltr">+1</span>
          </span>
        )}
      </div>
      {/* One big Next right under the result, then Play again and the map as two equal buttons under it (the map
          softly tinted, so going back to the path is easy to see). Every button lines up to the same edges. */}
      <div className={styles.actions}>
        {hasNext ? (
          <Button size="lg" icon="play" onClick={onNext} data-autofocus>
            {t('win.next')}
          </Button>
        ) : (
          <Button size="lg" icon="map" onClick={onMap} data-autofocus>
            {t('play.backTo', { place: backName })}
          </Button>
        )}
        <div className={styles.actionRow}>
          <Button variant="secondary" icon="restart" onClick={onReplay}>
            {t('win.again')}
          </Button>
          {hasNext && (
            <Button variant="secondary" icon="map" onClick={onMap} className={styles.toMap} aria-label={t('play.backTo', { place: backName })}>
              {backName === t('place.map') ? t('nav.map') : backName}
            </Button>
          )}
        </div>
      </div>
      {/* The extras pop in one by one once the stars and sparks have landed, so the result reads first. */}
      <div className={styles.extras} style={{ '--extras-at': `${rewardsAt + 700}ms` }}>
        {partner && result.newRecords?.length > 0 && <PalRecordNote partner={partner} records={result.newRecords} />}
        {!isSkipped && showWinGifts && <WinGiftLadder />}
        {partner && !isSkipped && (
          <div className={`${styles.evolved} ${palGrewTo ? styles.grew : ''}`}>
            {/* Your partner cheers along: a happy bounce, and a big jump for the big moments. */}
            <span className={`${styles.cheerPal} ${cheer.isBig || palGrewTo ? styles.bigCheer : ''}`}>
              <PalArt palId={partner.id} stage={stageOf(progress.pal.owned[partner.id])} wearing={progress.pal.wearing} size={64} portrait alive />
            </span>
            <div className={styles.cheerText}>
              {palGrewTo ? (
                <>
                  <p role="status">
                    <strong>{t('win.grew', { name: palName(lang, partner), stage: t(`stage.${palGrewTo.id}`, {}, palGrewTo.name) })}</strong>
                  </p>
                  {/* Growing up makes its help stronger: show the power it has now. */}
                  <PalPowerBadge power={palPower(partner, stageOf(progress.pal.owned[partner.id]))} withLine />
                </>
              ) : (
                <>
                  <PalGrowthBar pal={partner} owned={progress.pal.owned[partner.id]} />
                  <PresentNote />
                </>
              )}
            </div>
          </div>
        )}
        {result.glowbug && !isSkipped && <GlowbugRescue glowbug={result.glowbug} />}
        {(result.levelUp || result.newTitle) && <LevelUp level={result.levelUp} title={result.newTitle} />}
        {(result.treat || result.newStickers?.length > 0) && (
          <div className={styles.finds}>
            {/* Finds as pictures: the treat and each new sticker, with a "+" (words for screen readers). */}
            {result.treat && partner && (
              <a
                href="#/pals"
                className={styles.find}
                aria-label={t('win.treat', { name: palName(lang, partner), treat: t(`treat.${result.treat.id}`, {}, withArticle(result.treat)) })}
              >
                <span className={styles.findPlus} aria-hidden="true">
                  +
                </span>
                <span className={styles.treat} aria-hidden="true">
                  {result.treat.emoji}
                </span>
              </a>
            )}
            {result.newStickers?.map(({ world, sticker }) => (
              <a
                key={sticker.id}
                href="#/stickers"
                className={styles.find}
                aria-label={t('win.sticker', { name: t(`sticker.${sticker.id}`, {}, sticker.name), world })}
              >
                <span className={styles.findPlus} aria-hidden="true">
                  +
                </span>
                <StickerBadge sticker={sticker} world={world} size={40} />
              </a>
            ))}
          </div>
        )}
        {(shareMessage || challenge || (replay && !isSkipped)) && (
          <div className={styles.shareRow}>
            {shareMessage && <ShareResult text={shareMessage} />}
            {challenge && <ChallengeShare {...challenge} label={t('win.challenge')} />}
            {replay && !isSkipped && <ReplayShare replay={{ ...replay, stars, moves }} />}
          </div>
        )}
        {completesWorld && !isSignedIn && (
          <a href="#/settings" className={styles.nudge} aria-label={`${t('win.worldDiamond')} ${t('common.signIn')}`}>
            <Icon name="diamond" size={18} />
            <span dir="ltr">+1</span>
            <Icon name="user" size={18} />
            <span>{t('win.signIn')}</span>
          </a>
        )}
      </div>
    </Dialog>
  );
}
