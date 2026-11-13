import { supabase } from './supabase.js';
import { EconomyError } from '../game/progress.js';

/** Turn database/network errors into short messages players can understand. */
function friendlyError(error) {
  const message = error?.message ?? '';
  if (/fetch|network|timeout/i.test(message)) return new EconomyError('You seem to be offline. Please try again.');
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
