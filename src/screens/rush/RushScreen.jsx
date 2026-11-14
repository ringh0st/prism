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
import styles from './Rush.module.css';

const RULES = [
  { icon: 'map', text: `${RUSH_LENGTH} puzzles in a row, from easy to tough. Same ones for everyone this week.` },
  { icon: 'bolt', text: `${RUSH_START_SPARE} spare moves for the whole run. Solve in par and it costs nothing; every extra move uses one.` },
  { icon: 'gift', text: `+${RUSH_BONUS_SPARE} spare moves every ${RUSH_BONUS_EVERY} puzzles. Restarting uses up the moves you made.` },
  { icon: 'lock', text: 'No helpers. Just you and the light!' },
];

/** Light Rush: this week's run, the rules, milestone rewards and the board. New puzzles every Monday. */
export default function RushScreen() {
  const { progress, recordRushRun } = usePlayer();
  const rush = useRushRun();
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
      <ScreenHeader title="Light Rush" />
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="rush-title">
          <span className={styles.heroIcon} aria-hidden="true">
            <Icon name="bolt" size={40} strokeWidth={2.4} />
          </span>
          <div>
            <p className={styles.kicker}>This week</p>
            <h2 id="rush-title" className={`game-title ${styles.heroTitle}`}>
              How far can you go?
            </h2>
            <p className={styles.best}>
              Your best: <strong className="game-title">{record.best}</strong> / {RUSH_LENGTH}
            </p>
          </div>
        </section>

        {!isUnlocked ? (
          <section className={styles.card}>
            <LumiSays mood="happy" size={72} line={`Finish World ${RUSH_UNLOCK_WORLDS} to unlock Light Rush. It’s a real brain workout!`} />
          </section>
        ) : (
          <section className={styles.card} aria-label="Play">
            {rush.run ? (
              <>
                <p className={styles.runStatus}>
                  Run in progress: puzzle <strong>{rush.run.cleared + 1}</strong> of {RUSH_LENGTH}, <strong>{rush.run.spare}</strong> spare moves
                </p>
                <Button size="lg" icon="play" onClick={() => navigate('#/rush/play')}>
                  Continue run
                </Button>
                <Button variant="ghost" icon="restart" onClick={startRun}>
                  Start a new run
                </Button>
              </>
            ) : (
              <Button size="lg" icon="bolt" onClick={startRun}>
                Start a run
              </Button>
            )}
            <ul className={styles.rules}>
              {RULES.map((rule) => (
                <li key={rule.icon}>
                  <span className={styles.ruleIcon} aria-hidden="true">
                    <Icon name={rule.icon} size={18} />
                  </span>
                  {rule.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        <RushMilestones record={record} />
        <RushBoard />
        <p className={styles.footnote}>New puzzles every Monday. Your best run of the week counts.</p>
      </main>
      <BottomNav active="map" />
    </div>
  );
}
