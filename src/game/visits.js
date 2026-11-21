import { daysBetween } from './daily.js';

/*
 * Do players come back? Each device remembers the day it first played and which of its returns it has already
 * reported, and reports each kind once: 'new' on the first day, then 'next_day' (day 1), 'same_week' (days 2–7)
 * and 'after_week' (day 8 on). Only these totals reach the server (supabase/visits.sql); nothing about the player.
 */
export const VISIT_KINDS = ['new', 'next_day', 'same_week', 'after_week'];

/**
 * What to report for a visit today.
 * @param log { firstDay: 'YYYY-MM-DD', sent: [kinds] } or null for a device that has never played
 * @returns {{ kind, log }} kind: the visit to report now (null: nothing new); log: what to remember
 */
export function visitToReport(log, today) {
  if (!log?.firstDay) return { kind: 'new', log: { firstDay: today, sent: ['new'] } };
  const days = daysBetween(log.firstDay, today);
  const kind = days === 1 ? 'next_day' : days >= 2 && days <= 7 ? 'same_week' : days > 7 ? 'after_week' : null;
  if (!kind || log.sent.includes(kind)) return { kind: null, log };
  return { kind, log: { ...log, sent: [...log.sent, kind] } };
}
