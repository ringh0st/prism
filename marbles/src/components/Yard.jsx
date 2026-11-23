import { useEffect, useRef, useState } from 'react';
import { STEP, flick, isAtRest, speedOf, step } from '../game/physics.js';
import { YARD, callBakol, judge } from '../game/rules.js';
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
 */
export default function Yard({ game, cpuLevel = null, onChange }) {
  const canvasRef = useRef(null);
  const viewRef = useRef(null);
  // What is going on right now, outside React (it changes every frame).
  const live = useRef({ aim: null, pull: null, moving: false, events: [], side: null, high: false, last: 0, acc: 0 });
  const [isHigh, setIsHigh] = useState(false);
  const [, redraw] = useState(0);
  const gameRef = useRef(game);
  gameRef.current = game;
  const side = game.turn;
  const canShoot = !game.winner && !(cpuLevel && side === 'foe');

  // The 3D view, sized to its box.
  useEffect(() => {
    const canvas = canvasRef.current;
    const view = createView(canvas, YARD);
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
            if (g.winner) sfx.cheer();
            else if (result.won) sfx.win();
            else sfx.miss();
            onChangeRef.current(result);
          }
        }
        if (state.moving) sfx.roll(Math.max(...g.world.marbles.map(speedOf)) / 700);
      }
      view.render(g.world, { aim: state.aim, turn: g.winner || state.moving ? null : g.turn, now, dt });
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

  /** Lets the shooter go. */
  const fire = (angle, power, high) => {
    const state = live.current;
    const g = gameRef.current;
    if (state.moving || g.winner) return;
    const shooter = g.world.marbles.find((m) => m.id === g.turn);
    if (high) g.calls[g.turn].bagova--;
    flick(shooter, angle, power, { high });
    Object.assign(state, { moving: true, events: [], side: g.turn, time: 0, acc: 0, aim: null, pull: null });
    sfx.flick(power);
    setIsHigh(false);
    redraw((n) => n + 1);
  };

  // The computer's turn: it thinks for a moment, then shoots.
  useEffect(() => {
    if (!cpuLevel || game.turn !== 'foe' || game.winner || live.current.moving) return undefined;
    const timer = setTimeout(() => {
      const shot = pickShot(gameRef.current, 'foe', cpuLevel);
      fire(shot.angle, shot.power, false);
    }, 900);
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
    state.aim = far < 6 ? null : { angle: Math.atan2(dy, dx), power: Math.min(1, far / FULL_PULL), high: isHigh };
  };
  const onDown = (event) => {
    if (!canShoot || live.current.moving) return;
    sfx.unlock();
    const at = viewRef.current.toYard(event.clientX, event.clientY);
    if (!at) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    live.current.pull = at;
  };
  const onUp = () => {
    const { aim } = live.current;
    live.current.pull = null;
    live.current.aim = null;
    if (aim && aim.power >= MIN_POWER && canShoot) fire(aim.angle, aim.power, isHigh);
  };

  const calls = game.calls[side];
  const sweep = () => {
    if (callBakol(game, side)) {
      sfx.sweep();
      onChange(null);
      redraw((n) => n + 1);
    }
  };
  return (
    <div className="yard">
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
        </div>
      )}
    </div>
  );
}
