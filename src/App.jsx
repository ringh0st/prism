import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider } from './state/AuthContext.jsx';
import { PlayerProvider, usePlayer } from './state/PlayerContext.jsx';
import { LevelsProvider, useLevels } from './state/LevelsContext.jsx';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useLevel } from './hooks/useLevel.js';
import GameBackground from './components/game/GameBackground.jsx';
import MapScreen from './screens/map/MapScreen.jsx';
import PlayScreen from './screens/play/PlayScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import StoreScreen from './screens/StoreScreen.jsx';
import NotFoundScreen from './screens/NotFoundScreen.jsx';
import LoadingScreen from './screens/LoadingScreen.jsx';
import { dailyLevelFor, todayKey } from './game/daily.js';
import { BEAM_THEMES } from './game/progress.js';
import { sfx } from './audio/sfx.js';

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

function LevelRoute({ levelId }) {
  const { level, isLoading } = useLevel(levelId);
  const { nextLevelIdAfter } = useLevels();
  if (isLoading) return <LoadingScreen />;
  if (!level) return <NotFoundScreen />;
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

export default function App() {
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
          <GameBackground />
          <BeamThemeStyle />
          <Routes />
        </LevelsProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
