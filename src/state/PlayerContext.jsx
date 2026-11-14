import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { readJson, removeKey, writeJson } from '../lib/storage.js';
import {
  buyStoreItemOnServer,
  claimChestOnServer,
  claimDailyGiftOnServer,
  choosePalOnServer,
  buyAccessoryOnServer,
  equipAccessoryOnServer,
  claimWeeklyRewardOnServer,
  consumeHelperOnServer,
  fetchEconomyState,
  fetchRemoteLevels,
  mergeGuestProgress,
  recordDailyOnServer,
  recordLevelResultOnServer,
  saveBeamTheme,
} from '../lib/economyApi.js';
import {
  buyStoreItemLocally,
  claimChestLocally,
  claimDailyGiftLocally,
  consumeHelperLocally,
  nextHotStreak,
  createEmptyProgress,
  recordDailyResult,
  recordLevelResult,
  upgradeProgress,
  withServerState,
} from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import { chestId, chestRewardFor } from '../game/surprises.js';
import { DAILY_GIFT_SPARKS } from '../game/catalog.js';
import { buyAccessoryLocally, choosePalLocally, equipAccessoryLocally, growPartnerPal } from '../game/pals.js';
import { sfx } from '../audio/sfx.js';

const PROGRESS_KEY = 'prism.progress.v1';
const SETTINGS_KEY = 'prism.settings.v1';
const DEFAULT_SETTINGS = { sound: true, haptics: true };

const PlayerContext = createContext(null);

/**
 * Player progress and wallet.
 * Guests: everything lives on the device. Signed in: the server is the source of truth for
 * sparks, diamonds and helpers; the device keeps a copy for instant display and offline play.
 */
