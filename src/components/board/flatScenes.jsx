/*
 * The flat board's scenes: the same five places as the 3D rooms (boardThemes.js), drawn as simple flat pictures.
 * A scene dresses the floor (colors below), the walls, the lamp and what each sleeping Lumi rests on; mirrors and
 * the later pieces keep their plain shapes, which is what makes the flat board easy to read.
 * All art is drawn in a tile's viewBox (0 0 100 100).
 */
import { beamColorVar } from '../GemShape.jsx';

const INK = '#3b1a08';
/** A tile's art is drawn a little smaller than its cell: a wall reaches this far to touch the wall on the next cell. */
const EDGE = 4.4;
/** Which sides a wall joins: bits of `joins`. */
export const JOIN = { left: 1, right: 2, up: 4, down: 8 };

/** The box a wall fills: out to the cell's edge on the sides where the next cell is a wall too. */
function wallBox(joins) {
  const x1 = joins & JOIN.left ? -EDGE : 6;
  const x2 = joins & JOIN.right ? 100 + EDGE : 94;
  const y1 = joins & JOIN.up ? -EDGE : 6;
  const y2 = joins & JOIN.down ? 100 + EDGE : 94;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1, x2, y2 };
}
const corner = (joins) => (joins ? 4 : 12);

const BOOKS = ['#b5503f', '#2f5f73', '#3f6b4c', '#c49a4a', '#5a3b5c', '#3d5a80', '#a36b2a'];

/** Library: a bookcase with two shelves of books. */
function Bookcase({ joins, seed }) {
  const box = wallBox(joins);
  const shelf = (y) => {
    const spines = [];
    for (let x = box.x + 5, k = 0; x < box.x2 - 9; k++) {
      const width = 7 + ((seed + k * 3) % 4) * 1.5;
      const height = 22 + ((seed * 2 + k * 5) % 4) * 3;
      spines.push(
        <rect
          key={k}
          x={x}
          y={y - height}
          width={Math.min(width, box.x2 - 6 - x)}
          height={height}
          rx="1.5"
          fill={BOOKS[(seed + k * 2) % BOOKS.length]}
        />,
      );
      x += width + 1;
    }
    return spines;
  };
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={corner(joins)} fill="#6b4430" />
      <rect x={box.x + 4} y="13" width={box.w - 8} height="34" fill="#2e1c12" />
      <rect x={box.x + 4} y="53" width={box.w - 8} height="34" fill="#2e1c12" />
      {shelf(47)}
      {shelf(87)}
      <rect x={box.x} y="47" width={box.w} height="6" fill="#8a5a3c" />
      <rect x={box.x} y="87" width={box.w} height="5" fill="#8a5a3c" />
    </g>
  );
}

