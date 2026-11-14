import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useRushRun } from '../../hooks/useRushRun.js';
import { navigate } from '../../hooks/useHashRoute.js';
import { RUSH_LENGTH, RUSH_UNLOCK_WORLDS, rushRecordFor, rushWeekOf } from '../../game/rush.js';
import { finishedWorldCount } from '../../game/titles.js';
import RushMilestones from './RushMilestones.jsx';
import RushRules from './RushRules.jsx';
import RushBoard from './RushBoard.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './Rush.module.css';

/** Light Rush: this week's best on a road of gifts, the run, its rules as pictures, and the board. New puzzles every Monday. */
export default function RushScreen() {
  const { progress, recordRushRun } = usePlayer();
  const rush = useRushRun();
  const { t } = useI18n();
  const record = rushRecordFor(progress, rushWeekOf());
  const isUnlocked = finishedWorldCount(progress.levels) >= RUSH_UNLOCK_WORLDS;

  const startRun = async () => {
    // Starting over ends the run in progress: its puzzles still count toward this week's best.
    if (rush.run?.cleared > 0) await recordRushRun(rush.run.cleared);
    rush.start();
    navigate('#/rush/play');
  };

  return (
    <div className={styles.page}>
      <ScreenHeader title={t('rush.title')} />
      <main className={styles.main}>
        <section className={styles.hero} aria-label={t('rush.yourBest', { best: record.best, total: RUSH_LENGTH })}>
          <div className={styles.heroTop}>
            <span className={styles.heroIcon} aria-hidden="true">
              <Icon name="bolt" size={36} strokeWidth={2.4} />
            </span>
            <p className={styles.best} aria-hidden="true">
              <Icon name="trophy" size={22} />
              <strong className="game-title">{record.best}</strong>
              <span className={styles.of}>/{RUSH_LENGTH}</span>
            </p>
          </div>
          <RushMilestones record={record} />
        </section>

        {!isUnlocked ? (
          <section className={`${styles.card} ${styles.locked}`}>
            <span className={styles.lockIcon} aria-hidden="true">
              <Icon name="lock" size={28} />
            </span>
            <p className="game-title">{t('rush.locked', { n: RUSH_UNLOCK_WORLDS })}</p>
          </section>
        ) : (
          <section className={styles.card} aria-label={t('rush.playLabel')}>
            {rush.run ? (
              <>
                <p
                  className={styles.runStatus}
                  aria-label={t('rush.inProgress', { n: rush.run.cleared + 1, total: RUSH_LENGTH, spare: rush.run.spare })}
                >
                  <span className={styles.runChip} aria-hidden="true">
                    <span className="game-title">{rush.run.cleared + 1}</span>/{RUSH_LENGTH}
                  </span>
                  <span className={`${styles.runChip} ${styles.spareChip}`} aria-hidden="true">
                    <Icon name="bolt" size={18} />
                    <span className="game-title">{rush.run.spare}</span>
                  </span>
                </p>
                <Button size="lg" icon="play" onClick={() => navigate('#/rush/play')}>
                  {t('rush.continue')}
                </Button>
                <Button variant="ghost" icon="restart" onClick={startRun}>
                  {t('rush.newRun')}
                </Button>
              </>
            ) : (
              <Button size="lg" icon="bolt" onClick={startRun}>
                {t('rush.start')}
              </Button>
            )}
            <RushRules />
          </section>
        )}

        <RushBoard />
      </main>
      <BottomNav active="map" />
    </div>
  );
}
