import { supabase } from './supabase.js';
import { readJson, writeJson } from './storage.js';
import { todayKey } from '../game/daily.js';
import { visitToReport } from '../game/visits.js';

const KEY = 'prism.visits.v1';

/**
 * Count this visit toward "do players come back?" (anonymous totals only, see src/game/visits.js). Fire and forget:
 * it is remembered as sent only once the server has it, so a visit made offline is reported next time.
 */
export function recordVisit() {
  const before = readJson(KEY, null);
  const { kind, log } = visitToReport(before, todayKey());
  if (!kind) return;
  supabase.rpc('record_visit', { p_first_day: log.firstDay, p_kind: kind }).then(
    ({ error }) => {
      // A device that could not report its first day still remembers it, so its returns can be counted later.
      writeJson(KEY, error ? (before ?? { firstDay: log.firstDay, sent: [] }) : log);
    },
    () => writeJson(KEY, before ?? { firstDay: log.firstDay, sent: [] }),
  );
}