/** Pond: a stack of logs, with growth rings where the stack ends. */
function Logs({ joins }) {
  const box = wallBox(joins);
  return (
    <g>
      {[10, 37, 64].map((y, row) => (
        <g key={y}>
          <rect
            x={box.x}
            y={y}
            width={box.w}
            height="26"
            rx={joins & (JOIN.left | JOIN.right) ? 6 : 13}
            fill={row % 2 ? '#8a5a3a' : '#9c6a44'}
            stroke="#5e3b24"
            strokeWidth="2"
          />
          <path
            d={`M${box.x + 14} ${y + 9}h${box.w * 0.3}M${box.x + box.w * 0.5} ${y + 17}h${box.w * 0.28}`}
            stroke="#5e3b24"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          {!(joins & JOIN.right) && (
            <g>
              <ellipse cx={box.x2 - 8} cy={y + 13} rx="7" ry="11" fill="#e6c794" stroke="#5e3b24" strokeWidth="2" />
              <ellipse cx={box.x2 - 8} cy={y + 13} rx="3" ry="5" fill="none" stroke="#b98d58" strokeWidth="1.5" />
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

/** Castle: a stretch of sandstone wall, with battlements where nothing stands above it. */
function CastleWall({ joins }) {
  const box = wallBox(joins);
  const top = joins & JOIN.up ? box.y : 20;
  return (
    <g>
      <rect x={box.x} y={top} width={box.w} height={box.y2 - top} rx={joins ? 3 : 8} fill="#d8b98a" stroke="#8a6a44" strokeWidth="2" />
      {!(joins & JOIN.up) &&
        [0, 1, 2].map((k) => (
          <rect
            key={k}
            x={box.x + 4 + k * ((box.w - 8) / 3) + 3}
            y="6"
            width={(box.w - 8) / 3 - 9}
            height="18"
            rx="3"
            fill="#d8b98a"
            stroke="#8a6a44"
            strokeWidth="2"
          />
        ))}
      <path
        d={`M${box.x} 46h${box.w}M${box.x} 70h${box.w}M${box.x + box.w * 0.3} ${Math.max(top, 22)}v24M${box.x + box.w * 0.7} ${Math.max(top, 22)}v24M${box.x + box.w * 0.5} 46v24M${box.x + box.w * 0.25} 70v${box.y2 - 70}M${box.x + box.w * 0.75} 70v${box.y2 - 70}`}
        stroke="#8a6a44"
        strokeWidth="2"
        opacity="0.55"
      />
    </g>
  );
}

const HUTS = [
  ['#f39ac0', '#ffffff'],
  ['#5cc7b2', '#ffffff'],
  ['#f6a66f', '#fff6e6'],
  ['#f2d05c', '#ffffff'],
];

/** Beach: a striped beach hut. */
function BeachHut({ joins, seed }) {
  const box = wallBox(joins);
  const [paint, trim] = HUTS[seed % HUTS.length];
  const stripes = Math.max(4, Math.round(box.w / 12));
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={corner(joins)} fill={trim} />
      {Array.from(
        { length: stripes },
        (_, k) => k % 2 === 0 && <rect key={k} x={box.x + (k * box.w) / stripes} y={box.y} width={box.w / stripes} height={box.h} fill={paint} />,
      )}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={corner(joins)} fill="none" stroke="rgba(59,26,8,0.45)" strokeWidth="2.5" />
      <rect x={box.x} y={box.y} width={box.w} height="16" rx={corner(joins)} fill="rgba(59,26,8,0.22)" />
      <rect x="40" y="52" width="20" height={box.y2 - 52} rx="3" fill="#8a5a3a" opacity="0.85" />
      <circle cx="55" cy="74" r="2" fill="#f2d05c" />
    </g>
  );
}

/** Forest: a clump of trees in different greens. */
function Trees({ joins, seed }) {
  const box = wallBox(joins);
  const leafy = ['#7fbf6a', '#8ccb78', '#6aae5c'];
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={joins ? 8 : 22} fill="#3f7a4a" />
      <circle cx="30" cy="34" r="20" fill={leafy[seed % 3]} />
      <circle cx="68" cy="30" r="17" fill={leafy[(seed + 1) % 3]} />
      <circle cx="62" cy="68" r="21" fill={leafy[(seed + 2) % 3]} />
      <path d="M28 88 12 88 28 54 44 88Z" fill="#2f6b45" />
      <path d="M28 70 16 70 28 46 40 70Z" fill="#37794e" />
      <circle cx="24" cy="28" r="5" fill="#fff" opacity="0.2" />
      <circle cx="58" cy="60" r="6" fill="#fff" opacity="0.18" />
    </g>
  );
}

/* Lamps stand upright; the bright part takes the light's color, and the board draws the arrow that shows the way. */

function BankerLamp({ color }) {
  return (
    <g>
      <ellipse cx="50" cy="80" rx="20" ry="6" fill="#c9902f" stroke={INK} strokeWidth="2" />
      <rect x="47" y="50" width="6" height="30" fill="#d6a347" stroke={INK} strokeWidth="2" />
      <path d="M26 54q-2-4 2-4h44q4 0 2 4z" fill={beamColorVar(color)} stroke={INK} strokeWidth="2" />
      <path d="M24 50q2-24 26-24t26 24z" fill="#2f8f6d" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M34 44q2-10 12-13" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.5" fill="none" />
    </g>
  );
}

const Flame = ({ color, x = 50, y = 50, size = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${size})`}>
    <path
      d="M0-20c9 9 13 15 13 22a13 13 0 0 1-26 0c0-5 3-9 7-13 0 5 2 7 4 7 1-5 0-10 2-16z"
      fill={beamColorVar(color)}
      stroke={INK}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M0-4c4 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-6 5-9z" fill="#fff" opacity="0.75" />
  </g>
);

function Lantern({ color }) {
  return (
    <g>
      <path d="M38 26q12-14 24 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <rect x="30" y="26" width="40" height="8" rx="3" fill="#5a6b5e" stroke={INK} strokeWidth="2" />
      <rect x="32" y="34" width="36" height="44" rx="5" fill="#fff6dc" stroke={INK} strokeWidth="2.4" />
      <Flame color={color} y={62} size={0.8} />
      <path d="M32 34v44M68 34v44" stroke="#5a6b5e" strokeWidth="4" />
      <rect x="28" y="78" width="44" height="8" rx="3" fill="#5a6b5e" stroke={INK} strokeWidth="2" />
    </g>
  );
}

function Torch({ color }) {
  return (
    <g>
      <path d="M44 56h12l-3 34h-6z" fill="#8a5a3a" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <Flame color={color} y={38} size={1.15} />
      <path d="M32 46h36l-5 14H37z" fill="#57534f" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M41 46v14M50 46v14M59 46v14" stroke="#2b2826" strokeWidth="2" opacity="0.6" />
    </g>
  );
}

function Lighthouse({ color }) {
  return (
    <g>
      <path d="M36 88 41 40h18l5 48z" fill="#fff" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M39.5 56h21l1.4 13H38.1zM37.3 78h25.4l1 10H36.3z" fill="#e8615a" />
      <path d="M36 88 41 40h18l5 48z" fill="none" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <rect x="36" y="35" width="28" height="6" rx="2" fill="#57534f" stroke={INK} strokeWidth="2" />
      <rect x="41" y="20" width="18" height="15" rx="2" fill={beamColorVar(color)} stroke={INK} strokeWidth="2.2" />
      <path d="M38 20q12-14 24 0z" fill="#e8615a" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
    </g>
  );
}

function Campfire({ color }) {
  return (
    <g>
      {[24, 38, 62, 76].map((x) => (
        <ellipse key={x} cx={x} cy={x === 24 || x === 76 ? 80 : 86} rx="7" ry="5" fill="#a9a39a" stroke={INK} strokeWidth="1.8" />
      ))}
      <Flame color={color} y={52} size={1.35} />
      <path d="M26 82 70 66l3 8-44 16z" fill="#8a5a3a" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M74 82 30 66l-3 8 44 16z" fill="#9c6a44" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
}

/* What a sleeping Lumi rests on. */

const Books = () => (
  <g>
    <rect x="24" y="78" width="52" height="11" rx="3" fill="#2f5f73" stroke={INK} strokeWidth="2" />
    <rect x="29" y="68" width="42" height="11" rx="3" fill="#b5503f" stroke={INK} strokeWidth="2" />
    <path d="M36 68v11M34 78v11" stroke="#f0c14e" strokeWidth="2.5" />
  </g>
);
const Lily = () => (
  <g>
    {[-34, -17, 0, 17, 34].map((turn) => (
      <path
        key={turn}
        d="M50 92q-11-12 0-26 11 14 0 26z"
        transform={`rotate(${turn * 1.7} 50 84)`}
        fill={turn % 2 ? '#f8cdd5' : '#f3a9bd'}
        stroke="#c9728c"
        strokeWidth="1.6"
      />
    ))}
  </g>
);
const Cushion = () => (
  <g>
    <rect x="20" y="70" width="60" height="20" rx="10" fill="#c8504a" stroke={INK} strokeWidth="2" />
    <path d="M26 80h48" stroke="#f0c14e" strokeWidth="3" strokeLinecap="round" />
    <circle cx="20" cy="80" r="4" fill="#f0c14e" stroke={INK} strokeWidth="1.5" />
    <circle cx="80" cy="80" r="4" fill="#f0c14e" stroke={INK} strokeWidth="1.5" />
  </g>
);
const SwimRing = () => (
  <g>
    <ellipse cx="50" cy="78" rx="34" ry="13" fill="#fff" stroke={INK} strokeWidth="2" />
    <path d="M18 74q4-8 14-9l2 12q-8 1-10 6zM82 74q-4-8-14-9l-2 12q8 1 10 6zM42 90l2-12h12l2 12q-8 2-16 0z" fill="#e8615a" />
    <ellipse cx="50" cy="78" rx="34" ry="13" fill="none" stroke={INK} strokeWidth="2" />
  </g>
);
const Stump = () => (
  <g>
    <path d="M20 78v8q0 8 30 8t30-8v-8z" fill="#8a5a3a" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <ellipse cx="50" cy="78" rx="30" ry="10" fill="#f0dcb4" stroke={INK} strokeWidth="2" />
    <ellipse cx="50" cy="78" rx="19" ry="6" fill="none" stroke="#c9a56c" strokeWidth="1.8" />
    <ellipse cx="50" cy="78" rx="9" ry="3" fill="none" stroke="#c9a56c" strokeWidth="1.8" />
  </g>
);

/**
 * Each scene: the board's colors (CSS variables set on the board) and its pictures. The mirror colors are picked to
 * stand out on that scene's tiles (never green mirrors on green lily pads).
 */
export const FLAT_SCENES = {
  library: {
    vars: {
      '--surface-board': '#7a4e36',
      '--surface-cell': '#efd3a6',
      '--surface-cell-alt': '#e3bf8b',
      '--plate-round': '18%',
      '--mirror-top': '#7fd0b0',
      '--mirror-bottom': '#2f8f6d',
      '--pivot-fill': 'rgba(47,143,109,0.22)',
    },
    Wall: Bookcase,
    Lamp: BankerLamp,
    Perch: Books,
  },
  pond: {
    vars: {
      '--surface-board': '#5aa9a0',
      '--surface-cell': '#a9d98f',
      '--surface-cell-alt': '#97cc7f',
      '--plate-round': '50%',
      '--mirror-top': '#ffffff',
      '--mirror-bottom': '#c9d3dc',
      '--pivot-fill': 'rgba(255,255,255,0.4)',
    },
    Wall: Logs,
    Lamp: Lantern,
    Perch: Lily,
  },
  castle: {
    vars: {
      '--surface-board': '#5d5853',
      '--surface-cell': '#d9d3ca',
      '--surface-cell-alt': '#c6bfb4',
      '--plate-round': '14%',
      '--mirror-top': '#f58f80',
      '--mirror-bottom': '#c9483f',
      '--pivot-fill': 'rgba(201,72,63,0.18)',
    },
    Wall: CastleWall,
    Lamp: Torch,
    Perch: Cushion,
  },
  beach: {
    vars: {
      '--surface-board': '#58b5ad',
      '--surface-cell': '#f6e4bb',
      '--surface-cell-alt': '#eed6a2',
      '--plate-round': '26%',
      '--mirror-top': '#6fd6c4',
      '--mirror-bottom': '#23877c',
      '--pivot-fill': 'rgba(35,135,124,0.2)',
    },
    Wall: BeachHut,
    Lamp: Lighthouse,
    Perch: SwimRing,
  },
  forest: {
    vars: {
      '--surface-board': '#4a7d55',
      '--surface-cell': '#bfe0a2',
      '--surface-cell-alt': '#aad38c',
      '--plate-round': '30%',
      '--mirror-top': '#fffdf6',
      '--mirror-bottom': '#dcd0b8',
      '--pivot-fill': 'rgba(255,253,246,0.45)',
    },
    Wall: Trees,
    Lamp: Campfire,
    Perch: Stump,
  },
};
