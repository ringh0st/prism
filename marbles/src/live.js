// A live game with a friend: both phones join a channel named by a short code and send each other every shot.
// Nothing is stored; the channel is the same kind Slime Merge's fights use (Supabase Realtime broadcast).
import { RealtimeClient } from '@supabase/realtime-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../src/lib/config.js';

/** Seconds a player has for a turn in a live game. */
export const TURN_SECONDS = 10;

/** A code to share: five digits, easy to say and to type. */
export const newCode = () => String(10000 + Math.floor(Math.random() * 90000));

/** A typed code tidied up, or null when it can't be one. */
export function tidyCode(text) {
  const digits = String(text ?? '').replace(/\D/g, '');
  return digits.length === 5 ? digits : null;
}

/**
 * Joins the channel of a game.
 * @param onMessage called with every message from the other player
 * @param onStatus called with 'open' once connected, or 'failed'
 * @returns {{ send(message), leave() }}
 */
export function joinLive(code, onMessage, onStatus) {
  // While developing, "?local" links two tabs of one browser without the server.
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('local')) {
    const tabs = new BroadcastChannel(`marbles-${code}`);
    tabs.onmessage = (event) => onMessage(event.data);
    setTimeout(() => onStatus('open'), 50);
    return { send: (message) => tabs.postMessage(message), leave: () => tabs.close() };
  }
  const client = new RealtimeClient(`${SUPABASE_URL}/realtime/v1`, { params: { apikey: SUPABASE_PUBLISHABLE_KEY } });
  const channel = client.channel(`marbles-${code}`, { config: { broadcast: { self: false } } });
  channel.on('broadcast', { event: 'game' }, ({ payload }) => onMessage(payload));
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') onStatus('open');
    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onStatus('failed');
  });
  return {
    send: (message) => channel.send({ type: 'broadcast', event: 'game', payload: message }).catch(() => {}),
    leave: () => {
      client.removeChannel(channel).catch(() => {});
      client.disconnect();
    },
  };
}

/** Everything about a yard the other phone must agree on after a shot. */
export const snapshotOf = (game) => ({
  marbles: game.world.marbles.map((m) => [m.id, Math.round(m.x * 100) / 100, Math.round(m.y * 100) / 100, m.out ? 1 : 0, m.sunk ? 1 : 0, m.counted ? 1 : 0]),
  hasStones: game.world.stones.length > 0,
  bag: game.bag,
  calls: game.calls,
  inRing: game.inRing,
  turns: game.turns,
  run: game.run,
  turn: game.turn,
  winner: game.winner,
  shots: game.shots,
  last: game.last,
});

/** Makes this phone's yard exactly the one the shooter's phone ended with. */
export function applySnapshot(game, snap) {
  for (const [id, x, y, out, sunk, counted] of snap.marbles) {
    const m = game.world.marbles.find((marble) => marble.id === id);
    if (m) Object.assign(m, { x, y, vx: 0, vy: 0, air: 0, out: Boolean(out), sunk: Boolean(sunk), counted: Boolean(counted) });
  }
  if (!snap.hasStones) game.world.stones = [];
  Object.assign(game, { bag: snap.bag, calls: snap.calls, inRing: snap.inRing, turns: snap.turns, run: snap.run, turn: snap.turn, winner: snap.winner, shots: snap.shots, last: snap.last });
}
