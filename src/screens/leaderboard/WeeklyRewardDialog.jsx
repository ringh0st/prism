import { useEffect } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import RewardShower from '../../components/RewardShower.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
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
      <p className={styles.text}>{t('top.reward.text')}</p>
      <ul className={styles.rewards}>
        {reward.diamonds > 0 && (
          <li className={`${styles.reward} ${styles.diamond}`}>
            <Icon name="diamond" size={24} /> {t('top.reward.diamonds', { n: reward.diamonds })}
          </li>
        )}
        <li className={styles.reward}>
          <Icon name="spark" size={24} /> {t('top.reward.sparks', { n: reward.sparks })}
        </li>
      </ul>
      <div className={styles.lumi}>
        <LumiSays mood="dance" size={92} line={t('top.reward.lumi')} />
      </div>
      <Button size="lg" onClick={onClose} data-autofocus>
        {t('top.reward.yay')}
      </Button>
      <RewardShower />
    </Dialog>
  );
}
