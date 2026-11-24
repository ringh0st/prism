import { supabase } from './supabase.js';
import { EconomyError } from '../game/progress.js';
import { checkoutReturnUrl } from './checkoutReturn.js';

/** The message for a request that never reached the server. */
export const OFFLINE_MESSAGE = 'You seem to be offline. Please try again.';

/** Turn database/network errors into short messages players can understand. */
function friendlyError(error) {
  const message = error?.message ?? '';
  if (/fetch|network|timeout/i.test(message)) return new EconomyError(OFFLINE_MESSAGE);
  // The database is missing a newer function (its SQL script hasn't been run yet).
  if (/could not find the function|schema cache/i.test(message)) {
    return new EconomyError('This isn’t ready on our server yet. Please try again a bit later!');
  }
  return new EconomyError(message || 'Something went wrong. Please try again.');
}

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw friendlyError(error);
  return data;
}

// All currency changes for signed-in players go through these server functions (supabase/economy.sql).

export const fetchEconomyState = () => rpc('economy_state');

export const recordLevelResultOnServer = (levelId, stars, moves) =>
  rpc('record_level_result', { p_level_id: levelId, p_stars: stars, p_moves: Number.isFinite(moves) ? moves : null });

export const mergeGuestProgress = (levels) =>
  rpc('merge_guest_progress', {
    p_levels: Object.entries(levels).map(([levelId, entry]) => ({ levelId, stars: entry.stars, bestMoves: entry.bestMoves })),
  });

/** Combines this device's guest save (Pals, outfits, Grove, sparks, helpers…) with the account, once, at sign-in. */
export const combineGuestSaveOnServer = (save) => rpc('combine_guest_save', { p_save: save });

/** Gives the account any gift Pal it doesn't have yet (GIFT_PALS); `giftPals` lists the ones given now. */
export const claimGiftPalsOnServer = () => rpc('claim_gift_pals');

export const recordDailyOnServer = (dateKey) => rpc('record_daily', { p_date: dateKey });

export const buyStoreItemOnServer = (itemId, currency) => rpc('buy_store_item', { p_item_id: itemId, p_currency: currency });

export const consumeHelperOnServer = (helperId) => rpc('use_helper', { p_helper: helperId });

export const claimChestOnServer = (world, chestNumber) => rpc('claim_chest', { p_world: world, p_chest: chestNumber });

/** Sets the public nickname (checked on the server too). @returns state with `nickname` */
export const setNicknameOnServer = (nickname) => rpc('set_nickname', { p_nickname: nickname.trim() });

export const choosePalOnServer = (palId) => rpc('choose_pal', { p_pal: palId });

export const buyAccessoryOnServer = (itemId) => rpc('buy_accessory', { p_item: itemId });

export const wearAccessoryOnServer = (itemId, isWearing) => rpc('wear_accessory', { p_item: itemId, p_wear: isWearing });

export const buyGroveItemOnServer = (itemId) => rpc('buy_grove_item', { p_item: itemId });

export const placeGroveItemOnServer = (itemId, isPlacing) => rpc('place_grove_item', { p_item: itemId, p_place: isPlacing });

/** Opens one waiting Lucky Pal gift (every 200 solved levels). The result's `luckyPal` is the new Pal or null. */
export const claimLuckyPalOnServer = () => rpc('claim_lucky_pal');

/** Adopt a Pal you choose for diamonds. */
export const adoptPalOnServer = (palId) => rpc('adopt_pal', { p_pal: palId });

/** Collects today's free gift of sparks. */
export const claimDailyGiftOnServer = (dateKey) => rpc('claim_daily_gift', { p_date: dateKey });
export const claimPresentOnServer = () => rpc('claim_present');

/** Opens a sure Legendary present (every 100 solved levels, or this Sunday by the player's date). */
export const claimLegendaryPresentOnServer = (dateKey) => rpc('claim_legendary_present', { p_date: dateKey });
export const claimGlowbugRowOnServer = (kind) => rpc('claim_glowbug_row', { p_kind: kind });
export const claimWinGiftOnServer = (dateKey, since) => rpc('claim_win_gift', { p_date: dateKey, p_since: since });

/** This week's top players (nicknames only) and the caller's place. Works for guests too. */
export const fetchWeeklyLeaderboard = () => rpc('weekly_leaderboard');

/** Collects last week's top-10 reward, if any. The result's `reward` is null when there is none. */
export const claimWeeklyRewardOnServer = () => rpc('claim_weekly_reward');

export async function fetchRemoteLevels(userId) {
  const { data, error } = await supabase.from('progress').select('level_id, stars, best_moves').eq('user_id', userId);
  if (error) throw friendlyError(error);
  return Object.fromEntries(data.map((row) => [row.level_id, { stars: row.stars, bestMoves: row.best_moves }]));
}

export async function saveBeamTheme(userId, themeId) {
  const { error } = await supabase.from('profiles').update({ beam_theme: themeId }).eq('id', userId);
  if (error) throw friendlyError(error);
}

/** Starts a real-money checkout and returns the payment page URL. */
export async function startDiamondCheckout(packId) {
  const returnUrl = checkoutReturnUrl('thanks');
  const { data, error } = await supabase.functions.invoke('create-checkout', { body: { packId, returnUrl } });
  if (error || !data?.url) throw new EconomyError('Checkout isn’t available right now. Please try again later.');
  return data.url;
}

/** Weekend events (supabase/events.sql). Each returns the economy state plus `events`. */
export const recordEventLevelOnServer = (weekend, number, stars) =>
  rpc('record_event_level', { p_weekend: weekend, p_number: number, p_stars: stars });

export const claimEventPrizeOnServer = (weekend) => rpc('claim_event_prize', { p_weekend: weekend });

export const fetchMyEvents = () => rpc('my_events');

/** Pal quests (supabase/quests.sql): this week's counts, and collecting a finished quest's sparks. */
export const fetchMyQuests = () => rpc('my_quests');

export const claimQuestOnServer = (questId) => rpc('claim_pal_quest', { p_quest: questId });

/** Daily missions (supabase/daily_missions.sql): today's counts since the player's midnight, and collecting one. */
export const fetchMyDailyMissions = (dateKey, since) => rpc('my_daily_missions', { p_date: dateKey, p_since: since });

export const claimDailyMissionOnServer = (missionId, dateKey, since) =>
  rpc('claim_daily_mission', { p_mission: missionId, p_date: dateKey, p_since: since });

/** Light Rush (supabase/rush.sql): a run's puzzles cleared (pays new milestones), this week's record, and the board. */
export const recordRushRunOnServer = (cleared) => rpc('record_rush_run', { p_cleared: cleared });

export const fetchMyRush = () => rpc('my_rush');

export const fetchRushBoard = () => rpc('rush_board');

/** A player's card from this week's Top board (supabase/player_cards.sql), looked up by their place. */
export const fetchPlayerCard = (rank) => rpc('player_card', { p_rank: rank });

/** Buy a piece of this week's theme collection (supabase/themed_shop.sql); charges sparks or diamonds. */
export const buyThemeItemOnServer = (itemId) => rpc('buy_theme_item', { p_item: itemId });
