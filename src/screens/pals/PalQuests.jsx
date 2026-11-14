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

/** This week's three quests from your partner Pal, with progress and a button to collect each reward. */
export default function PalQuests() {
  const { progress, claimQuest } = usePlayer();
  const [message, setMessage] = useState('');
  const cardRef = useRef(null);
  const partner = palById(progress.pal.id);
  if (!partner) return null;
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
      setMessage(error.message);
    }
  };

  return (
    <section ref={cardRef} className={styles.card} aria-labelledby="quests-title">
      <div className={styles.head}>
        <PalArt palId={partner.id} stage={stageOf(progress.pal.owned[partner.id])} wearing={progress.pal.wearing} size={56} alive />
        <div>
          <h2 id="quests-title" className="game-title">
            {partner.name}’s quests
          </h2>
          <p className={styles.sub}>
            {done === quests.length ? 'All done this week! New quests on Monday.' : `This week · ${done} of ${quests.length} done`}
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
                <p className={styles.text}>{quest.text(partner.name)}</p>
                <div
                  className={styles.meter}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={quest.target}
                  aria-valuenow={count}
                  aria-label={`${count} of ${quest.target}`}
                >
                  <span style={{ width: `${(count / quest.target) * 100}%` }} />
                </div>
              </div>
              {isReady ? (
                <Button size="sm" variant="gold" onClick={() => collect(quest)} aria-label={`Collect ${quest.sparks} sparks`}>
                  <Icon name="spark" size={14} /> {quest.sparks}
                </Button>
              ) : (
                <span className={styles.reward}>
                  {isClaimed ? (
                    'Done!'
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
