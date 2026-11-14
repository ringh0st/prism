import { supabase } from './supabase.js';
import { EconomyError } from '../game/progress.js';

/** Turn database/network errors into short messages players can understand. */
function friendlyError(error) {
  const message = error?.message ?? '';
  if (/fetch|network|timeout/i.test(message)) return new EconomyError('You seem to be offline. Please try again.');
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
  const returnUrl = `${window.location.origin}${window.location.pathname}#/store/thanks`;
  const { data, error } = await supabase.functions.invoke('create-checkout', { body: { packId, returnUrl } });
  if (error || !data?.url) throw new EconomyError('Checkout isn’t available right now. Please try again later.');
  return data.url;
}
