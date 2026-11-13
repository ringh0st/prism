import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { readJson, removeKey, writeJson } from '../lib/storage.js';
import { fetchRemoteProgress, saveRemoteProgress } from '../lib/remoteProgress.js';
import {
  createEmptyProgress,
  mergeProgress,
  recordDailyResult,
  recordLevelResult,
  spendSparks,
} from '../game/progress.js';
import { sfx } from '../audio/sfx.js';

const PROGRESS_KEY = 'prism.progress.v1';
const SETTINGS_KEY = 'prism.settings.v1';
const DEFAULT_SETTINGS = { sound: true, haptics: true };

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [progress, setProgressState] = useState(() => ({ ...createEmptyProgress(), ...readJson(PROGRESS_KEY, {}) }));
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...readJson(SETTINGS_KEY, {}) }));
  const [syncStatus, setSyncStatus] = useState('local'); // local | syncing | synced | error
  const progressRef = useRef(progress);

  const setProgress = useCallback((next) => {
    progressRef.current = next;
    setProgressState(next);
    writeJson(PROGRESS_KEY, next);
  }, []);

  useEffect(() => {
    writeJson(SETTINGS_KEY, settings);
    sfx.configure(settings);
  }, [settings]);

  const pushRemote = useCallback(
    (next, levelIds) => {
      if (!userId) return;
      saveRemoteProgress(userId, next, levelIds)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'));
    },
    [userId],
  );

  // Signing in merges guest progress into the account, keeping the best of both.
  useEffect(() => {
    if (!userId) {
      setSyncStatus('local');
      return undefined;
    }
    let isCancelled = false;
    setSyncStatus('syncing');
    fetchRemoteProgress(userId)
      .then((remote) => {
        if (isCancelled) return;
        const merged = mergeProgress(progressRef.current, remote);
        setProgress(merged);
        return saveRemoteProgress(userId, merged).then(() => !isCancelled && setSyncStatus('synced'));
      })
      .catch(() => !isCancelled && setSyncStatus('error'));
    return () => {
      isCancelled = true;
    };
  }, [userId, setProgress]);

  const value = useMemo(
    () => ({
      progress,
      settings,
      syncStatus,
      finishLevel(level, result) {
        const outcome = recordLevelResult(progressRef.current, level, result);
        setProgress(outcome.progress);
        pushRemote(outcome.progress, [level.id]);
        return outcome;
      },
      finishDaily(dateKey) {
        const outcome = recordDailyResult(progressRef.current, dateKey);
        if (outcome.isFirstToday) {
          setProgress(outcome.progress);
          pushRemote(outcome.progress, []);
        }
        return outcome;
      },
      trySpendSparks(amount) {
        const next = spendSparks(progressRef.current, amount);
        if (!next) return false;
        setProgress(next);
        pushRemote(next, []);
        return true;
      },
      setBeamTheme(themeId) {
        const next = { ...progressRef.current, beamTheme: themeId };
        setProgress(next);
        pushRemote(next, []);
      },
      updateSettings(patch) {
        setSettings((current) => ({ ...current, ...patch }));
      },
      resetLocalProgress() {
        removeKey(PROGRESS_KEY);
        setProgress(createEmptyProgress());
      },
    }),
    [progress, settings, syncStatus, setProgress, pushRemote],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return context;
}
