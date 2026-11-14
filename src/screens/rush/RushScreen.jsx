import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useRushRun } from '../../hooks/useRushRun.js';
import { navigate } from '../../hooks/useHashRoute.js';
import { RUSH_BONUS_EVERY, RUSH_BONUS_SPARE, RUSH_LENGTH, RUSH_START_SPARE, RUSH_UNLOCK_WORLDS, rushRecordFor, rushWeekOf } from '../../game/rush.js';
import { finishedWorldCount } from '../../game/titles.js';
import RushMilestones from './RushMilestones.jsx';
import RushBoard from './RushBoard.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { withParts } from '../../i18n/extrasText.js';
import styles from './Rush.module.css';

const RULES = [
  { icon: 'map', key: 'rush.rule.length', params: { total: RUSH_LENGTH } },
  { icon: 'bolt', key: 'rush.rule.spare', params: { spare: RUSH_START_SPARE } },
  { icon: 'gift', key: 'rush.rule.bonus', params: { bonus: RUSH_BONUS_SPARE, every: RUSH_BONUS_EVERY } },
  { icon: 'lock', key: 'rush.rule.noHelpers', params: {} },
];

/** Light Rush: this week's run, the rules, milestone rewards and the board. New puzzles every Monday. */
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
        <section className={styles.hero} aria-labelledby="rush-title">
          <span className={styles.heroIcon} aria-hidden="true">
            <Icon name="bolt" size={40} strokeWidth={2.4} />
          </span>
          <div>
            <p className={styles.kicker}>{t('rush.thisWeek')}</p>
            <h2 id="rush-title" className={`game-title ${styles.heroTitle}`}>
              {t('rush.heroTitle')}
            </h2>
            <p className={styles.best}>
              {withParts(t('rush.yourBest', { total: RUSH_LENGTH }), { best: <strong className="game-title">{record.best}</strong> })}
            </p>
          </div>
        </section>

        {!isUnlocked ? (
          <section className={styles.card}>
            <LumiSays mood="happy" size={72} line={t('rush.locked', { n: RUSH_UNLOCK_WORLDS })} />
          </section>
        ) : (
          <section className={styles.card} aria-label={t('rush.playLabel')}>
            {rush.run ? (
              <>
                <p className={styles.runStatus}>
                  {withParts(t('rush.inProgress', { total: RUSH_LENGTH }), {
                    n: <strong>{rush.run.cleared + 1}</strong>,
                    spare: <strong>{rush.run.spare}</strong>,
                  })}
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
            <ul className={styles.rules}>
              {RULES.map((rule) => (
                <li key={rule.icon}>
                  <span className={styles.ruleIcon} aria-hidden="true">
                    <Icon name={rule.icon} size={18} />
                  </span>
                  {t(rule.key, rule.params)}
                </li>
              ))}
            </ul>
          </section>
        )}

        <RushMilestones record={record} />
        <RushBoard />
        <p className={styles.footnote}>{t('rush.footnote')}</p>
      </main>
      <BottomNav active="map" />
    </div>
  );
}
