import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VISIT_KINDS, visitToReport } from './visits.js';

test('each kind of return is reported once per device, and matches the server', () => {
  let { kind, log } = visitToReport(null, '2026-11-20');
  assert.equal(kind, 'new');
  assert.equal(visitToReport(log, '2026-11-20').kind, null, 'the same day again is nothing new');
  ({ kind, log } = visitToReport(log, '2026-11-21'));
  assert.equal(kind, 'next_day');
  assert.equal(visitToReport(log, '2026-11-21').kind, null);
  ({ kind, log } = visitToReport(log, '2026-11-24'));
  assert.equal(kind, 'same_week');
  assert.equal(visitToReport(log, '2026-11-26').kind, null, 'a second visit that week is not counted again');
  ({ kind, log } = visitToReport(log, '2026-12-05'));
  assert.equal(kind, 'after_week');
  assert.deepEqual(log.sent, VISIT_KINDS);
  const sql = readFileSync(new URL('../../supabase/visits.sql', import.meta.url), 'utf8');
  assert.match(sql, new RegExp(`p_kind not in \\(${VISIT_KINDS.map((k) => `'${k}'`).join(', ')}\\)`));
});
