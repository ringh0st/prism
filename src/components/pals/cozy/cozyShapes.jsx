/*
 * The shape library for the cozy Pals (designer spec): 12 heads and 9 bodies/poses, all built around the same
 * anchors so every outfit fits every Pal: head top y24–27 at x50, eyes (39,50) and (61,50), chin/neck y≈70,
 * the holding paw at x63–80 y76–82, the floor at y94. Each Pal picks one head and one body.
 */

/** A darker (amount > 0) or lighter (amount < 0) shade of a hex color. */
export function shade(hex, amount = 0.36) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (v) => Math.round(amount >= 0 ? v * (1 - amount) : v + (255 - v) * -amount);
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((v) => mix(v).toString(16).padStart(2, '0')).join('')}`;
}

export const INK = '#2b2118';
export const LINE = 2.4;
export const DETAIL = 1.4;

/** Fill and outline for one part: the outline is a darker shade of the part's own color. */
export const F = (color, line = null, width = LINE) => ({
  fill: color,
  stroke: line ?? shade(color),
  strokeWidth: width,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
});

/** A ring of bumps (cloud, wool, fuzz) drawn as one outlined shape. */
export function Scallops({ cx, cy, rx, ry, n, r, color, line, inner = true }) {
  const dots = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
  return (
    <g>
      {dots.map(([x, y], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={r} {...F(color, line)} />
      ))}
      {dots.map(([x, y], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={r - LINE / 2} fill={color} />
      ))}
      {inner && <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} />}
    </g>
  );
}

/* ---------- heads ---------- */

export const HEADS = {
  round: 'M50 25C65 25 77 35 77 48S65 71 50 71 23 61 23 48 35 25 50 25Z',
  mochi: 'M36 26H64C77 26 85 40 85 54 85 64 78 70 66 70H34C22 70 15 64 15 54 15 40 23 26 36 26Z',
  onigiri: 'M50 25C56 25 60 29 64 35L78 56C82 64 78 70 70 70H30C22 70 18 64 22 56L36 35C40 29 44 25 50 25Z',
  jowl: 'M50 26C62 26 70 32 72 40 80 46 84 54 82 61 80 68 70 72 50 72S20 68 18 61C16 54 20 46 28 40 30 32 38 26 50 26Z',
  ruff: 'M50 25C66 25 76 35 77 46L86 51 78 55 85 62 74 64C68 70 60 72 50 72S32 70 26 64L15 62 22 55 14 51 23 46C24 35 34 25 50 25Z',
  bell: 'M50 24C67 24 77 37 77 52L79 66C79 69 77 70 74 70H26C23 70 21 69 21 66L23 52C23 37 33 24 50 24Z',
  egg: 'M50 24C61 24 71 36 74 50 76 62 66 71 50 71S24 62 26 50C29 36 39 24 50 24Z',
  bean: 'M50 27C72 27 88 36 88 49S72 70 50 70 12 62 12 49 28 27 50 27Z',
  heart: 'M50 30C54 24 62 22 69 25 78 29 80 40 77 50 74 60 62 69 50 73 38 69 26 60 23 50 20 40 22 29 31 25 38 22 46 24 50 30Z',
  gem: 'M50 23L68 28 78 42 76 60 64 70H36L24 60 22 42 32 28Z',
  star: 'M50 13L60 36 85 38 66 54 72 79 50 66 28 79 34 54 15 38 40 36Z',
};

/** The head shape a Pal uses, with a soft cel shadow at the lower right and a highlight at the top left. */
export function Head({ shape, color, line, id }) {
  if (shape === 'cloud') {
    return (
      <g>
        <Scallops cx={50} cy={48} rx={25} ry={19} n={10} r={9.5} color={color} line={line} />
        <ellipse cx="41" cy="33" rx="8" ry="3.4" fill="#fff" opacity=".6" transform="rotate(-14 41 33)" />
      </g>
    );
  }
  const d = HEADS[shape] ?? HEADS.round;
  const clip = `cz-${id}-${shape}`;
  return (
    <g>
      <clipPath id={clip}>
        <path d={d} />
      </clipPath>
      <path d={d} {...F(color, line)} />
      <g clipPath={`url(#${clip})`}>
        <ellipse cx="66" cy="68" rx="34" ry="16" fill={shade(color, 0.08)} />
      </g>
      <path d="M33 37c3-6 9-9 15-9-6 3-10 6-12 10z" fill="#fff" opacity=".55" />
      {shape === 'gem' && <path d="M32 28l18 8 18-8M50 36v34M22 42l28-6 28 6" fill="none" stroke="#fff" strokeWidth="1.2" opacity=".6" />}
    </g>
  );
}

