import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { readJson, removeKey, writeJson } from '../lib/storage.js';
import {
  buyStoreItemOnServer,
  claimChestOnServer,
  claimEventPrizeOnServer,
  fetchMyEvents,
  fetchMyRush,
  recordRushRunOnServer,
  fetchMyQuests,
  claimQuestOnServer,
  fetchMyDailyMissions,
  claimDailyMissionOnServer,
  recordEventLevelOnServer,
  claimDailyGiftOnServer,
  claimPresentOnServer,
  claimGlowbugRowOnServer,
  claimWinGiftOnServer,
  choosePalOnServer,
  setNicknameOnServer,
  buyAccessoryOnServer,
  wearAccessoryOnServer,
  adoptPalOnServer,
  claimLuckyPalOnServer,
  buyGroveItemOnServer,
  buyThemeItemOnServer,
  placeGroveItemOnServer,
  claimWeeklyRewardOnServer,
  consumeHelperOnServer,
  fetchEconomyState,
  OFFLINE_MESSAGE,
  fetchRemoteLevels,
  mergeGuestProgress,
  recordDailyOnServer,
  recordLevelResultOnServer,
  saveBeamTheme,
} from '../lib/economyApi.js';
import {
  buyStoreItemLocally,
  claimChestLocally,
  consumeHelperLocally,
  nextHotStreak,
  createEmptyProgress,
  recordDailyResult,
  recordLevelResult,
  upgradeProgress,
  withServerState,
  EconomyError,
} from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import { claimEventPrizeLocally, EVENT_PRIZE_SPARKS, recordEventLevelLocally } from '../game/events.js';
import { recordRushRunLocally, rushWeekOf } from '../game/rush.js';
import { starsForMoves } from '../game/scoring.js';
import { claimQuestLocally, questWeekOf, questsForWeek, recordQuestProgress } from '../game/quests.js';
import { claimMissionLocally, recordMissionLevel, recordMissionPresent, startMissionDay } from '../game/dailyMissions.js';
import { chestId, chestRewardFor } from '../game/surprises.js';
import { recordPalFeats } from '../game/palRecords.js';
import { nextWinStreak } from '../game/winStreak.js';
import { milestoneReached, solvedLevelCount } from '../game/milestones.js';
import { claimCalendarGiftLocally, claimWinGiftLocally, openPresentLocally, recordDailyWin } from '../game/gifts.js';
import { nicknameProblem } from '../game/nicknames.js';
import {
  buyAccessoryLocally,
  choosePalLocally,
  claimLuckyPalLocally,
  growPartnerLocally,
  luckyPalsWaiting,
  seedFor,
  wearAccessoryLocally,
} from '../game/pals.js';
import { buyGroveItemLocally, placeGroveItemLocally } from '../game/grove.js';
import { buyThemeItemLocally } from '../game/themes.js';
import { feedTreat } from '../game/treats.js';
import { music } from '../audio/music.js';
import { sfx } from '../audio/sfx.js';

const PROGRESS_KEY = 'prism.progress.v1';
const SETTINGS_KEY = 'prism.settings.v1';
// language: null follows the device's language (see src/i18n/translate.js).
// themedBoard: the 3D rooms are a choice; the flat board is what everyone starts with (playtest: a 9-year-old found
// the flat board far easier). It replaced `board3d`, which was on by default, so nobody is left in 3D by an old save.
const DEFAULT_SETTINGS = { sound: true, music: true, haptics: true, calmBoard: false, themedBoard: false, language: null };

const PlayerContext = createContext(null);

