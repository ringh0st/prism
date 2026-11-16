import { SmudgeArt } from '../../components/board/darkTileArt.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './BossBar.module.css';

/**
 * Smudge's health in a boss fight (bossFight.js): his face (it flinches at every hit), a bar that drains (a notch
 * marks where each round ends), the health left as a number, and a diamond per round (filled once it's won).
 * @param boss the fight now, from usePuzzle: { phase, phases, health, maxHealth, roundEnds, isRoundCleared }
 * @param isBeaten the last round is won
 */
export default function BossBar({ boss, isBeaten }) {
  const { t } = useI18n();
  const { phase, phases, health, maxHealth, roundEnds } = boss;
  const roundsWon = isBeaten ? phases : phase + (boss.isRoundCleared ? 1 : 0);
  return (
    <div
      className={styles.bar}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={maxHealth}
      aria-valuenow={health}
      aria-label={t('boss.health', { health, total: maxHealth, round: Math.min(phases, phase + 1), rounds: phases })}
    >
      <span key={`face-${health}`} className={`${styles.face} ${isBeaten ? styles.beaten : ''}`} aria-hidden="true">
        <svg viewBox="0 0 100 100">
          <SmudgeArt isScared={isBeaten || boss.isRoundCleared} />
        </svg>
      </span>
      <span className={styles.middle} aria-hidden="true">
        <span className={styles.track}>
          <span className={styles.fill} style={{ width: `${(health / maxHealth) * 100}%` }} />
          {roundEnds.slice(0, -1).map((end) => (
            <span key={end} className={styles.notch} style={{ insetInlineStart: `${((maxHealth - end) / maxHealth) * 100}%` }} />
          ))}
        </span>
        <span className={styles.rounds}>
          {Array.from({ length: phases }, (_, k) => (
            <span key={k} className={k < roundsWon ? styles.roundWon : k === phase ? styles.roundNow : styles.roundLater}>
              {k < roundsWon ? '◆' : '◇'}
            </span>
          ))}
        </span>
      </span>
      <span key={`n-${health}`} className={`game-title ${styles.health}`} aria-hidden="true">
        {health}
      </span>
    </div>
  );
}
