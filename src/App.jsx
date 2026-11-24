import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AuthProvider } from './state/AuthContext.jsx';
import { PlayerProvider, usePlayer } from './state/PlayerContext.jsx';
import { LevelsProvider, useLevels } from './state/LevelsContext.jsx';
import { I18nProvider } from './i18n/I18nContext.jsx';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useLevel } from './hooks/useLevel.js';
import GameBackground from './components/game/GameBackground.jsx';
import MapScreen from './screens/map/MapScreen.jsx';
import PlayScreen from './screens/play/PlayScreen.jsx';
import ChallengeRoute from './screens/play/ChallengeRoute.jsx';
import RushScreen from './screens/rush/RushScreen.jsx';
import RushRoute from './screens/rush/RushRoute.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import StoreScreen from './screens/StoreScreen.jsx';
import LeaderboardScreen from './screens/leaderboard/LeaderboardScreen.jsx';
import PalsScreen from './screens/pals/PalsScreen.jsx';
import GroveScreen from './screens/grove/GroveScreen.jsx';
import EventScreen from './screens/event/EventScreen.jsx';
import GlowbugGarden from './screens/glowbugs/GlowbugGarden.jsx';
import StickerAlbum from './screens/stickers/StickerAlbum.jsx';
import EventLevelRoute from './screens/event/EventLevelRoute.jsx';
import SaveChoiceDialog from './components/SaveChoiceDialog.jsx';
import WeeklyRewardDialog from './screens/leaderboard/WeeklyRewardDialog.jsx';
import FriendFoundDialog from './screens/pals/FriendFoundDialog.jsx';
import { isFriendDue } from './game/firstFriend.js';
import FirstLaunch from './screens/welcome/FirstLaunch.jsx';
import PalUnlockNotice from './screens/pals/PalUnlockNotice.jsx';
import LuckyPalDialog from './screens/pals/LuckyPalDialog.jsx';
import NotFoundScreen from './screens/NotFoundScreen.jsx';
import LoadingScreen from './screens/LoadingScreen.jsx';
import SplashScreen from './components/splash/SplashScreen.jsx';
import { isCheckoutThanks } from './lib/checkoutReturn.js';
import { SplashContext } from './state/SplashContext.jsx';
import { dailyLevelFor, todayKey } from './game/daily.js';
import { BEAM_THEMES, starsFor } from './game/progress.js';
import { sfx } from './audio/sfx.js';
import { areAllLevelsOpen } from './lib/openAllLevels.js';

// The editor is only for admins, so players never download it.
const AdminScreen = lazy(() => import('./screens/admin/AdminScreen.jsx'));

/** Applies the chosen beam theme as a CSS variable. */
function BeamThemeStyle() {
  const { progress } = usePlayer();
  useEffect(() => {
    const theme = BEAM_THEMES.find((t) => t.id === progress.beamTheme) ?? BEAM_THEMES[0];
    document.documentElement.style.setProperty('--beam-sun', theme.color);
  }, [progress.beamTheme]);
  return null;
}

/** At sign-in, when the account already has its own game: keep both, or only the account. */
function SaveChoiceNotice() {
  const { saveChoice, chooseSave } = usePlayer();
  return saveChoice ? <SaveChoiceDialog choice={saveChoice} onChoose={chooseSave} /> : null;
}

/** Pops up once when last week's top-10 reward has just been collected. */
function WeeklyRewardNotice() {
  const { weeklyReward, dismissWeeklyReward } = usePlayer();
  return weeklyReward ? <WeeklyRewardDialog reward={weeklyReward} onClose={dismissWeeklyReward} /> : null;
}

/** A first Pal turns up after a few wins; later, newly unlocked Pals are celebrated. Only on menu screens, never mid-level. */
const PAL_NOTICE_ROUTES = ['map', 'pals', 'settings', 'store', 'top'];

function PalNotices() {
  const { progress, luckyGift } = usePlayer();
  const route = useHashRoute();
  const [isSkipped, setIsSkipped] = useState(false);
  if (!PAL_NOTICE_ROUTES.includes(route.name)) return null;
  // The first Pal turns up as a reward after a few solved levels (usually on the win screen; this
  // catches players who went back to the map instead).
  if (!progress.pal.id) return isFriendDue(progress) && !isSkipped ? <FriendFoundDialog onDone={() => setIsSkipped(true)} /> : null;
  return (
    <>
      {/* One sheet at a time: a Lucky gift first, then the new Pals. */}
      {luckyGift ? <LuckyPalDialog /> : <PalUnlockNotice />}
    </>
  );
}

