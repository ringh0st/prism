import { memo } from 'react';
import { TILE } from '../../game/constants.js';
import { beamColorVar, shapePathFor } from '../GemShape.jsx';
import styles from './Board.module.css';

const DIRECTION_ANGLE = { right: 0, down: 90, left: 180, up: 270 };

/** Shared SVG gradients, rendered once per board. */
export function TileDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tile-mirror" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--mirror-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--mirror-bottom)' }} />
        </linearGradient>
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

/** Each pair (portals or twin mirrors) has its own color and its own shape, so color is never the only clue. */
const PAIR_LOOKS = {
  a: { color: '#F0C14E', ink: '#8a6410', symbol: 'M0-7l2 5 5 .5-4 3.5 1.3 5L0 8.3-4.3 11l1.3-5-4-3.5 5-.5z' },
  b: { color: '#F2A67E', ink: '#9c4f2c', symbol: 'M0 7C-8 2-8-5-4-6-2-6.5 0-5 0-3c0-2 2-3.5 4-3 4 1 4 8-4 13z' },
};

function TwinMark({ link }) {
  const look = PAIR_LOOKS[link] ?? PAIR_LOOKS.a;
  return (
    <g>
      <circle cx="50" cy="50" r="12" fill={look.color} stroke="#fff" strokeWidth="3" />
      <path d={look.symbol} transform="translate(50 49) scale(.9)" fill={look.ink} />
    </g>
  );
}

function Portal({ pair }) {
  const look = PAIR_LOOKS[pair] ?? PAIR_LOOKS.a;
  return (
    <g className={styles.portal}>
      <circle cx="50" cy="50" r="38" fill={look.color} opacity="0.3" />
      <circle cx="50" cy="50" r="32" fill="none" stroke={look.color} strokeWidth="8" />
      <g className={styles.portalSwirl}>
        <path
          d="M50 28a22 22 0 0 1 22 22M50 72a22 22 0 0 1-22-22"
          stroke={look.ink}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity=".55"
        />
      </g>
      <circle cx="50" cy="50" r="14" fill="#fffaf2" />
      <path d={look.symbol} transform="translate(50 49) scale(1.1)" fill={look.ink} />
    </g>
  );
}

function Mirror({ turns, isSplitter, isLocked, link }) {
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
          fill={isSplitter ? 'url(#tile-splitter)' : 'url(#tile-mirror)'}
          stroke={isSplitter ? '#17988c' : 'none'}
          strokeWidth="2.5"
        />
        {isSplitter ? (
          <line x1="16" y1="50" x2="84" y2="50" stroke="#fff" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />
        ) : (
          <rect x="16" y="45" width="68" height="3.5" rx="2" fill="#fff" opacity="0.55" />
        )}
      </g>
      {link ? (
        <TwinMark link={link} />
      ) : (
        <circle cx="50" cy="50" r="6.5" fill={isLocked ? '#9c8873' : 'var(--color-sage)'} stroke="#fff" strokeWidth="2.5" />
      )}
    </>
  );
}

function Emitter({ dir, color }) {
  return (
    <g style={{ transform: `rotate(${DIRECTION_ANGLE[dir]}deg)`, transformOrigin: '50px 50px' }}>
      <rect x="14" y="14" width="72" height="72" rx="20" fill="url(#tile-emitter)" />
      <rect x="14" y="14" width="72" height="36" rx="18" fill="#fff" opacity="0.18" />
      <path d="M70 34 L90 50 L70 66 Z" fill="#fff" opacity="0.9" />
      <circle cx="48" cy="50" r="17" fill={beamColorVar(color)} stroke="#fff" strokeWidth="5" />
      <circle cx="43" cy="44" r="5" fill="#fff" opacity="0.8" />
    </g>
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

/** Visual for one tile. Pure presentation: no interaction here. */
function TileArt({ tile, turns = 0, isLit = false, isRotatable = false }) {
  let art = null;
  switch (tile.type) {
    case TILE.MIRROR:
    case TILE.SPLITTER:
      art = <Mirror turns={turns} isSplitter={tile.type === TILE.SPLITTER} isLocked={!isRotatable} link={tile.link} />;
      break;
    case TILE.EMITTER:
      art = <Emitter dir={tile.dir} color={tile.color} />;
      break;
    case TILE.GEM:
      art = <Gem color={tile.color} isLit={isLit} />;
      break;
    case TILE.FILTER:
      art = <Filter color={tile.color} />;
      break;
    case TILE.SHADE:
      art = <Shade isLit={isLit} />;
      break;
    case TILE.WALL:
      art = <Wall />;
      break;
    case TILE.PORTAL:
      art = <Portal pair={tile.pair} />;
      break;
    default:
      return null;
  }
  return (
    <svg className={styles.tileArt} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {art}
    </svg>
  );
}

export default memo(TileArt);
