import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider } from './state/AuthContext.jsx';
import { PlayerProvider, usePlayer } from './state/PlayerContext.jsx';
import { LevelsProvider, useLevels } from './state/LevelsContext.jsx';
import { useHashRoute } from './hooks/useHashRoute.js';
import MapScreen from './screens/MapScreen.jsx';
import PlayScreen from './screens/PlayScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import StoreScreen from './screens/StoreScreen.jsx';
import NotFoundScreen from './screens/NotFoundScreen.jsx';
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

function Routes() {
  const route = useHashRoute();
  const { levelById, nextLevelAfter, playtestLevel } = useLevels();

  switch (route.name) {
    case 'map':
      return <MapScreen />;
    case 'play': {
      const level = levelById(route.params[0]);
      if (!level) return <NotFoundScreen />;
      const next = nextLevelAfter(level.id);
      return <PlayScreen key={level.id} level={level} nextLevel={next ? `#/play/${next.id}` : null} />;
    }
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
        <Suspense fallback={<p style={{ padding: 24 }}>Loading editor…</p>}>
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
          <BeamThemeStyle />
          <Routes />
        </LevelsProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
