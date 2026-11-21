import { memo } from 'react';
import { FRAGILE_TURNS, TILE } from '../../game/constants.js';
import { beamColorVar, shapePathFor } from '../GemShape.jsx';
import { DarkCounter, DarkenedGem, EclipseArt, SmudgeArt, VoidArt } from './darkTileArt.jsx';
import { FLAT_SCENES } from './flatScenes.jsx';
import SleepyLumi from './SleepyLumi.jsx';
import styles from './Board.module.css';

const DIRECTION_ANGLE = { right: 0, down: 90, left: 180, up: 270 };

/** Each pair (portals or twin mirrors) has its own color and its own shape, so color is never the only clue. */
const PAIR_LOOKS = {
  a: { color: '#F0C14E', ink: '#8a6410', symbol: 'M0-7l2 5 5 .5-4 3.5 1.3 5L0 8.3-4.3 11l1.3-5-4-3.5 5-.5z' },
  b: { color: '#F2A67E', ink: '#9c4f2c', symbol: 'M0 7C-8 2-8-5-4-6-2-6.5 0-5 0-3c0-2 2-3.5 4-3 4 1 4 8-4 13z' },
};

/** Shared SVG gradients, rendered once per board. */
export function TileDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tile-mirror" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--mirror-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--mirror-bottom)' }} />
        </linearGradient>
        {/* A mirror that can't turn is steel grey, so it never reads as one of the colored mirrors that do */}
        <linearGradient id="tile-mirror-fixed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c3c8cf" />
          <stop offset="1" stopColor="#6d737c" />
        </linearGradient>
        {/* A portal: a dark hole in the middle, its pair's color at the rim */}
        {Object.entries(PAIR_LOOKS).map(([pair, look]) => (
          <radialGradient key={pair} id={`tile-portal-${pair}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#120c09" />
            <stop offset="0.5" stopColor="#3a2718" />
            <stop offset="0.86" stopColor={look.ink} />
            <stop offset="1" stopColor={look.color} />
          </radialGradient>
        ))}
        <linearGradient id="tile-splitter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6fff8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#2ec4b6" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="tile-emitter" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6b45e" />
          <stop offset="1" stopColor="#e5864f" />
        </linearGradient>
        <linearGradient id="tile-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9a27e" />
          <stop offset="1" stopColor="#9c7350" />
        </linearGradient>
        <radialGradient id="tile-shade" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#6b5a52" />
          <stop offset="1" stopColor="#2b211c" />
        </radialGradient>
        <filter id="tile-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
    </svg>
  );
}

function TwinMark({ link }) {
  const look = PAIR_LOOKS[link] ?? PAIR_LOOKS.a;
  return (
    <g>
      <circle cx="50" cy="50" r="12" fill={look.color} stroke="#fff" strokeWidth="3" />
      <path d={look.symbol} transform="translate(50 49) scale(.9)" fill={look.ink} />
    </g>
  );
}

/**
 * A portal looks like one (owner: "it doesn't look much like a portal"): a glowing ring round a dark hole, with
 * arms of light swirling into it and a slower ring of sparks turning the other way. Its pair's shape sits on a
 * little badge in the corner, so the two ends of a pair can be matched without relying on color.
 */
function Portal({ pair }) {
  const look = PAIR_LOOKS[pair] ?? PAIR_LOOKS.a;
  const id = PAIR_LOOKS[pair] ? pair : 'a';
  return (
    <g className={styles.portal}>
      <circle cx="50" cy="50" r="40" fill={look.color} filter="url(#tile-glow)" opacity="0.6" />
      <circle cx="50" cy="50" r="40" fill={`url(#tile-portal-${id})`} stroke={look.ink} strokeWidth="3" />
      <g className={styles.portalSwirl} data-scenery>
        {[0, 120, 240].map((turn) => (
          <path
            key={turn}
            d="M50 50c-3-13 6-26 22-27 8 1 13 6 15 12"
            transform={`rotate(${turn} 50 50)`}
            fill="none"
            stroke={look.color}
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.95"
          />
        ))}
      </g>
      <g className={styles.portalSparks} data-scenery>
        {[20, 95, 170, 245, 320].map((turn, n) => (
          <circle key={turn} cx="50" cy="16" r={n % 2 ? 2 : 3} fill="#fffaf0" transform={`rotate(${turn} 50 50)`} />
        ))}
      </g>
      <circle cx="50" cy="50" r="7" fill="#fffaf0" opacity="0.9" />
      <circle cx="80" cy="80" r="14" fill="#fffaf2" stroke={look.ink} strokeWidth="3" />
      <path d={look.symbol} transform="translate(80 79) scale(0.95)" fill={look.ink} />
    </g>
  );
}

function Mirror({ turns, isSplitter, isLocked, link, oneSided }) {
  const angle = -45 + turns * 90;
  return (
    <>
      {isLocked ? (
        <g className={styles.lockBase}>
          <rect x="14" y="14" width="72" height="72" rx="14" />
          {[22, 78].map((x) => [22, 78].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" />))}
        </g>
      ) : (
        <circle className={styles.pivotBase} cx="50" cy="50" r="36" />
      )}
      <g className={styles.rotor} style={{ transform: `rotate(${angle}deg)` }}>
        <rect
          x="9"
          y="42"
          width="82"
          height="16"
          rx="8"
          fill={isSplitter ? 'url(#tile-splitter)' : isLocked ? 'url(#tile-mirror-fixed)' : 'url(#tile-mirror)'}
          stroke={isSplitter ? '#17988c' : isLocked ? '#3d4248' : 'var(--mirror-edge, none)'}
          strokeWidth="2.5"
        />
        {oneSided !== undefined && (
          // The dark back of a one-sided mirror (the silvered face is the other side of the bar), with little ribs.
          <g>
            <rect x="9" y={oneSided === 0 ? 50 : 42} width="82" height="8" rx="4" fill="#5e4a3f" />
            <path
              d={oneSided === 0 ? 'M24 52v4M38 52v4M52 52v4M66 52v4M80 52v4' : 'M24 44v4M38 44v4M52 44v4M66 44v4M80 44v4'}
              stroke="#8a7264"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}
        {isSplitter ? (
          <line x1="16" y1="50" x2="84" y2="50" stroke="#fff" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />
        ) : (
          <rect x="16" y="45" width="68" height="3.5" rx="2" fill="#fff" opacity="0.55" />
        )}
      </g>
      {link ? (
        <TwinMark link={link} />
      ) : (
        // A turning mirror has a soft green pivot; a fixed one is held by a dark bolt.
        <>
          <circle cx="50" cy="50" r={isLocked ? 7.5 : 6.5} fill={isLocked ? '#3d4248' : 'var(--color-sage)'} stroke="#fff" strokeWidth="2.5" />
          {isLocked && <path d="M46.5 46.5l7 7M53.5 46.5l-7 7" stroke="#c3c8cf" strokeWidth="2" strokeLinecap="round" />}
        </>
      )}
    </>
  );
}

/** A cracking mirror's turns left: three little dots that go out one by one, then a crack. */
function CrackMarks({ turnsLeft }) {
  if (turnsLeft <= 0) {
    return (
      <g className={styles.cracked}>
        <path
          d="M30 26l12 16-6 6 14 12-4 10M70 30l-10 14 8 8-12 10"
          fill="none"
          stroke="#5e5047"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={38 + i * 12}
          cy="88"
          r="4.5"
          fill={i < turnsLeft ? 'var(--color-peach)' : 'rgba(94, 80, 71, 0.25)'}
          stroke="#fff"
          strokeWidth="1.5"
        />
      ))}
    </g>
  );
}

/** Fog: a soft cloud over a cell until light reaches it. */
function Fog() {
  return (
    <g className={styles.fog}>
      <rect x="6" y="6" width="88" height="88" rx="16" fill="#e9e1d4" />
      <path d="M24 64a14 14 0 0 1 6-26 18 18 0 0 1 34-4 14 14 0 0 1 12 30z" fill="#f8f3ea" />
      <path d="M36 74a10 10 0 0 1 4-18 13 13 0 0 1 24 0 10 10 0 0 1 4 18z" fill="#fffaf2" opacity="0.8" />
      <text x="50" y="58" textAnchor="middle" fontSize="22" fontWeight="800" fill="#a99a88" fontFamily="var(--font-display)">
        ?
      </text>
    </g>
  );
}

/** A prism crystal: light comes out of both sides. */
function Prism() {
  return (
    <g>
      <path d="M50 12L86 76H14z" fill="#f6e3c6" stroke="#d9a066" strokeWidth="4" strokeLinejoin="round" />
      <path d="M50 12L50 76H14z" fill="#f2a67e" opacity="0.45" />
      <path d="M50 12L68 44 50 76z" fill="#58ac82" opacity="0.35" />
      <path d="M50 12L86 76H50z" fill="#f0c14e" opacity="0.35" />
      <path d="M38 40l8-14" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

/** A scene's lamp: its own picture standing upright, and a bold arrow on the side the light leaves from. */
function SceneLamp({ Lamp, dir, color, turnable, turns }) {
  const angle = DIRECTION_ANGLE[dir] + (turnable ? (turns % 2) * 90 : 0);
  return (
    <g>
      <circle cx="50" cy="50" r="44" fill="#fffaf0" opacity="0.72" />
      {turnable && <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-sage)" strokeWidth="5" strokeDasharray="10 8" />}
      <g transform="translate(50 52) scale(0.8) translate(-50 -52)">
        <Lamp color={color} />
      </g>
      <g className={turnable ? styles.rotor : undefined} style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50px 50px' }}>
        <path d="M80 34 L100 50 L80 66 Z" fill={beamColorVar(color)} stroke="#3b1a08" strokeWidth="3" strokeLinejoin="round" />
      </g>
    </g>
  );
}

function Emitter({ dir, color, turnable, turns }) {
  // A turning lamp swings a quarter turn clockwise and back on each tap (it has two positions), on a round turntable.
  const angle = DIRECTION_ANGLE[dir] + (turnable ? (turns % 2) * 90 : 0);
  return (
    <g>
      {turnable && <circle className={styles.pivotBase} cx="50" cy="50" r="44" />}
      <g className={turnable ? styles.rotor : undefined} style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50px 50px' }}>
        <EmitterBody color={color} />
      </g>
      {turnable && <path d="M50 4a46 46 0 0 1 40 24" fill="none" stroke="var(--color-sage)" strokeWidth="5" strokeLinecap="round" />}
    </g>
  );
}

function EmitterBody({ color }) {
  return (
    <g>
      <rect x="14" y="14" width="72" height="72" rx="20" fill="url(#tile-emitter)" />
      <rect x="14" y="14" width="72" height="36" rx="18" fill="#fff" opacity="0.18" />
      <path d="M70 34 L90 50 L70 66 Z" fill="#fff" opacity="0.9" />
      <circle cx="48" cy="50" r="17" fill={beamColorVar(color)} stroke="#fff" strokeWidth="5" />
      <circle cx="43" cy="44" r="5" fill="#fff" opacity="0.8" />
    </g>
  );
}

/**
 * A light gate: a wooden door with a padlock in its pair's color while its switch is dark; lit, the padlock is gone
 * and the two leaves stand folded open at the sides, so light passes through the middle.
 */
function Gate({ pair, isOpen }) {
  const look = PAIR_LOOKS[pair] ?? PAIR_LOOKS.a;
  if (isOpen) {
    return (
      <g className={styles.gateOpen}>
        <rect x="10" y="10" width="80" height="80" rx="14" fill="none" stroke={look.color} strokeWidth="5" strokeDasharray="10 8" />
        <rect x="8" y="12" width="13" height="76" rx="5" fill="#b98a5e" stroke="#6f4b2e" strokeWidth="3" />
        <rect x="79" y="12" width="13" height="76" rx="5" fill="#b98a5e" stroke="#6f4b2e" strokeWidth="3" />
        <circle cx="50" cy="16" r="10" fill="#fffaf2" stroke={look.color} strokeWidth="3" />
        <path d={look.symbol} transform="translate(50 15.5) scale(.62)" fill={look.ink} />
      </g>
    );
  }
  return (
    <g>
      <rect x="10" y="10" width="80" height="80" rx="14" fill="#b98a5e" stroke="#6f4b2e" strokeWidth="4" />
      <path d="M50 12v76M30 12v76M70 12v76" stroke="#6f4b2e" strokeWidth="3" opacity="0.4" />
      <path d="M12 28h76M12 72h76" stroke={look.color} strokeWidth="7" />
      {/* The padlock: only its switch opens it */}
      <path d="M40 48v-8a10 10 0 0 1 20 0v8" fill="none" stroke="#4a3526" strokeWidth="6" strokeLinecap="round" />
      <rect x="32" y="46" width="36" height="28" rx="8" fill="#fffaf2" stroke={look.color} strokeWidth="4" />
      <path d={look.symbol} transform="translate(50 59.5) scale(.8)" fill={look.ink} />
    </g>
  );
}

/**
 * A light switch: a toggle like the ones in a phone's settings, which everyone reads as on/off. Dark, the track is
 * grey and the knob rests on the left; when light hits it the knob slides right and the track glows in its pair's
 * color (and its gate opens). Its pair's shape sits on top, and a wire runs from it to its gate (`GateWires`).
 */
function Switch({ pair, isLit }) {
  const look = PAIR_LOOKS[pair] ?? PAIR_LOOKS.a;
  return (
    <g>
      {isLit && <rect x="8" y="16" width="84" height="72" rx="20" fill={look.color} filter="url(#tile-glow)" />}
      <rect x="10" y="18" width="80" height="68" rx="18" fill="#fffaf2" stroke={look.color} strokeWidth="6" />
      <rect
        x="20"
        y="42"
        width="60"
        height="32"
        rx="16"
        fill={isLit ? look.color : '#b9b0a3'}
        stroke={isLit ? look.ink : '#8f8477'}
        strokeWidth="3"
      />
      <circle
        className={`${styles.lever} ${isLit ? styles.leverOn : ''}`}
        cx="36"
        cy="58"
        r="11"
        fill="#fff"
        stroke={isLit ? look.ink : '#8f8477'}
        strokeWidth="3"
      />
      <circle cx="50" cy="20" r="11" fill="#fffaf2" stroke={look.color} strokeWidth="3" />
      <path d={look.symbol} transform="translate(50 19.5) scale(.66)" fill={look.ink} />
    </g>
  );
}

/**
 * The wires from each light switch to its gate (owner: "it's a bit hard to understand" which thing opens which):
 * a dashed line in the pair's color, dark while the switch is dark, bright with running dashes once it's lit.
 */
const between = (value, a, b) => value >= Math.min(a, b) && value <= Math.max(a, b);

export function GateWires({ level, openGates, className }) {
  const center = (tile) => `${tile.x + 0.5} ${tile.y + 0.5}`;
  const switches = level.tiles.filter((tile) => tile.type === TILE.SWITCH);
  const gates = level.tiles.filter((tile) => tile.type === TILE.GATE);
  if (!switches.length || !gates.length) return null;
  return (
    <svg className={className} viewBox={`0 0 ${level.width} ${level.height}`} aria-hidden="true">
      {switches.flatMap((from) =>
        gates
          .filter((gate) => gate.pair === from.pair)
          .map((gate) => {
            const look = PAIR_LOOKS[from.pair] ?? PAIR_LOOKS.a;
            const isOn = Boolean(openGates?.has(from.pair));
            // Two ways round the corner: take the one that runs under fewer pieces
            const busy = (corner) =>
              level.tiles.filter(
                (tile) =>
                  tile !== from &&
                  tile !== gate &&
                  ((tile.y === corner.y && tile.y === from.y && between(tile.x, from.x, gate.x)) ||
                    (tile.x === corner.x && tile.x === gate.x && between(tile.y, from.y, gate.y)) ||
                    (tile.x === corner.x && tile.x === from.x && between(tile.y, from.y, gate.y)) ||
                    (tile.y === corner.y && tile.y === gate.y && between(tile.x, from.x, gate.x))),
              ).length;
            const acrossFirst = busy({ x: gate.x, y: from.y }) <= busy({ x: from.x, y: gate.y });
            const path = acrossFirst ? `M${center(from)} H${gate.x + 0.5} V${gate.y + 0.5}` : `M${center(from)} V${gate.y + 0.5} H${gate.x + 0.5}`;
            return (
              <g key={`${from.x},${from.y}-${gate.x},${gate.y}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={path} stroke={look.ink} strokeWidth="0.13" opacity={isOn ? 0.9 : 0.45} />
                <path
                  d={path}
                  stroke={isOn ? '#fff' : look.color}
                  strokeWidth="0.07"
                  strokeDasharray="0.12 0.14"
                  className={isOn ? styles.wireOn : undefined}
                  data-scenery
                />
              </g>
            );
          }),
      )}
    </svg>
  );
}

function Gem({ color, isLit }) {
  const path = shapePathFor(color);
  return (
    <g className={`${styles.gem} ${isLit ? styles.gemLit : ''}`}>
      {isLit && <path d={path} fill={beamColorVar(color)} filter="url(#tile-glow)" opacity="0.9" />}
      <g transform="translate(50 50) scale(0.78) translate(-50 -50)">
        <path d={path} fill={beamColorVar(color)} stroke="rgba(0,0,0,.22)" strokeWidth="5" strokeLinejoin="round" />
        <path d={path} fill="#fff" opacity="0.4" transform="translate(50 50) scale(0.45) translate(-56 -62)" />
      </g>
    </g>
  );
}

function Filter({ color }) {
  return (
    <>
      <circle cx="50" cy="50" r="34" fill={beamColorVar(color)} opacity="0.35" />
      <circle cx="50" cy="50" r="34" fill="none" stroke={beamColorVar(color)} strokeWidth="6" />
      <path d={shapePathFor(color)} transform="translate(50 50) scale(0.32) translate(-50 -50)" fill="#fff" />
    </>
  );
}

function Shade({ isLit }) {
  return (
    <g className={isLit ? styles.shadeLit : ''}>
      {isLit && <circle cx="50" cy="50" r="34" fill="#ff3b30" filter="url(#tile-glow)" />}
      <circle cx="50" cy="50" r="32" fill="url(#tile-shade)" />
      <path d="M58 30a20 20 0 1 0 12 28 16 16 0 1 1-12-28z" fill="#a58f80" opacity="0.65" />
      {isLit && (
        <text x="50" y="62" textAnchor="middle" fontSize="36" fontWeight="800" fill="#fff" fontFamily="var(--font-display)">
          !
        </text>
      )}
    </g>
  );
}

function Wall() {
  return (
    <>
      <rect x="10" y="10" width="80" height="80" rx="14" fill="url(#tile-wall)" />
      <rect x="10" y="10" width="80" height="22" rx="11" fill="#fff" opacity="0.18" />
      <path d="M10 50 H90 M50 10 V50 M30 50 V90 M70 50 V90" stroke="#7d5a3d" strokeWidth="3" opacity="0.35" />
    </>
  );
}

/**
 * Visual for one tile. Pure presentation: no interaction here.
 * turnsLeft: a cracking mirror's remaining turns. isFogged: hidden under fog until light reaches it.
 * darkCount: moves left on a fading gem or a dying lamp (darkness.js; null hides it, e.g. once a gem is saved);
 * isDarkened: a gem the darkness took.
 * The darkness pieces 'gloom' and 'eclipse' are drawn too, for the spotlight that introduces them.
 * scene: the flat scene's name (flatScenes.jsx), which draws its own walls and lamps and a sleeping Lumi (in `coat`)
 * instead of a gem; joins: which sides a wall touches another wall on (JOIN bits).
 */
function TileArt({
  tile,
  turns = 0,
  isLit = false,
  isOpen = false,
  isRotatable = false,
  turnsLeft = FRAGILE_TURNS,
  isFogged = false,
  darkCount = undefined,
  isDarkened = false,
  scene = null,
  coat = null,
  joins = 0,
}) {
  const look = FLAT_SCENES[scene];
  let art = null;
  switch (isFogged ? 'fog' : tile.type) {
    case 'fog':
      art = <Fog />;
      break;
    case TILE.MIRROR:
    case TILE.SPLITTER:
      art = (
        <>
          <Mirror turns={turns} isSplitter={tile.type === TILE.SPLITTER} isLocked={!isRotatable} link={tile.link} oneSided={tile.oneSided} />
          {tile.fragile && <CrackMarks turnsLeft={turnsLeft} />}
        </>
      );
      break;
    case TILE.PRISM:
      art = <Prism />;
      break;
    case TILE.EMITTER:
      art = look ? (
        <SceneLamp Lamp={look.Lamp} dir={tile.dir} color={tile.color} turnable={tile.turnable} turns={turns} />
      ) : (
        <Emitter dir={tile.dir} color={tile.color} turnable={tile.turnable} turns={turns} />
      );
      break;
    case TILE.GEM:
      art = isDarkened ? (
        <DarkenedGem />
      ) : look ? (
        <>
          <look.Perch />
          <SleepyLumi color={tile.color} coat={coat} isLit={isLit} />
        </>
      ) : (
        <Gem color={tile.color} isLit={isLit} />
      );
      break;
    case TILE.VOID:
      art = <VoidArt />;
      break;
    case 'gloom':
      art = <SmudgeArt />;
      break;
    case 'eclipse':
      art = <EclipseArt />;
      break;
    case TILE.FILTER:
      art = <Filter color={tile.color} />;
      break;
    case TILE.SHADE:
      art = <Shade isLit={isLit} />;
      break;
    case TILE.WALL:
      art = look ? <look.Wall joins={joins} seed={tile.x * 3 + tile.y * 5} /> : <Wall />;
      break;
    case TILE.PORTAL:
      art = <Portal pair={tile.pair} />;
      break;
    case TILE.GATE:
      art = <Gate pair={tile.pair} isOpen={isOpen} />;
      break;
    case TILE.SWITCH:
      art = <Switch pair={tile.pair} isLit={isLit} />;
      break;
    default:
      return null;
  }
  // Fading gems and dying lamps count down (the spotlight samples show their starting count).
  const count = darkCount !== undefined ? darkCount : isFogged ? null : (tile.fade ?? tile.power ?? null);
  return (
    <svg className={styles.tileArt} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {art}
      {count !== null && !isDarkened && <DarkCounter value={count} />}
    </svg>
  );
}

export default memo(TileArt);