/** When the player's today began (their local midnight), for the server's daily counts. */
function todayStart() {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  return midnight.toISOString();
}

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
  /** Lucky Pal gifts opened and not shown yet: { palId, sparks }[] */
  const [luckyGifts, setLuckyGifts] = useState([]);
  const progressRef = useRef(progress);

  const setProgress = useCallback((next) => {
    progressRef.current = next;
    setProgressState(next);
    writeJson(PROGRESS_KEY, next);
  }, []);

  const applyServerState = useCallback((state) => setProgress(withServerState(progressRef.current, state, todayKey())), [setProgress]);

  /** Today's daily missions as the account counts them (accounts only). */
  const refreshMissions = useCallback(async () => {
    const state = await fetchMyDailyMissions(todayKey(), todayStart()).catch(() => null);
    if (state?.missions) setProgress({ ...progressRef.current, missions: state.missions });
  }, [setProgress]);

  /** Saves a partner chosen on this device to the account. Kept pending when offline; dropped if the account says no. */
  const savePendingPal = useCallback(async () => {
    const pending = progressRef.current.pal.pendingId;
    if (!userId || !pending) return;
    try {
      const state = await choosePalOnServer(pending);
      setProgress(withServerState({ ...progressRef.current, pal: { ...progressRef.current.pal, pendingId: null } }, state, todayKey()));
    } catch (error) {
      if (error.message === OFFLINE_MESSAGE) {
        setSyncStatus('error');
        return;
      }
      // The account can't use this Pal (a rule it checks): go back to the account's partner.
      setProgress({ ...progressRef.current, pal: { ...progressRef.current.pal, pendingId: null } });
      await fetchEconomyState()
        .then(applyServerState)
        .catch(() => {});
    }
  }, [userId, setProgress, applyServerState]);

  /** Open every Lucky Pal gift that's waiting (the server draws them for accounts) and queue the reveals. */
  const openLuckyPals = useCallback(async () => {
    const opened = [];
    if (!userId) {
      while (luckyPalsWaiting(progressRef.current) > 0) {
        const gift = claimLuckyPalLocally(progressRef.current);
        setProgress(gift.progress);
        opened.push({ palId: gift.palId, sparks: gift.sparks });
      }
    } else {
      for (let i = 0; i < 10 && luckyPalsWaiting(progressRef.current) > 0; i++) {
        const state = await claimLuckyPalOnServer().catch(() => null);
        if (!state) break;
        applyServerState(state);
        if (!state.luckyPal && !state.sparksEarned) break;
        opened.push({ palId: state.luckyPal, sparks: state.sparksEarned });
      }
    }
    if (opened.length) setLuckyGifts((queue) => [...queue, ...opened]);
  }, [userId, setProgress, applyServerState]);

  useEffect(() => {
    writeJson(SETTINGS_KEY, settings);
    sfx.configure(settings);
    music.configure(settings);
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
      // A partner picked while offline, signed out or before the account knew about Pals is saved now.
      const localPal = progressRef.current.pal.id;
      if (localPal && !state.pal?.id) setProgress({ ...progressRef.current, pal: { ...progressRef.current.pal, pendingId: localPal } });
      await savePendingPal();
      // The nickname chosen on this device is the one the board should show.
      if (progressRef.current.nickname) await setNicknameOnServer(progressRef.current.nickname).catch(() => {});
      // Weekend event results saved on the account.
      const events = await fetchMyEvents().catch(() => null);
      if (events?.events) setProgress({ ...progressRef.current, events: events.events });
      const quests = await fetchMyQuests().catch(() => null);
      if (quests?.quests) setProgress({ ...progressRef.current, quests: quests.quests });
      await refreshMissions();
      const rush = await fetchMyRush().catch(() => null);
      if (rush?.rush) setProgress({ ...progressRef.current, rush: rush.rush });
      // Finished last week in the top 10? Collect the reward (the server pays it only once).
      const claimed = await claimWeeklyRewardOnServer().catch(() => null);
      if (claimed?.reward) {
        applyServerState(claimed);
        setWeeklyReward(claimed.reward);
      }
      await openLuckyPals();
    } catch {
      setSyncStatus('error');
    }
  }, [userId, setProgress, applyServerState, openLuckyPals, savePendingPal, refreshMissions]);

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
      /** The next Lucky Pal gift to reveal, if any. */
      luckyGift: luckyGifts[0] ?? null,
      dismissLuckyGift: () => setLuckyGifts((queue) => queue.slice(1)),
      /** This player's number for their daily Shop picks. */
      shopSeed: userId ? seedFor(userId) : progress.shopSeed,

      /** Running out of moves on the main road ends the win streak. */
      endWinStreak() {
        if (progressRef.current.winStreak > 0)
          setProgress({ ...progressRef.current, winStreak: nextWinStreak(progressRef.current.winStreak, { isWin: false }) });
      },

      /** @returns Promise<{ stars, previousStars, sparksEarned, diamondsEarned, isNewBest }> */
      async finishLevel(level, result) {
        const today = todayKey();
        // Today's daily missions are drawn from progress before this level counts, so they stay the same all day.
        const local = recordLevelResult(startMissionDay(progressRef.current, today, Boolean(userId)), level, result);
        // 50, 100, 250… levels solved: a party on the win screen.
        local.milestone = milestoneReached(solvedLevelCount(progressRef.current), solvedLevelCount(local.progress));
        const hotStreak = nextHotStreak(progressRef.current, {
          stars: local.stars,
          usedHelpers: result.usedHelpers,
          previousStars: local.previousStars,
        });
        local.progress = { ...local.progress, hotStreak };
        // Counts toward this week's Pal quests (the server counts the same from its own results).
        local.progress = recordQuestProgress(local.progress, level.id, local.progress.levels[level.id].stars, questWeekOf());
        local.hotStreak = hotStreak;
        // The partner Pal grows with every solved level (a Skip doesn't count). The server does the same.
        if (Number.isFinite(result.moves)) {
          local.progress = recordDailyWin(local.progress, level.id, today);
          const bestStars = local.progress.levels[level.id].stars;
          local.progress = recordMissionLevel(local.progress, level.id, { bestStars, combo: result.combo }, today);
          local.progress = { ...local.progress, winStreak: nextWinStreak(local.progress.winStreak, { isWin: true }) };
          const grown = growPartnerLocally(local.progress);
          local.progress = grown.progress;
          local.palGrewTo = grown.grewTo;
          // Records with the partner Pal (Hard levels, ★★★, a triple, growing up…), kept on this device.
          const feats = recordPalFeats(local.progress, { difficulty: level.difficulty, stars: local.stars, combo: result.combo });
          local.progress = feats.progress;
          local.newRecords = feats.newRecords;
        }
        setProgress(local.progress);
        if (!userId) {
          openLuckyPals();
          return { ...local, diamondsEarned: 0 };
        }
        try {
          const state = await recordLevelResultOnServer(level.id, local.stars, result.moves);
          applyServerState(state);
          setSyncStatus('synced');
          openLuckyPals();
          refreshMissions();
          return { ...local, sparksEarned: state.sparksEarned, diamondsEarned: state.diamondsEarned };
        } catch {
          // Stars are kept on the device and sent again on the next sync.
          setSyncStatus('error');
          return { ...local, diamondsEarned: 0 };
        }
      },

      /**
       * A solved weekend-event puzzle: keeps the best stars and grows the partner Pal (no sparks per puzzle;
       * the prize comes after all 10). @returns Promise<{ stars, sparksEarned, diamondsEarned, isNewBest, palGrewTo }>
       */
      async finishEventLevel(level, { weekend, number, moves, starCap = 3 }) {
        const stars = Math.min(starsForMoves(moves, level.par, level.difficulty), starCap);
        const grown = growPartnerLocally(recordEventLevelLocally(progressRef.current, weekend, number, stars));
        setProgress(grown.progress);
        const outcome = { stars, sparksEarned: 0, diamondsEarned: 0, isNewBest: false, palGrewTo: grown.grewTo };
        if (!userId) return outcome;
        try {
          applyServerState(await recordEventLevelOnServer(weekend, number, stars));
          setSyncStatus('synced');
        } catch {
          setSyncStatus('error');
        }
        return outcome;
      },

      /** Collect a finished Pal quest. @returns sparks won. @throws EconomyError */
      async claimQuest(questId) {
        const week = questWeekOf();
        const sparks = questsForWeek(week).find((quest) => quest.id === questId)?.sparks ?? 0;
        if (!userId) {
          try {
            setProgress(claimQuestLocally(progressRef.current, questId, week));
          } catch (error) {
            throw new EconomyError(error.message);
          }
          return sparks;
        }
        applyServerState(await claimQuestOnServer(questId));
        return sparks;
      },

      /** Collect a finished daily mission (the last of the three brings a bonus). @returns { sparks } @throws EconomyError */
      async claimDailyMission(missionId) {
        const today = todayKey();
        if (!userId) {
          try {
            const { progress: next, gift } = claimMissionLocally(progressRef.current, missionId, today);
            setProgress(next);
            return gift;
          } catch (error) {
            throw new EconomyError(error.message);
          }
        }
        const state = await claimDailyMissionOnServer(missionId, today, todayStart());
        applyServerState(state);
        return state.gift;
      },

      /** Open the prize for finishing a weekend's 10 puzzles. @returns sparks won. @throws EconomyError */
      async claimEventPrize(weekend) {
        if (!userId) {
          try {
            setProgress(claimEventPrizeLocally(progressRef.current, weekend));
          } catch (error) {
            throw new EconomyError(error.message);
          }
          return EVENT_PRIZE_SPARKS;
        }
        applyServerState(await claimEventPrizeOnServer(weekend));
        return EVENT_PRIZE_SPARKS;
      },

      /** A Light Rush run reached `cleared` puzzles: keeps the week's best and pays new milestones. @returns sparks won */
      async recordRushRun(cleared) {
        const week = rushWeekOf();
        if (!userId) {
          const outcome = recordRushRunLocally(progressRef.current, week, cleared);
          setProgress(outcome.progress);
          return outcome.sparksWon;
        }
        try {
          const state = await recordRushRunOnServer(cleared);
          applyServerState(state);
          return state.sparksEarned ?? 0;
        } catch {
          setSyncStatus('error');
          return 0;
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
        // Applied on the device right away, so the choice never waits on the network. Until the account has
        // saved it, it's marked pending: kept over the account's old partner and sent again on every sync.
        const chosen = choosePalLocally(progressRef.current, palId);
        setProgress({ ...chosen, pal: { ...chosen.pal, pendingId: palId } });
        if (!userId) return;
        await savePendingPal();
      },

      /** Set the public nickname: saved here at once, then on the account. @throws EconomyError if it breaks the rules */
      async setNickname(nickname) {
        const problem = nicknameProblem(nickname);
        if (problem) throw new EconomyError(problem);
        const clean = nickname.trim().replace(/\s+/g, ' ');
        setProgress({ ...progressRef.current, nickname: clean });
        if (!userId) return;
        try {
          await setNicknameOnServer(clean);
        } catch (error) {
          // A rule the server enforces (rare): undo, so the player can pick another.
          if (!/server yet|offline/i.test(error.message)) {
            setProgress({ ...progressRef.current, nickname: null });
            throw error;
          }
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

      /** Put on an owned item (it replaces whatever is in its slot) or take it off. @throws EconomyError */
      async wearAccessory(itemId, isWearing) {
        setProgress(wearAccessoryLocally(progressRef.current, itemId, isWearing));
        if (!userId) return;
        try {
          applyServerState(await wearAccessoryOnServer(itemId, isWearing));
        } catch {
          setSyncStatus('error');
        }
      },

      /** Buy Grove decor with sparks. @throws EconomyError */
      async buyGroveItem(itemId) {
        if (!userId) {
          setProgress(buyGroveItemLocally(progressRef.current, itemId));
          return;
        }
        applyServerState(await buyGroveItemOnServer(itemId));
      },

      /** Feed your Pal the next treat. @returns { treat, trick } or null when the bag is empty (kept on this device). */
      feedTreat() {
        const fed = feedTreat(progressRef.current);
        if (!fed) return null;
        setProgress(fed.progress);
        return { treat: fed.treat, trick: fed.trick };
      },

      /** Buy a piece of this week's theme collection (sparks, or diamonds with an account). @throws EconomyError */
      async buyThemeItem(itemId) {
        if (!userId) {
          setProgress(buyThemeItemLocally(progressRef.current, itemId));
          return;
        }
        applyServerState(await buyThemeItemOnServer(itemId));
      },

      /** Place owned decor in its Grove spot (replacing what was there) or put it away. @throws EconomyError */
      async placeGroveItem(itemId, isPlacing) {
        setProgress(placeGroveItemLocally(progressRef.current, itemId, isPlacing));
        if (!userId) return;
        try {
          applyServerState(await placeGroveItemOnServer(itemId, isPlacing));
        } catch {
          setSyncStatus('error');
        }
      },

      /** Adopt a Pal you choose for diamonds (accounts only; the server charges). @throws EconomyError */
      async adoptPal(palId) {
        if (!userId) throw new EconomyError('Sign in to use diamonds.');
        applyServerState(await adoptPalOnServer(palId));
      },

      /** Open today's calendar gift. @returns { sparks, helper, diamonds?, isBig } @throws EconomyError */
      async claimDailyGift() {
        const today = todayKey();
        if (!userId) {
          const { progress: next, gift } = claimCalendarGiftLocally(progressRef.current, today);
          setProgress(next);
          return gift;
        }
        const state = await claimDailyGiftOnServer(today);
        applyServerState(state);
        // Before supabase/gifts.sql is run, the server gives the old flat gift (no calendar).
        return state.gift ?? { sparks: state.sparksEarned ?? 0, helper: null, isBig: false };
      },

      /** Open today's next win gift (1st, 3rd, 6th level won today). @returns { sparks, helper } @throws EconomyError */
      async claimWinGift() {
        const today = todayKey();
        if (!userId) {
          const { progress: next, gift } = claimWinGiftLocally(progressRef.current, today);
          setProgress(next);
          return gift;
        }
        const state = await claimWinGiftOnServer(today, todayStart());
        applyServerState(state);
        return state.gift;
      },

      /** Open the partner Pal's present (one per 10 stars). @returns { sparks, helper?, item? } @throws EconomyError */
      async openPresent() {
        if (!userId) {
          const today = todayKey();
          const { progress: next, gift } = openPresentLocally(startMissionDay(progressRef.current, today));
          setProgress(recordMissionPresent(next, today));
          return gift;
        }
        const state = await claimPresentOnServer();
        applyServerState(state);
        return state.gift;
      },

      /** Collects a finished Glowbug row's diamond (accounts only: diamonds need one). @throws when not ready */
      async claimGlowbugRow(kind) {
        if (!userId) throw new EconomyError('Sign in to use diamonds.');
        applyServerState(await claimGlowbugRowOnServer(kind));
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
    [
      progress,
      settings,
      syncStatus,
      userId,
      weeklyReward,
      luckyGifts,
      setProgress,
      applyServerState,
      syncWithServer,
      openLuckyPals,
      savePendingPal,
      refreshMissions,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return context;
}
