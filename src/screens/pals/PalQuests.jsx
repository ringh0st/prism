import { useState } from 'react';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import HelpTip from '../../components/game/HelpTip.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { palById, stageOf } from '../../game/pals.js';
import { isQuestReady, questCount, questLogFor, questsForWeek, questWeekOf } from '../../game/quests.js';
import { flyRewardsToCounter } from '../../lib/rewardFlight.js';
import styles from './PalQuests.module.css';
import { palName, questText } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { errorText } from '../../i18n/meText.js';

/** Each quest kind's picture, with one short word under it (the full goal is for screen readers). */
const KIND_ICONS = { solved: 'play', perfect: 'star', hard: 'flame' };

/**
 * This week's three quests from your partner Pal, as pictures: the kind (with ×target), a bar, and the
 * sparks it pays (a gold button once it's ready). Three dots up top show how many are done.
 */
export default function PalQuests() {
  const { progress, claimQuest } = usePlayer();
  const [message, setMessage] = useState('');
  const { t, lang } = useI18n();
  const partner = palById(progress.pal.id);
  if (!partner) return null;
  const name = palName(lang, partner);
  const week = questWeekOf();
  const log = questLogFor(progress, week);
  const quests = questsForWeek(week);
  const done = quests.filter((quest) => log.claimed.includes(quest.id)).length;

  // Like the daily missions: the sparks fly from the button straight into the counter at the top.
  const collect = async (quest, button) => {
    const box = button.getBoundingClientRect();
    try {
      await claimQuest(quest.id);
      flyRewardsToCounter('spark', quest.sparks, { x: box.left + box.width / 2, y: box.top + box.height / 2 });
      setMessage('');
    } catch (error) {
      setMessage(errorText(t, error.message));
    }
  };

  return (
    <section className={styles.card} aria-labelledby="quests-title">
      <div className={styles.head}>
        <PalArt palId={partner.id} stage={stageOf(progress.pal.owned[partner.id])} wearing={progress.pal.wearing} size={56} alive />
        <div className={styles.headText}>
          <h2 id="quests-title" className="game-title">
            {t('pals.quests.title', { name })}
          </h2>
          <p className={styles.dots}>
            {quests.map((quest) => (
              <span key={quest.id} className={log.claimed.includes(quest.id) ? styles.dotDone : styles.dot} aria-hidden="true">
                {log.claimed.includes(quest.id) && <Icon name="check" size={12} strokeWidth={3} />}
              </span>
            ))}
            <span className="visually-hidden">
              {done === quests.length ? t('pals.quests.allDone') : t('pals.quests.progress', { done, total: quests.length })}
            </span>
          </p>
        </div>
        <HelpTip title={t('pals.quests.title', { name })}>
          <p>{t('pals.quests.how')}</p>
        </HelpTip>
      </div>
      <ul className={styles.list}>
        {quests.map((quest) => {
          const count = Math.min(questCount(log, quest), quest.target);
          const isClaimed = log.claimed.includes(quest.id);
          const isReady = isQuestReady(log, quest);
          return (
            <li key={quest.id} className={`${styles.quest} ${isClaimed ? styles.claimed : ''} ${isReady ? styles.ready : ''}`}>
              <span className={`${styles.kind} ${styles[quest.kind]}`} aria-hidden="true">
                <span className={styles.kindIcon}>
                  <Icon name={isClaimed ? 'check' : KIND_ICONS[quest.kind]} size={20} strokeWidth={2.4} />
                  <span className={`game-title ${styles.times}`}>×{quest.target}</span>
                </span>
                <span className={styles.kindWord}>{t(`pals.quests.kind.${quest.kind}`)}</span>
              </span>
              <div className={styles.body}>
                <p className="visually-hidden">{questText(lang, quest, name)}</p>
                <div
                  className={styles.meter}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={quest.target}
                  aria-valuenow={count}
                  aria-label={t('common.stepOf', { n: count, total: quest.target })}
                >
                  <span className={styles.fill} style={{ width: `${(count / quest.target) * 100}%` }} />
                  <span className={styles.count} aria-hidden="true">
                    {count}/{quest.target}
                  </span>
                </div>
              </div>
              {isReady ? (
                <Button
                  size="sm"
                  variant="gold"
                  onClick={(event) => collect(quest, event.currentTarget)}
                  aria-label={t('pals.quests.collect', { n: quest.sparks })}
                >
                  <Icon name="spark" size={14} /> {quest.sparks}
                </Button>
              ) : (
                <span className={`${styles.reward} ${isClaimed ? styles.paid : ''}`}>
                  {isClaimed ? <Icon name="check" size={18} strokeWidth={3} label={t('pals.quests.done')} /> : <Icon name="spark" size={14} />}
                  {!isClaimed && quest.sparks}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {message && (
        <p className={styles.error} role="alert">
          {message}
        </p>
      )}
    </section>
  );
}
