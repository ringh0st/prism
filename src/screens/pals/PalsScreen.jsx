import { useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import ChipTabs from '../../components/game/ChipTabs.jsx';
import PartnerSwitcher from './PartnerSwitcher.jsx';
import PalTeam from './PalTeam.jsx';
import PalWardrobe from './PalWardrobe.jsx';
import PalQuests from './PalQuests.jsx';
import DailyMissions from './DailyMissions.jsx';
import GroveHome from '../grove/GroveHome.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { isQuestReady, questLogFor, questsForWeek, questWeekOf } from '../../game/quests.js';
import { readyMissionCount } from '../../game/dailyMissions.js';
import { todayKey } from '../../game/daily.js';
import styles from './PalsScreen.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

const TAB_IDS = ['team', 'wardrobe', 'grove', 'quests'];

/**
 * Everything about your Pals: your partner on top, then tabs (pinned while scrolling) for the team,
 * the wardrobe, the Grove, and today's missions with this week's quests. The tab is in the address (#/pals/wardrobe), so links
 * can open one directly.
 */
export default function PalsScreen({ initialTab }) {
  const { progress, isSignedIn } = usePlayer();
  const { t } = useI18n();
  const [tab, setTab] = useState(TAB_IDS.includes(initialTab) ? initialTab : 'team');
  const week = questWeekOf();
  const log = questLogFor(progress, week);
  const questsReady = questsForWeek(week).filter((quest) => isQuestReady(log, quest)).length + readyMissionCount(progress, todayKey(), isSignedIn);

  const choose = (id) => {
    setTab(id);
    window.history.replaceState(null, '', `#/pals/${id}`);
  };

  const tabs = [
    { id: 'team', label: t('pals.tab.team'), icon: 'paw' },
    { id: 'wardrobe', label: t('pals.tab.wardrobe'), icon: 'shirt' },
    { id: 'grove', label: t('pals.tab.grove'), icon: 'home' },
    {
      id: 'quests',
      label: t('pals.tab.quests'),
      icon: 'star',
      count: questsReady || undefined,
      countLabel: t('pals.tab.questsReady', { n: questsReady }),
    },
  ];

  return (
    <div className={styles.page}>
      <ScreenHeader title={t('pals.title')} />
      <main className={styles.main}>
        <PartnerSwitcher />
        <ChipTabs label={t('pals.title')} idPrefix="pals" tabs={tabs} active={tab} onChange={choose} fit />
        <div id="pals-panel" role="tabpanel" aria-labelledby={`pals-${tab}`} className={styles.panel}>
          {tab === 'team' && <PalTeam />}
          {tab === 'wardrobe' && <PalWardrobe />}
          {tab === 'grove' && <GroveHome />}
          {tab === 'quests' && (
            <>
              <DailyMissions />
              <PalQuests />
            </>
          )}
        </div>
      </main>
      <BottomNav active="pals" />
    </div>
  );
}
