import { useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import ChipTabs from '../../components/game/ChipTabs.jsx';
import PartnerSwitcher from './PartnerSwitcher.jsx';
import PalTeam from './PalTeam.jsx';
import PalWardrobe from './PalWardrobe.jsx';
import PalQuests from './PalQuests.jsx';
import GroveHome from '../grove/GroveHome.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { isQuestReady, questLogFor, questsForWeek, questWeekOf } from '../../game/quests.js';
import styles from './PalsScreen.module.css';

const TAB_IDS = ['team', 'wardrobe', 'grove', 'quests'];

/**
 * Everything about your Pals: your partner on top, then tabs (pinned while scrolling) for the team,
 * the wardrobe, the Grove and this week's quests. The tab is in the address (#/pals/wardrobe), so links
 * can open one directly.
 */
export default function PalsScreen({ initialTab }) {
  const { progress } = usePlayer();
  const [tab, setTab] = useState(TAB_IDS.includes(initialTab) ? initialTab : 'team');
  const week = questWeekOf();
  const log = questLogFor(progress, week);
  const questsReady = questsForWeek(week).filter((quest) => isQuestReady(log, quest)).length;

  const choose = (id) => {
    setTab(id);
    window.history.replaceState(null, '', `#/pals/${id}`);
  };

  const tabs = [
    { id: 'team', label: 'Team', icon: 'paw' },
    { id: 'wardrobe', label: 'Wardrobe', icon: 'shirt' },
    { id: 'grove', label: 'Grove', icon: 'home' },
    { id: 'quests', label: 'Quests', icon: 'star', count: questsReady || undefined, countLabel: `${questsReady} ready to collect` },
  ];

  return (
    <div className={styles.page}>
      <ScreenHeader title="My Pals" />
      <main className={styles.main}>
        <PartnerSwitcher />
        <ChipTabs label="My Pals" idPrefix="pals" tabs={tabs} active={tab} onChange={choose} fit />
        <div id="pals-panel" role="tabpanel" aria-labelledby={`pals-${tab}`} className={styles.panel}>
          {tab === 'team' && <PalTeam />}
          {tab === 'wardrobe' && <PalWardrobe />}
          {tab === 'grove' && <GroveHome />}
          {tab === 'quests' && <PalQuests />}
        </div>
      </main>
      <BottomNav active="pals" />
    </div>
  );
}
