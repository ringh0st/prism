import { useEffect } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import RewardShower from '../../components/RewardShower.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './WeeklyRewardDialog.module.css';

const PLACE = { 1: 'top.reward.first', 2: 'top.reward.second', 3: 'top.reward.third' };

/** "You finished 2nd last week!" with the reward the server just paid out. */
export default function WeeklyRewardDialog({ reward, onClose }) {
  const { t } = useI18n();
  useEffect(() => sfx.reward(), []);
  return (
    <Dialog title={t(PLACE[reward.rank] ?? 'top.reward.nth', { rank: reward.rank })} tone="celebrate" onClose={onClose}>
      <div className={styles.lumi}>
        <Lumi mood="dance" size={110} />
      </div>
      <ul className={styles.rewards}>
        {reward.diamonds > 0 && (
          <li className={`${styles.reward} ${styles.diamond}`} aria-label={t('top.reward.diamonds', { n: reward.diamonds })}>
            <Icon name="diamond" size={30} />
            <span aria-hidden="true">+{reward.diamonds}</span>
          </li>
        )}
        <li className={styles.reward} aria-label={t('top.reward.sparks', { n: reward.sparks })}>
          <Icon name="spark" size={30} />
          <span aria-hidden="true">+{reward.sparks}</span>
        </li>
      </ul>
      <Button size="lg" onClick={onClose} data-autofocus>
        {t('top.reward.yay')}
      </Button>
      <RewardShower />
    </Dialog>
  );
}
