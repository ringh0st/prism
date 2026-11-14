import { useEffect, useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import TitleBadge from '../../components/game/TitleBadge.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { fetchPlayerCard } from '../../lib/economyApi.js';
import { palById, palStage } from '../../game/pals.js';
import { playerStatsOf, TOTAL_PALS } from '../../game/playerStats.js';
import styles from './PlayerCardDialog.module.css';

const STATS = [
  { key: 'score', icon: 'trophy', label: 'points this week' },
  { key: 'stars', icon: 'star', label: 'stars' },
  { key: 'worldsFinished', icon: 'map', label: 'worlds finished' },
  { key: 'palsCount', icon: 'paw', label: `Pals of ${TOTAL_PALS}` },
];

/**
 * Another player's card from the Top board: their partner Pal, title and a few stats, each next to
 * yours, so you can see how you compare. Your own row shows your card.
 */
export default function PlayerCardDialog({ row, myScore = null, onClose }) {
  const { progress } = usePlayer();
  const mine = { ...playerStatsOf(progress), score: myScore };
  const [card, setCard] = useState(row.isMe ? { ...row, ...mine } : null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (row.isMe) return;
    let isCurrent = true;
    fetchPlayerCard(row.rank)
      .then((data) => isCurrent && (data ? setCard(data) : setError('This player isn’t on the board anymore.')))
      .catch((failure) => isCurrent && setError(failure.message));
    return () => {
      isCurrent = false;
    };
  }, [row]);

  const pal = palById(card?.pal ?? row.pal);
  return (
    <Dialog title={row.isMe ? 'Your card' : row.nickname} tone="celebrate" onClose={onClose}>
      <div className={styles.hero}>
        <span className={`game-title ${styles.rank}`}>#{row.rank}</span>
        <div className={styles.stage}>
          {pal ? (
            <PalArt palId={pal.id} stage={card?.palStage ?? row.palStage ?? 0} wearing={card?.wearing ?? row.wearing ?? []} size={150} alive />
          ) : null}
        </div>
        {pal && (
          <p className={styles.pal}>
            {row.isMe ? 'Playing with' : 'Partner:'} <strong>{pal.name}</strong> · {palStage(card?.palStage ?? row.palStage ?? 0).name}
          </p>
        )}
        {card && <TitleBadge stars={card.stars} size="lg" />}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {!card && !error && <p className={styles.loading}>Loading…</p>}
      {card && (
        <ul className={styles.stats}>
          {STATS.map(({ key, icon, label }) => {
            const theirs = card[key];
            const yours = mine[key];
            const isAhead = !row.isMe && Number.isFinite(yours) && yours > theirs;
            return (
              <li key={key} className={styles.stat}>
                <span className={styles.statIcon} aria-hidden="true">
                  <Icon name={icon} size={18} />
                </span>
                <span className={`game-title ${styles.value}`}>{theirs ?? '–'}</span>
                <span className={styles.label}>{label}</span>
                {!row.isMe && Number.isFinite(yours) && (
                  <span className={`${styles.you} ${isAhead ? styles.ahead : ''}`}>
                    You: {yours}
                    {isAhead ? ' 🎉' : ''}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Button onClick={onClose} data-autofocus>
        {row.isMe ? 'Nice!' : 'Challenge accepted!'}
      </Button>
    </Dialog>
  );
}
