import { useState } from 'react';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import HelpTip from '../../components/game/HelpTip.jsx';
import GiftReveal from '../../components/gifts/GiftReveal.jsx';
import MissionKindIcon from './MissionKindIcon.jsx';
import MissionRing from './MissionRing.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { todayKey } from '../../game/daily.js';
import { MISSIONS_BONUS_SPARKS, isMissionReady, missionCount, missionLogFor, todaysMissions } from '../../game/dailyMissions.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './DailyMissions.module.css';

/**
 * Today's three daily missions, as pictures: each a ring filling up around its kind's picture, the count, and the
 * sparks it pays (a gold button once it's done, opened like every gift). The gift up top is the bonus for all three.
 */
export default function DailyMissions() {
  const { progress, isSignedIn, claimDailyMission } = usePlayer();
  const { t } = useI18n();
  const [opening, setOpening] = useState(null);
  const log = missionLogFor(progress, todayKey(), isSignedIn);
  const missions = todaysMissions(log);
  if (missions.length === 0) return null;
  const done = log.claimed.length;
  const isAllDone = done === missions.length;

  return (
    <section className={styles.card} aria-labelledby="missions-title">
      <div className={styles.head}>
        <h2 id="missions-title" className={`game-title ${styles.title}`}>
          <Icon name="calendar" size={22} />
          {t('pals.today.title')}
        </h2>
        <span className="visually-hidden">{isAllDone ? t('pals.today.allDone') : t('pals.today.progress', { done, total: missions.length })}</span>
        <span
          className={`${styles.bonus} ${isAllDone ? styles.bonusDone : ''}`}
          role="img"
          aria-label={isAllDone ? t('pals.today.allDone') : t('pals.today.bonus', { n: MISSIONS_BONUS_SPARKS })}
        >
          <Icon name={isAllDone ? 'check' : 'gift'} size={18} strokeWidth={isAllDone ? 3 : 2.2} />
          <span className={styles.bonusDots} aria-hidden="true">
            {missions.map((mission) => (
              <span key={mission.id} className={log.claimed.includes(mission.id) ? styles.dotDone : styles.dot} />
            ))}
          </span>
          {!isAllDone && (
            <span className="game-title" dir="ltr">
              +{MISSIONS_BONUS_SPARKS}
            </span>
          )}
          {!isAllDone && <Icon name="spark" size={12} />}
        </span>
        <HelpTip title={t('pals.today.title')}>
          <p>{t('pals.today.how', { n: MISSIONS_BONUS_SPARKS })}</p>
        </HelpTip>
      </div>
      <ul className={styles.list}>
        {missions.map((mission) => {
          const count = Math.min(missionCount(progress, log, mission), mission.target);
          const isClaimed = log.claimed.includes(mission.id);
          const isReady = isMissionReady(progress, log, mission);
          const goal = t(`pals.today.goal.${mission.kind}`, { count: mission.target });
          return (
            <li key={mission.id} className={`${styles.mission} ${isReady ? styles.ready : ''} ${isClaimed ? styles.claimed : ''}`}>
              <p className="visually-hidden">{goal}</p>
              <MissionRing count={count} target={mission.target} label={t('common.stepOf', { n: count, total: mission.target })}>
                {isClaimed ? <Icon name="check" size={24} strokeWidth={3} /> : <MissionKindIcon kind={mission.kind} />}
              </MissionRing>
              <span className={`game-title ${styles.count}`} dir="ltr" aria-hidden="true">
                {count}/{mission.target}
              </span>
              {isReady ? (
                <Button size="sm" variant="gold" onClick={() => setOpening(mission)} aria-label={t('pals.today.collect', { n: mission.sparks })}>
                  <Icon name="spark" size={14} /> {mission.sparks}
                </Button>
              ) : (
                <span className={`${styles.reward} ${isClaimed ? styles.paid : ''}`}>
                  {isClaimed ? <Icon name="check" size={16} strokeWidth={3} label={t('pals.today.done')} /> : <Icon name="spark" size={14} />}
                  {!isClaimed && <span dir="ltr">{mission.sparks}</span>}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {opening && (
        <GiftReveal
          title={t('pals.today.giftTitle')}
          doneTitle={t('ui.gift.title')}
          wrapping={{ kind: 'box', tone: 'mint' }}
          open={() => claimDailyMission(opening.id)}
          onClose={() => setOpening(null)}
        />
      )}
    </section>
  );
}