/** Sends the player back to the map (for a link to a level that isn't open yet). */
function BackToMap() {
  useEffect(() => window.location.replace('#/'), []);
  return null;
}

function LevelRoute({ levelId }) {
  const { level, isLoading, isFailed, retry } = useLevel(levelId);
  const { nextLevelIdAfter, previousLevelIdBefore } = useLevels();
  const { progress } = usePlayer();
  if (isLoading) return <LoadingScreen />;
  if (isFailed) return <NotFoundScreen onRetry={retry} />;
  if (!level) return <NotFoundScreen />;
  // A level opens once the one before it is solved (a link can't skip ahead), unless the owner opened them all.
  const previousId = previousLevelIdBefore(level.id);
  if (previousId && starsFor(progress, previousId) === 0 && !areAllLevelsOpen()) return <BackToMap />;
  const nextId = nextLevelIdAfter(level.id);
  return <PlayScreen key={level.id} level={level} nextLevel={nextId ? `#/play/${nextId}` : null} />;
}

function Routes() {
  const route = useHashRoute();
  const { playtestLevel } = useLevels();

  switch (route.name) {
    case 'map':
      return <MapScreen />;
    case 'play':
      return <LevelRoute levelId={route.params[0]} />;
    case 'rush':
      return route.params[0] === 'play' ? <RushRoute /> : <RushScreen />;
    case 'challenge':
      return <ChallengeRoute params={route.params} />;
    case 'daily': {
      const dateKey = todayKey();
      const level = dailyLevelFor(dateKey);
      return level ? <PlayScreen key={level.id} level={level} mode="daily" title="Daily puzzle" dateKey={dateKey} /> : <NotFoundScreen />;
    }
    case 'test':
      return playtestLevel ? (
        <PlayScreen key="playtest" level={playtestLevel} mode="playtest" title="Test play" backHref="#/admin" />
      ) : (
        <NotFoundScreen />
      );
    case 'stickers':
      return <StickerAlbum />;
    case 'glowbugs':
      return <GlowbugGarden />;
    case 'event':
      return route.params[0] ? <EventLevelRoute number={Number(route.params[0])} /> : <EventScreen />;
    case 'top':
      return <LeaderboardScreen />;
    case 'pals':
      return <PalsScreen key={route.params[0] ?? 'team'} initialTab={route.params[0]} />;
    case 'grove':
      return <GroveScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'store':
      return <StoreScreen isReturningFromCheckout={route.params[0] === 'thanks'} />;
    case 'admin':
      return (
        <Suspense fallback={<LoadingScreen />}>
          <AdminScreen />
        </Suspense>
      );
    default:
      return <NotFoundScreen />;
  }
}

/** The splash shows once each time the game opens (not for admin test plays or back from paying); the game loads underneath. */
const SKIP_SPLASH_ROUTES = ['admin', 'test'];

export default function App() {
  const route = useHashRoute();
  const [showsSplash, setShowsSplash] = useState(() => !SKIP_SPLASH_ROUTES.includes(route.name) && !isCheckoutThanks(route));
  const hideSplash = useCallback(() => setShowsSplash(false), []);

  // Browsers only allow audio after a user gesture.
  useEffect(() => {
    const unlock = () => sfx.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  return (
    <AuthProvider>
      <PlayerProvider>
        <LevelsProvider>
          <I18nProvider>
            <GameBackground />
            <BeamThemeStyle />
            <SplashContext.Provider value={showsSplash}>
              {/* Every screen fades in, so moving between screens is never a hard cut. Opacity only: a transform here
                  would stop the bottom bar and PLAY from staying fixed to the screen. */}
              <div key={`${route.name}/${route.params.join('/')}`} className="screen-in">
                <Routes />
              </div>
            </SplashContext.Provider>
            {/* Pop-ups wait until the splash is gone */}
            {showsSplash ? (
              <SplashScreen onDone={hideSplash} />
            ) : (
              <>
                <WeeklyRewardNotice />
        <SaveChoiceNotice />
                <PalNotices />
                {route.name === 'map' && <FirstLaunch />}
              </>
            )}
          </I18nProvider>
        </LevelsProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
