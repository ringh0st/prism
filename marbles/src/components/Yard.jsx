import { useEffect, useRef, useState } from 'react';
import { STEP, flick, isAtRest, speedOf, step, strayOf } from '../game/physics.js';
import { YARD, aimsOf, callBakol, endTurn, judge } from '../game/rules.js';
import { TURN_SECONDS, applySnapshot, snapshotOf } from '../live.js';
import { pickShot } from '../game/ai.js';
import { createView } from '../game/view3d.js';
import { sfx } from '../game/audio.js';

/** How far (in yard measures) a pull-back must be for full power. */
const FULL_PULL = 150;
const MIN_POWER = 0.07;

/**
 * The yard being played: draws it, lets the side whose turn it is pull back and flick, runs the shot, plays its
 * sounds and applies the rules. The computer shoots for 'foe' when `cpuLevel` is set.
 * @param game the rules' game (changed in place as shots are played)
 * @param onChange called after every shot and call, so the page can show bags, turn and messages
 * @param net a live game with a friend: { side, send(message), listen(handler) }. `side` is the side this phone
 *   plays ('you' started the game and shoots from the near end; 'foe' joined and sees the yard from the far end).
 *   Every shot is sent and played on both phones; the shooter's phone then sends where everything ended, so the
 *   two yards can never drift apart. Each turn has TURN_SECONDS, shown as a bar; an unused turn passes.
 */