export function PlayerProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [progress, setProgressState] = useState(() => upgradeProgress(readJson(PROGRESS_KEY, {})));
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...readJson(SETTINGS_KEY, {}) }));
  const [syncStatus, setSyncStatus] = useState('local'); // local | syncing | synced | error
  const [weeklyReward, setWeeklyReward] = useState(null);
  const progressRef = useRef(progress);

  const setProgress = useCallback((next) => {
    progressRef.current = next;
    setProgressState(next);
    writeJson(PROGRESS_KEY, next);
  }, []);

  const applyServerState = useCallback(
    (state) => setProgress(withServerState(progressRef.current, state, todayKey())),
    [setProgress],
  );

  useEffect(() => {
    writeJson(SETTINGS_KEY, settings);
    sfx.configure(settings);
  }, [settings]);

  // Signing in moves guest stars into the account, then loads the account.
  const syncWithServer = useCallback(async () => {
    if (!userId) return;
    setSyncStatus('syncing');
    try {
      const local = progressRef.current.levels;
      const state = Object.keys(local).length ? await mergeGuestProgress(local) : await fetchEconomyState();
      const levels = await fetchRemoteLevels(userId);
      setProgress({ ...withServerState(progressRef.current, state, todayKey()), levels });
      setSyncStatus('synced');
      // A Pal picked while offline (or before the account knew about Pals) is saved now.
      const localPal = progressRef.current.pal.id;
      if (localPal && !state.pal?.id) {
        await choosePalOnServer(localPal).then(applyServerState).catch(() => {});
      }
      // Finished last week in the top 10? Collect the reward (the server pays it only once).
      const claimed = await claimWeeklyRewardOnServer().catch(() => null);
      if (claimed?.reward) {
        applyServerState(claimed);
        setWeeklyReward(claimed.reward);
      }
    } catch {
      setSyncStatus('error');
    }
  }, [userId, setProgress, applyServerState]);

  useEffect(() => {
    if (userId) syncWithServer();
    else setSyncStatus('local');
  }, [userId, syncWithServer]);

  const value = useMemo(
    () => ({
      progress,
      settings,
      syncStatus,
      isSignedIn: Boolean(userId),
      refresh: syncWithServer,
      /** Last week's top-10 reward that was just collected, shown once. */
      weeklyReward,
      dismissWeeklyReward: () => setWeeklyReward(null),

      /** @returns Promise<{ stars, previousStars, sparksEarned, diamondsEarned, isNewBest }> */
      async finishLevel(level, result) {
        const local = recordLevelResult(progressRef.current, level, result);
        const hotStreak = nextHotStreak(progressRef.current, { stars: local.stars, usedHelpers: result.usedHelpers });
        local.progress = { ...local.progress, hotStreak };
        local.hotStreak = hotStreak;
        // A newly solved level helps the partner Pal grow (the server does the same for accounts).
        local.palEvolvedTo = null;
        if (local.previousStars === 0 && local.stars > 0) {
          const grown = growPartnerPal(local.progress);
          local.progress = grown.progress;
          local.palEvolvedTo = grown.evolvedTo;
        }
        setProgress(local.progress);
        if (!userId) return { ...local, diamondsEarned: 0 };
        try {
          const state = await recordLevelResultOnServer(level.id, local.stars, result.moves);
          applyServerState(state);
          setSyncStatus('synced');
          return { ...local, sparksEarned: state.sparksEarned, diamondsEarned: state.diamondsEarned };
        } catch {
          // Stars are kept on the device and sent again on the next sync.
          setSyncStatus('error');
          return { ...local, diamondsEarned: 0 };
        }
      },

      /** @returns Promise<{ sparksEarned, diamondsEarned, streak, isFirstToday }> */
      async finishDaily(dateKey) {
        if (!userId) {
          const outcome = recordDailyResult(progressRef.current, dateKey);
          if (outcome.isFirstToday) setProgress(outcome.progress);
          return outcome;
        }
        try {
          const state = await recordDailyOnServer(dateKey);
          applyServerState(state);
          return state;
        } catch {
          setSyncStatus('error');
          return { sparksEarned: 0, diamondsEarned: 0, streak: progressRef.current.daily.streak, isFirstToday: false };
        }
      },

      /** @throws EconomyError with a player-facing message */
      async buyItem(itemId, currency) {
        if (!userId) {
          setProgress(buyStoreItemLocally(progressRef.current, itemId, currency, todayKey()));
          return;
        }
        applyServerState(await buyStoreItemOnServer(itemId, currency));
      },

      /** Open a reward chest. @returns the reward. @throws EconomyError */
      async claimChest(world, chestNumber) {
        const reward = chestRewardFor(world, chestNumber);
        if (!userId) {
          setProgress(claimChestLocally(progressRef.current, chestId(world, chestNumber), reward));
          return reward;
        }
        const state = await claimChestOnServer(world, chestNumber);
        applyServerState(state);
        return state.reward ?? reward;
      },

      /** Pick your partner Pal. @throws EconomyError */
      async choosePal(palId) {
        // Applied on the device right away, so the choice never waits on the network.
        setProgress(choosePalLocally(progressRef.current, palId));
        if (!userId) return;
        try {
          applyServerState(await choosePalOnServer(palId));
        } catch {
          // Kept on this device and sent again on the next sync.
          setSyncStatus('error');
        }
      },

      /** Buy a Pal accessory with sparks. @throws EconomyError */
      async buyAccessory(itemId) {
        if (!userId) {
          setProgress(buyAccessoryLocally(progressRef.current, itemId));
          return;
        }
        applyServerState(await buyAccessoryOnServer(itemId));
      },

      /** Wear an owned accessory, or null to take it off. @throws EconomyError */
      async equipAccessory(itemId) {
        if (!userId) {
          setProgress(equipAccessoryLocally(progressRef.current, itemId));
          return;
        }
        applyServerState(await equipAccessoryOnServer(itemId));
      },

      /** Collect today's free gift. @returns the sparks received. @throws EconomyError */
      async claimDailyGift() {
        const today = todayKey();
        if (!userId) {
          setProgress(claimDailyGiftLocally(progressRef.current, today));
          return DAILY_GIFT_SPARKS;
        }
        const state = await claimDailyGiftOnServer(today);
        applyServerState(state);
        return state.sparksEarned;
      },

      /** @throws EconomyError when none are left */
      async consumeHelper(helperId) {
        if (!userId) {
          setProgress(consumeHelperLocally(progressRef.current, helperId));
          return;
        }
        applyServerState(await consumeHelperOnServer(helperId));
      },

      setBeamTheme(themeId) {
        setProgress({ ...progressRef.current, beamTheme: themeId });
        if (userId) saveBeamTheme(userId, themeId).catch(() => setSyncStatus('error'));
      },

      updateSettings(patch) {
        setSettings((current) => ({ ...current, ...patch }));
      },

      resetLocalProgress() {
        removeKey(PROGRESS_KEY);
        setProgress(createEmptyProgress());
      },
    }),
    [progress, settings, syncStatus, userId, weeklyReward, setProgress, applyServerState, syncWithServer],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return context;
}
