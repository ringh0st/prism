import { supabase } from './supabase.js';

const BUILT_IN_LEVEL = /^w\d{1,2}-\d{2}$/;

/**
 * Adds one to a built-in level's anonymous play counts ('start', 'win', 'out_of_moves' or 'quit'),
 * so the owner can see which levels are walls. Nothing about the player is sent. Fire and forget.
 */
export function recordLevelPlay(levelId, event) {
  if (!BUILT_IN_LEVEL.test(levelId)) return;
  supabase.rpc('record_level_play', { p_level_id: levelId, p_event: event }).then(
    () => {},
    () => {},
  );
}