export default function Yard({ game, cpuLevel = null, net = null, onChange }) {
  const canvasRef = useRef(null);
  const viewRef = useRef(null);
  // What is going on right now, outside React (it changes every frame).
  const live = useRef({ aim: null, pull: null, moving: false, events: [], side: null, high: false, last: 0, acc: 0 });
  const [isHigh, setIsHigh] = useState(false);
  // Tinur: 0 for a plain flick, -1 to curve left, 1 to curve right (as this player sees the yard).
  const [tinur, setTinur] = useState(0);
  const isFlipped = net?.side === 'foe';
  const [, redraw] = useState(0);
  const gameRef = useRef(game);
  gameRef.current = game;
  const side = game.turn;
  const canShoot = !game.winner && (net ? side === net.side : !(cpuLevel && side === 'foe'));
  const barRef = useRef(null);
  const netRef = useRef(net);
  netRef.current = net;

  // The 3D view, sized to its box.
  useEffect(() => {
    const canvas = canvasRef.current;
    const view = createView(canvas, YARD, { flip: net?.side === 'foe' });
    viewRef.current = view;
    const fit = () => view.resize(canvas.clientWidth, canvas.clientHeight);
    fit();
    const watcher = new ResizeObserver(fit);
    watcher.observe(canvas);
    let frame = 0;
    const loop = (now) => {
      frame = requestAnimationFrame(loop);
      const state = live.current;
      const g = gameRef.current;
      const dt = state.last ? Math.min(50, now - state.last) : 16;
      state.last = now;
      if (state.moving) {
        // Run the shot in fixed steps, playing each knock as it happens.
        state.acc += dt / 1000;
        while (state.acc >= STEP && state.moving) {
          state.acc -= STEP;
          for (const event of step(g.world)) {
            state.events.push(event);
            if (event.type === 'clack') sfx.clack(event.force);
            else if (event.type === 'stone') sfx.stone(event.force);
            else if (event.type === 'kerb') sfx.kerb(event.force);
            else if (event.type === 'sunk') sfx.sunk();
            else if (event.type === 'land') sfx.land(event.force);
          }
          state.time += STEP;
          if (isAtRest(g.world) || state.time > 12) {
            for (const m of g.world.marbles) m.vx = m.vy = 0;
            state.moving = false;
            sfx.roll(0);
            const result = judge(g, state.side, state.events);
            const link = netRef.current;
            if (link) {
              // The shooter's phone says how it ended; the other one takes that over its own result.
              if (state.side === link.side) link.send({ t: 'state', snap: snapshotOf(g) });
              else if (state.snap) applySnapshot(g, state.snap);
              state.snap = null;
            }
            if (g.winner) sfx.cheer();
            else if (result.won) sfx.win();
            else sfx.miss();
            onChangeRef.current(result);
          }
        }
        if (state.moving) sfx.roll(Math.max(...g.world.marbles.map(speedOf)) / 700, g.world.ground?.hiss);
      }
      // A live game's turn clock: it starts when the yard lies still, and an unused turn passes.
      const link = netRef.current;
      if (link && barRef.current) {
        const turnKey = `${g.shots}-${g.turn}`;
        if (state.moving || g.winner) state.deadline = 0;
        else if (state.turnKey !== turnKey || !state.deadline) {
          state.turnKey = turnKey;
          state.deadline = now + TURN_SECONDS * 1000;
        }
        const left = state.deadline ? Math.max(0, (state.deadline - now) / (TURN_SECONDS * 1000)) : 0;
        barRef.current.style.transform = `scaleX(${left})`;
        barRef.current.dataset.low = String(left < 0.3);
        if (state.deadline && left === 0 && g.turn === link.side) {
          link.send({ t: 'pass' });
          passTurn();
        }
      }
      const turn = g.winner || state.moving ? null : g.turn;
      view.render(g.world, { aim: state.aim, turn, aims: turn ? aimsOf(g, turn) : [], now, dt });
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
      sfx.roll(0);
      view.dispose();
    };
  }, []);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /** A turn that wasn't used in time goes to the other side. */
  const passTurn = () => {
    const g = gameRef.current;
    const state = live.current;
    if (state.moving || g.winner) return;
    Object.assign(state, { aim: null, pull: null, deadline: 0 });
    endTurn(g);
    g.shots++;
    sfx.miss();
    onChangeRef.current({ passed: true });
  };

  /** Lets the shooter go. A shot of this phone's own in a live game is sent to the other phone first. */
  const fire = (angle, power, high, isFromFriend = false, spin = 0) => {
    const state = live.current;
    const g = gameRef.current;
    if (state.moving || g.winner) return;
    if (netRef.current && !isFromFriend) netRef.current.send({ t: 'shot', angle, power, high, spin });
    const shooter = g.world.marbles.find((m) => m.id === g.turn);
    if (high) g.calls[g.turn].bagova--;
    flick(shooter, angle, power, { high, spin });
    Object.assign(state, { moving: true, events: [], side: g.turn, time: 0, acc: 0, aim: null, pull: null });
    sfx.flick(power);
    setIsHigh(false);
    setTinur(0);
    if (spin) sfx.spin?.();
    redraw((n) => n + 1);
  };

  // What the friend's phone says: their shots, calls and passed turns, and how each of their shots ended.
  useEffect(() => {
    if (!net) return undefined;
    return net.listen((message) => {
      const g = gameRef.current;
      const state = live.current;
      if (message.t === 'shot') fire(message.angle, message.power, message.high, true, message.spin ?? 0);
      else if (message.t === 'pass') passTurn();
      else if (message.t === 'sweep') {
        if (callBakol(g, g.turn)) sfx.sweep();
        onChangeRef.current(null);
      } else if (message.t === 'state') {
        if (state.moving) state.snap = message.snap;
        else {
          applySnapshot(g, message.snap);
          onChangeRef.current({ synced: true });
        }
      }
    });
  }, [net]); // eslint-disable-line react-hooks/exhaustive-deps

  // The computer's turn: it thinks for a moment, then shoots.
  useEffect(() => {
    if (!cpuLevel || game.turn !== 'foe' || game.winner || live.current.moving) return undefined;
    const timer = setTimeout(() => {
      const shot = pickShot(gameRef.current, 'foe', cpuLevel);
      fire(shot.angle, shot.power, false);
    }, 1600); // long enough to read what the last shot did
    return () => clearTimeout(timer);
  }, [cpuLevel, game.turn, game.winner, game.shots]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pull back anywhere on the yard and let go: the shooter flies the other way, harder the farther the pull.
  const aimFrom = (event) => {
    const state = live.current;
    const at = viewRef.current.toYard(event.clientX, event.clientY);
    if (!at || !state.pull) return;
    const dx = state.pull.x - at.x;
    const dy = state.pull.y - at.y;
    const far = Math.hypot(dx, dy);
    const power = Math.min(1, far / FULL_PULL);
    state.aim = far < 6 ? null : { angle: Math.atan2(dy, dx), power, stray: strayOf(power), high: isHigh, spin: isFlipped ? -tinur : tinur };
  };
  const onDown = (event) => {
    if (!canShoot || live.current.moving) return;
    sfx.unlock();
    const at = viewRef.current.toYard(event.clientX, event.clientY);
    if (!at) return;
    // Keep getting the finger's moves when it leaves the yard (where the browser allows it).
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // No capture: aiming still works while the finger stays on the yard.
    }
    live.current.pull = at;
  };
  const onUp = () => {
    const { aim } = live.current;
    live.current.pull = null;
    live.current.aim = null;
    // A real flick is never perfectly true, and a hard one least of all: it strays a little inside the fan shown.
    if (aim && aim.power >= MIN_POWER && canShoot) fire(aim.angle + (Math.random() * 2 - 1) * aim.stray, aim.power, isHigh, false, aim.spin);
  };

  const calls = game.calls[side];
  const sweep = () => {
    if (callBakol(game, side)) {
      net?.send({ t: 'sweep' });
      sfx.sweep();
      onChange(null);
      redraw((n) => n + 1);
    }
  };
  return (
    <div className="yard">
      {net && !game.winner && (
        <div className={`clock ${side}`} aria-hidden="true">
          <i ref={barRef} />
        </div>
      )}
      <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={aimFrom} onPointerUp={onUp} onPointerCancel={onUp} />
      {canShoot && !live.current.moving && (
        <div className="calls" role="group" aria-label="Calls">
          <button onClick={sweep} disabled={calls.bakol < 1 || game.world.stones.length === 0}>
            <b>Sweep!</b>
            <small>clear the pebbles · {calls.bakol}</small>
          </button>
          <button className={isHigh ? 'on' : ''} aria-pressed={isHigh} onClick={() => setIsHigh((on) => !on)} disabled={calls.bagova < 1}>
            <b>High shot!</b>
            <small>fly over · {calls.bagova}</small>
          </button>
          {/* Tinur: a spinning flick that curves. A tap goes off → curve left → curve right → off. */}
          <button
            className={`tinur ${tinur ? 'on' : ''}`}
            aria-pressed={tinur !== 0}
            aria-label={tinur === 0 ? 'Tinur: spin the marble so it curves' : tinur < 0 ? 'Tinur: curves left (tap for right)' : 'Tinur: curves right (tap to stop spinning)'}
            onClick={() => {
              sfx.click?.();
              setTinur((t) => (t === 0 ? -1 : t < 0 ? 1 : 0));
            }}
          >
            <b>Tinur!</b>
            <small>
              <svg viewBox="0 0 24 24" aria-hidden="true" className={tinur > 0 ? 'right' : ''}>
                <path d="M17 20c-6 0-10-5-10-11V5M3 9l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {tinur === 0 ? 'spin it' : tinur < 0 ? 'curve left' : 'curve right'}
            </small>
          </button>
        </div>
      )}
    </div>
  );
}
