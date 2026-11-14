import { useEffect } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import RewardShower from '../../components/RewardShower.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './WeeklyRewardDialog.module.css';

const PLACE = { 1: '1st', 2: '2nd', 3: '3rd' };

/** "You finished 2nd last week!" with the reward the server just paid out. */
export default function WeeklyRewardDialog({ reward, onClose }) {
  useEffect(() => sfx.reward(), []);
  const place = PLACE[reward.rank] ?? `${reward.rank}th`;
  return (
    <Dialog title={`You finished ${place}!`} tone="celebrate" onClose={onClose}>
      <p className={styles.text}>Last week you were one of the brightest players in the world.</p>
      <ul className={styles.rewards}>
        {reward.diamonds > 0 && (
          <li className={`${styles.reward} ${styles.diamond}`}>
            <Icon name="diamond" size={24} /> +{reward.diamonds} diamonds
          </li>
        )}
        <li className={styles.reward}>
          <Icon name="spark" size={24} /> +{reward.sparks} sparks
        </li>
      </ul>
      <div className={styles.lumi}>
        <LumiSays mood="dance" size={92} line="Champion vibes! Let’s do it again." />
      </div>
      <Button size="lg" onClick={onClose} data-autofocus>
        Yay!
      </Button>
      <RewardShower />
    </Dialog>
  );
}
