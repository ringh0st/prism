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
import { palById, stageOf } from '../../game/pals.js';
import ReplayShare from '../../components/replay/ReplayShare.jsx';
import GlowbugRescue from './GlowbugRescue.jsx';
import StickerBadge from '../../components/stickers/StickerBadge.jsx';
import { withArticle } from '../../game/treats.js';
import { cheerFor } from '../../game/palCheers.js';
import LevelUp from './LevelUp.jsx';
import ChallengeShare from './ChallengeShare.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './WinDialog.module.css';
import { palName } from '../../i18n/palText.js';

/** The headline's translation key. */
function headlineFor({ stars, isSkipped, completesWorld, isFirstToday }, difficulty) {
  if (isSkipped) return 'win.skipped';
  if (isFirstToday) return 'win.dailyDone';
  if (completesWorld) return 'win.worldComplete';
  if (stars === 3 && difficulty === DIFFICULTY.EXTRA) return 'win.legendary';
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
 */
export default function WinDialog({
  result,
  par,
  difficulty,
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
    palGrewTo = null,
    isFirstToday = false,
  } = result;
  const cheer = useMemo(() => cheerFor(result, hotStreak), [result, hotStreak]);

  useEffect(() => {
    const timers = Array.from({ length: stars }, (_, i) => setTimeout(() => sfx.star(i), 350 + i * 260));
    const afterStars = 350 + stars * 260 + 150;
    if (sparksEarned > 0 || diamondsEarned > 0) timers.push(setTimeout(() => sfx.coin(), afterStars));
    // The big moments get their own sounds once the stars have landed.
    const finale = completesWorld ? sfx.worldComplete : palGrewTo ? sfx.palGrow : isFirstToday ? sfx.reward : null;
    if (finale) timers.push(setTimeout(finale, afterStars + 450));
    if (completesWorld || palGrewTo) timers.push(setTimeout(() => celebrate({ stars: 3, isBig: true }), afterStars + 450));
    return () => timers.forEach(clearTimeout);
  }, [stars, sparksEarned, diamondsEarned, completesWorld, palGrewTo, isFirstToday]);

  return (
    <Dialog title={t(headlineFor(result, difficulty))} tone="celebrate" onClose={onMap} closesOnBackdrop={false}>
      <Stars count={stars} size={46} animate className={styles.stars} />
      {isSkipped ? <p className={styles.summary}>{t('win.comeBack')}</p> : <p className={styles.summary}>{t('win.solvedIn', { count: moves })}</p>}
      {!isSkipped && stars < 3 && <p className={styles.tip}>{t('win.starTip', { count: par })}</p>}

      {isFirstToday && (
        <p className={`game-title ${styles.dailyReward}`}>
          <Icon name="gift" size={22} /> {t('win.dailyReward')}
        </p>
      )}
      <div className={styles.rewards}>
        {sparksEarned > 0 && (
          <span className={styles.reward}>
            <Icon name="spark" size={18} /> {t('win.sparks', { count: sparksEarned })}
          </span>
        )}
        {diamondsEarned > 0 && (
          <span className={`${styles.reward} ${styles.diamond}`}>
            <Icon name="diamond" size={18} /> {t('win.diamonds', { count: diamondsEarned })}
          </span>
        )}
        {isNewBest && <span className={`${styles.reward} ${styles.best}`}>{t('win.newBest')}</span>}
        {hotStreak >= 2 && (
          <span className={`${styles.reward} ${styles.streak}`}>
            <Icon name="flame" size={18} /> {t('win.perfectRow', { count: hotStreak })}
          </span>
        )}
        {streak > 0 && (
          <span className={`${styles.reward} ${styles.streak}`}>
            <Icon name="flame" size={18} /> {t('win.dayStreak', { count: streak })}
          </span>
        )}
        {shieldsUsed > 0 && (
          <span className={`${styles.reward} ${styles.shield}`}>
            <Icon name="shield" size={18} /> {t('win.shieldsUsed', { count: shieldsUsed })}
          </span>
        )}
        {shieldEarned && (
          <span className={`${styles.reward} ${styles.shield}`}>
            <Icon name="shield" size={18} /> {t('win.shieldEarned')}
          </span>
        )}
      </div>
      {/* Next comes right under the result, so carrying on is always one tap away; extras follow below. */}
      <div className={styles.actions}>
        {hasNext ? (
          <Button size="lg" icon="play" onClick={onNext} data-autofocus>
            {t('win.next')}
          </Button>
        ) : (
          <Button size="lg" onClick={onMap} data-autofocus>
            {t('play.backTo', { place: backName })}
          </Button>
        )}
        <div className={styles.secondary}>
          <Button variant="secondary" icon="restart" onClick={onReplay}>
            {t('win.playAgain')}
          </Button>
          {hasNext && (
            <Button variant="secondary" onClick={onMap}>
              {backName}
            </Button>
          )}
        </div>
      </div>
      {partner && !isSkipped && (
        <div className={`${styles.evolved} ${palGrewTo ? styles.grew : ''}`}>
          {/* Your partner cheers along: a happy bounce, and a big jump for the big moments. */}
          <span className={`${styles.cheerPal} ${cheer.isBig || palGrewTo ? styles.bigCheer : ''}`}>
            <PalArt palId={partner.id} stage={stageOf(progress.pal.owned[partner.id])} wearing={progress.pal.wearing} size={64} portrait alive />
          </span>
          <div className={styles.cheerText}>
            {palGrewTo ? (
              <p role="status">
                <strong>{t('win.grew', { name: palName(lang, partner), stage: t(`stage.${palGrewTo.id}`, {}, palGrewTo.name) })}</strong>
              </p>
            ) : (
              <>
                <p className={styles.cheerLine}>
                  {t('win.cheer', { name: palName(lang, partner), line: lang === 'en' ? cheer.line : t('win.cheerLine') })}
                </p>
                <PalGrowthBar pal={partner} owned={progress.pal.owned[partner.id]} showLine={false} />
              </>
            )}
          </div>
        </div>
      )}
      {result.glowbug && !isSkipped && <GlowbugRescue glowbug={result.glowbug} />}
      {(result.levelUp || result.newTitle) && <LevelUp level={result.levelUp} title={result.newTitle} />}
      {(result.treat || result.newStickers?.length > 0) && (
        <div className={styles.finds}>
          {result.treat && partner && (
            <span className={styles.find}>
              <span aria-hidden="true">{result.treat.emoji}</span>{' '}
              {t('win.treat', { name: palName(lang, partner), treat: t(`treat.${result.treat.id}`, {}, withArticle(result.treat)) })}
            </span>
          )}
          {result.newStickers?.map(({ world, sticker }) => (
            <a key={sticker.id} href="#/stickers" className={styles.find}>
              <StickerBadge sticker={sticker} world={world} size={30} />{' '}
              {t('win.sticker', { name: t(`sticker.${sticker.id}`, {}, sticker.name), world })}
            </a>
          ))}
        </div>
      )}
      {shareMessage && <ShareResult text={shareMessage} />}
      {challenge && <ChallengeShare {...challenge} />}
      {replay && !isSkipped && <ReplayShare replay={{ ...replay, stars, moves }} />}
      {completesWorld && !isSignedIn && (
        <p className={styles.nudge}>
          <Icon name="diamond" size={16} /> {t('win.worldDiamond')} <a href="#/settings">{t('common.signIn')}</a>
        </p>
      )}
    </Dialog>
  );
}