/* ---------- bodies / poses ---------- */
// Each body: its outline, its belly patch, where its paws are (the right one holds things) and its feet.

export const BODIES = {
  sit: {
    d: 'M32 88C30 76 38 67 50 67S70 76 68 88C67 93 64 94 60 94H40C36 94 33 93 32 88Z',
    belly: [50, 83, 11, 9],
    paws: [
      [36, 80],
      [64, 80],
    ],
    feet: [
      [40, 92],
      [60, 92],
    ],
  },
  loaf: {
    d: 'M12 88C12 78 26 70 50 70S88 78 88 88C88 92 85 94 80 94H20C15 94 12 92 12 88Z',
    paws: [
      [36, 91, 'flat'],
      [62, 91, 'flat'],
    ],
    feet: [],
  },
  egg: {
    d: 'M50 44C70 44 83 62 83 78 83 90 74 94 66 94H34C26 94 17 90 17 78 17 62 30 44 50 44Z',
    belly: [50, 80, 17, 12],
    paws: [
      [27, 76, 'wing'],
      [73, 76, 'wing'],
    ],
    feet: [
      [41, 93, 'small'],
      [59, 93, 'small'],
    ],
    merge: true,
  },
  pear: {
    d: 'M38 67C29 71 21 79 18 87 16 93 20 94 26 94H74C80 94 84 93 82 87 79 79 71 71 62 67Z',
    belly: [50, 84, 16, 9],
    paws: [
      [27, 80],
      [70, 79],
    ],
    feet: [
      [36, 93],
      [64, 93],
    ],
  },
  puddle: {
    d: 'M6 88C6 78 26 72 50 72S94 78 94 88C94 92 91 94 87 94H13C9 94 6 92 6 88Z',
    paws: [
      [36, 90, 'flat'],
      [62, 90, 'flat'],
    ],
    feet: [],
  },
  stand: {
    d: 'M40 67C34 70 34 80 37 86H63C66 80 66 70 60 67Z',
    belly: [50, 77, 8, 7],
    paws: [
      [34, 76],
      [67, 78],
    ],
    legs: true,
    feet: [
      [43, 93],
      [57, 93],
    ],
  },
  sphinx: {
    d: 'M22 90C20 78 30 70 50 70 66 70 76 74 84 80 92 86 92 94 84 94H26C23 94 22 92 22 90Z',
    belly: [46, 86, 14, 5],
    paws: [
      [34, 91, 'long'],
      [58, 91, 'long'],
    ],
    feet: [],
    haunch: true,
  },
  coil: {
    d: 'M34 90C32 78 40 69 50 69S66 78 66 88C66 92 64 94 60 94H40C36 94 34 92 34 90Z',
    belly: [50, 84, 9, 8],
    paws: [
      [38, 82],
      [64, 80],
    ],
    feet: [],
  },
  hover: {
    d: 'M33 79C31 71 39 67 50 67S69 71 67 79C65 85 58 87 54 90 52 92 50 92 49 90 45 88 35 85 33 79Z',
    belly: [50, 77, 9, 6],
    paws: [
      [35, 78],
      [66, 78],
    ],
    feet: [],
  },
};

/** One paw: round, flat on the floor, a long forearm, a stubby wing, or a small bird foot. */
export function Paw({ x, y, kind, color, line }) {
  if (kind === 'flat') return <ellipse cx={x} cy={y} rx="8" ry="3.6" {...F(color, line)} />;
  if (kind === 'long') return <ellipse cx={x} cy={y} rx="11" ry="3.8" {...F(color, line)} />;
  if (kind === 'wing')
    return (
      <path
        d={`M${x} ${y - 9}c${x < 50 ? -7 : 7} 3 ${x < 50 ? -9 : 9} 10 ${x < 50 ? -6 : 6} 16 ${x < 50 ? 4 : -4}-2 ${x < 50 ? 6 : -6}-8 ${x < 50 ? 6 : -6}-16z`}
        {...F(color, line)}
      />
    );
  if (kind === 'small') return <path d={`M${x - 5} ${y}h10l-2-3h-6z`} {...F(color, line, 1.6)} />;
  return <ellipse cx={x} cy={y} rx="5.4" ry="5" {...F(color, line)} />;
}
