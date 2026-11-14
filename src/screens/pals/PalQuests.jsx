import { useRef, useState } from 'react';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { palById, stageOf } from '../../game/pals.js';
import { isQuestReady, questCount, questLogFor, questsForWeek, questWeekOf } from '../../game/quests.js';
import { rewardShower } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import styles from './PalQuests.module.css';
import { palName, questText } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { errorText } from '../../i18n/meText.js';

/** This week's three quests from your partner Pal, with progress and a button to collect each reward. */
export default function PalQuests() {
  const { progress, claimQuest } = usePlayer();
  const [message, setMessage] = useState('');
  const cardRef = useRef(null);
  const { t, lang } = useI18n();
  const partner = palById(progress.pal.id);
  if (!partner) return null;
  const name = palName(lang, partner);
  const week = questWeekOf();
  const log = questLogFor(progress, week);
  const quests = questsForWeek(week);
  const done = quests.filter((quest) => log.claimed.includes(quest.id)).length;

  const collect = async (quest) => {
    try {
      await claimQuest(quest.id);
      sfx.reward();
      rewardShower(cardRef.current);
      setMessage('');
    } catch (error) {
      setMessage(errorText(t, error.message));
    }
  };

  return (
    <section ref={cardRef} className={styles.card} aria-labelledby="quests-title">
      <div className={styles.head}>
        <PalArt palId={partner.id} stage={stageOf(progress.pal.owned[partner.id])} wearing={progress.pal.wearing} size={56} alive />
        <div>
          <h2 id="quests-title" className="game-title">
            {t('pals.quests.title', { name })}
          </h2>
          <p className={styles.sub}>
            {done === quests.length ? t('pals.quests.allDone') : t('pals.quests.progress', { done, total: quests.length })}
          </p>
        </div>
      </div>
      <ul className={styles.list}>
        {quests.map((quest) => {
          const count = Math.min(questCount(log, quest), quest.target);
          const isClaimed = log.claimed.includes(quest.id);
          const isReady = isQuestReady(log, quest);
          return (
            <li key={quest.id} className={`${styles.quest} ${isClaimed ? styles.claimed : ''} ${isReady ? styles.ready : ''}`}>
              <span className={styles.check} aria-hidden="true">
                <Icon name={isClaimed ? 'check' : quest.kind === 'perfect' ? 'star' : quest.kind === 'hard' ? 'flame' : 'play'} size={16} />
              </span>
              <div className={styles.body}>
                <p className={styles.text}>{questText(lang, quest, name)}</p>
                <div
                  className={styles.meter}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={quest.target}
                  aria-valuenow={count}
                  aria-label={t('common.stepOf', { n: count, total: quest.target })}
                >
                  <span style={{ width: `${(count / quest.target) * 100}%` }} />
                </div>
              </div>
              {isReady ? (
                <Button size="sm" variant="gold" onClick={() => collect(quest)} aria-label={t('pals.quests.collect', { n: quest.sparks })}>
                  <Icon name="spark" size={14} /> {quest.sparks}
                </Button>
              ) : (
                <span className={styles.reward}>
                  {isClaimed ? (
                    t('pals.quests.done')
                  ) : (
                    <>
                      {count}/{quest.target} · <Icon name="spark" size={12} /> {quest.sparks}
                    </>
                  )}
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
