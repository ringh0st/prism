import { BODIES, DETAIL, F, Head, INK, Paw, Scallops, StickerDefs, paint, shade } from './cozyShapes.jsx';

/* ---------- small building blocks ---------- */

// Grows a part around its own pivot: the signature feature starts as a seed in Baby and is at its grandest in Master.
const grow = (s, [px, py], node) => <g transform={`translate(${px} ${py}) scale(${s}) translate(${-px} ${-py})`}>{node}</g>;
const both = (node) => (
  <g>
    {node}
    <g transform="translate(100 0) scale(-1 1)">{node}</g>
  </g>
);
const dots = (color, list) => (
  <g fill={color}>
    {list.map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} />
    ))}
  </g>
);
const stroke = (color, w = DETAIL) => ({ fill: 'none', stroke: color, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' });

const ears = {
  fox: (c, s = 1) =>
    both(
      <g>
        {grow(s, [33, 32], <path d="M24 42 25 12 44 30Z" {...F(c)} />)}
        <path d="M29 34 30 20 38 29Z" fill="#fff" opacity=".55" />
      </g>,
    ),
  tallFox: (c) =>
    both(
      <g>
        <path d="M26 40 22 4 45 30Z" {...F(c)} />
        <path d="M29 32 27 14 39 29Z" fill="#fff" opacity=".5" />
      </g>,
    ),
  cat: (c, inner) =>
    both(
      <g>
        <path d="M24 40 26 16 45 29Z" {...F(c)} />
        <path d="M29 32 30 22 38 28Z" fill={inner} />
      </g>,
    ),
  corner: (c, inner) =>
    both(
      <g>
        <path d="M17 36 18 20 32 27Z" {...F(c)} />
        <path d="M20 30 21 24 27 27Z" fill={inner} />
      </g>,
    ),
  bear: (c, inner, x = 24, y = 30, r = 9) =>
    both(
      <g>
        <circle cx={x} cy={y} r={r} {...F(c)} />
        <circle cx={x + 1} cy={y + 1} r={r * 0.5} fill={inner} />
      </g>,
    ),
  disc: (c, inner) =>
    both(
      <g>
        <circle cx="20" cy="28" r="15" {...F(c)} />
        <circle cx="21" cy="29" r="9.5" fill={inner} />
      </g>,
    ),
  tufts: (c) => both(<path d="M27 34C22 26 21 16 24 8 29 14 36 20 42 26Z" {...F(c)} />),
  pig: (c, inner) =>
    both(
      <g>
        <path d="M18 30 22 14 36 26Z" {...F(c)} />
        <path d="M22 26 24 19 30 25Z" fill={inner} />
      </g>,
    ),
};

const fluffTail = (base, tip, s, d = 'M60 90C80 93 94 78 92 58 91 46 86 38 80 33 82 46 79 58 71 66 67 70 63 76 61 82Z') =>
  grow(
    s,
    [62, 90],
    <g>
      <path d={d} {...F(base)} />
      <path d="M80 33C86 38 91 46 92 56 88 52 82 50 79 46 81 42 81 38 80 33Z" {...F(tip)} />
    </g>,
  );
const ringTail = (base, ring, s, flip = false) =>
  grow(
    s,
    [flip ? 36 : 64, 88],
    <g transform={flip ? 'translate(100 0) scale(-1 1)' : undefined}>
      <path d="M62 90C76 94 92 86 92 70 92 58 86 48 78 44 80 56 78 66 70 74 66 78 63 82 62 86Z" {...F(base)} />
      <path d="M80 50 90 56M84 62 92 66M82 74 90 80M74 82 80 88" {...stroke(ring, 4.6)} />
    </g>,
  );

/* ---------- the 48 Pals ---------- */
// head / body from the shape library; c = colors; back/front = signature parts (given the growth s);
// champ adds a second trait, master a pattern upgrade; rarity cues: legendary gold trim, mythic element bits.

const GOLD = '#f0c14e';

export const ROSTER = {
  ember: {
    head: 'onigiri',
    body: 'sit',
    c: ['#f5a06a', '#fff1e2', '#fff8ef'],
    mouth: 'w',
    back: (s) => (
      <g>
        {fluffTail('#f5a06a', '#fff8ef', s)}
        {ears.fox('#f5a06a')}
      </g>
    ),
    master: (
      <g fill="#a65a36">
        <ellipse cx="36" cy="80" rx="5.4" ry="5" />
        <ellipse cx="64" cy="80" rx="5.4" ry="5" />
      </g>
    ),
  },
  mossy: {
    head: 'egg',
    body: 'puddle',
    c: ['#b9e09e', '#fff1c4', '#7cbf8c'],
    mouth: 'flat',
    back: (s) =>
      grow(
        0.75 + s * 0.25,
        [50, 92],
        <g>
          <path d="M4 90C2 60 22 38 50 38S98 60 96 90Z" {...F('#7cbf8c')} />
          <path d="M20 66l10-8 12 3 8-10 8 10 12-3 10 8M12 82l12-6 14 4 12-4 12 4 14-4 12 6" {...stroke('#5d9e6c', 1.6)} />
        </g>,
      ),
    top: (
      <g>
        <path d="M50 26v-6" {...stroke('#5d9e6c', 2.2)} />
        <path d="M50 21c-4-5-9-5-11-2 3 3 7 4 11 2zM50 21c4-6 9-6 11-3-3 4-7 5-11 3z" {...F('#a8de8e')} />
      </g>
    ),
    champ: <path d="M10 88c-4-6-2-12 2-14 2 5 4 9 4 14zM90 88c4-6 2-12-2-14-2 5-4 9-4 14z" {...F('#a8de8e')} />,
    master: dots('#a8de8e', [
      [24, 56, 2.4],
      [76, 56, 2.4],
      [16, 74, 2],
      [84, 74, 2],
    ]),
  },
  coral: {
    head: 'bean',
    body: 'puddle',
    c: ['#f9c1ca', '#ffe4e8', '#f08aa0'],
    mouth: 'open',
    back: (s) =>
      both(
        grow(
          s,
          [16, 48],
          <g {...F('#f08aa0')}>
            <path d="M16 42C8 34 2 32 1 36 5 38 9 41 13 45Z" />
            <path d="M13 50C4 48 0 51 1 54 5 53 9 53 13 54Z" />
            <path d="M15 57C8 61 6 66 8 68 11 65 14 62 17 61Z" />
          </g>,
        ),
      ),
    champ: <path d="M84 80c6-6 12-4 12 2-4 0-7 2-8 6z" {...F('#f08aa0')} />,
    master: dots('#f08aa0', [
      [30, 84, 1.6],
      [70, 84, 1.6],
      [40, 88, 1.2],
      [60, 88, 1.2],
    ]),
  },
  mochi: {
    head: 'ruff',
    body: 'sit',
    c: ['#fbd6bc', '#fff4ea', '#f6b0a2'],
    muzzle: true,
    mouth: 'w',
    whiskers: true,
    nose: 'pink',
    back: (s) => (
      <g>
        {ears.cat('#fbd6bc', '#f6b0a2')}
        {grow(
          s,
          [66, 88],
          <g>
            <path d="M66 88C78 92 88 84 88 72 88 63 81 59 76 63 72 66 74 71 79 69" {...stroke('#c27a52', 10)} />
            <path d="M66 88C78 92 88 84 88 72 88 63 81 59 76 63 72 66 74 71 79 69" {...stroke('#f8cbab', 7)} />
          </g>,
        )}
      </g>
    ),
    top: <path d="M50 28A5.6 5.6 0 1 0 55.4 36 4.4 4.4 0 1 1 50 28Z" {...F('#f3c552', '#d9a12e')} />,
    champ: <path d="M58 79l6 3-2 6z" {...F('#f3c552', '#d9a12e')} />,
    master: <path d="M44 34l6-8 6 8" {...stroke('#f3c552', 1.6)} />,
  },
  hoot: {
    head: 'heart',
    body: 'egg',
    c: ['#c49a76', '#f3dfc2', '#f6b26b'],
    nose: 'beak',
    mouth: 'none',
    eyes: 'big',
    back: (s) => grow(Math.min(s, 1), [50, 30], ears.tufts('#c49a76')),
    face: <path d="M50 34c7-7 21-6 22 6 1 11-9 19-22 22-13-3-23-11-22-22 1-12 15-13 22-6z" fill="#f3dfc2" />,
    champ: <path d="M40 80l4 3 4-3 4 3 4-3 4 3M42 86l4 2 4-2 4 2 4-2" {...stroke('#d9bf9c', 1.6)} />,
    master: dots('#a87d5b', [
      [30, 70, 1.6],
      [70, 70, 1.6],
      [26, 82, 1.4],
      [74, 82, 1.4],
    ]),
  },
  waffles: {
    head: 'round',
    body: 'sit',
    c: ['#f0cb96', '#fff3e0', '#c99460'],
    muzzleBun: true,
    nose: 'big',
    back: () => null,
    front: (s) =>
      both(
        grow(0.6 + s * 0.4, [24, 36], <path d="M28 32C18 30 12 40 13 54 14 68 18 80 24 82 30 80 32 66 32 52 32 42 31 36 28 32Z" {...F('#c99460')} />),
      ),
    champ: <path d="M66 88c10 2 18-4 18-12" {...stroke(shade('#f0cb96'), 6)} />,
    master: <ellipse cx="62" cy="40" rx="7" ry="5" fill="#e3b47c" opacity=".8" />,
  },
  peep: {
    head: 'round',
    body: 'egg',
    c: ['#fde488', '#fff3c0', '#f6b26b'],
    nose: 'beak',
    mouth: 'none',
    eyes: 'happy',
    top: <path d="M50 27C46 22 46 15 51 12 50 17 53 20 57 20 56 24 54 26 50 27Z" {...F('#f8cd52')} />,
    front: (s) =>
      grow(
        1.15 - s * 0.35,
        [50, 94],
        <path
          d="M16 80L24 73 31 80 39 73 46 80 54 73 61 80 69 73 76 80 84 74C86 86 80 94 70 94H30C20 94 14 86 16 80Z"
          {...F('#fffaf0', '#d8c3a0')}
        />,
      ),
    champ: <path d="M56 22c4-2 8 0 8 4-3-1-5 0-6 2z" {...F('#f8cd52')} />,
  },
  bruno: {
    head: 'jowl',
    body: 'pear',
    c: ['#c6966e', '#f1dcc4', '#8f6448'],
    muzzle: true,
    nose: 'big',
    back: () => ears.bear('#c6966e', '#f1dcc4', 24, 28, 9.5),
    champ: <path d="M44 82c2-3 5-3 6 0 1-3 4-3 6 0-1 4-4 6-6 7-2-1-5-3-6-7z" fill="#e8b4a0" />,
    master: <path d="M30 70c4 4 8 5 12 5M70 70c-4 4-8 5-12 5" {...stroke('#a87b58', 2)} />,
  },
  biscuit: {
    head: 'round',
    body: 'loaf',
    c: ['#f4e3d0', '#ffffff', '#f6c2c2'],
    mouth: 'w',
    back: (s) => (
      <g>
        {grow(
          s,
          [38, 28],
          <g>
            <ellipse cx="38" cy="12" rx="6.6" ry="16" transform="rotate(-6 38 12)" {...F('#f4e3d0')} />
            <ellipse cx="38" cy="13" rx="3" ry="10" transform="rotate(-6 38 13)" fill="#f6c2c2" />
          </g>,
        )}
        {grow(
          s,
          [62, 28],
          <g>
            <path d="M58 30C62 20 74 18 86 26 90 30 86 36 80 36 72 34 66 32 60 34Z" {...F('#f4e3d0')} />
            <path d="M66 28C72 24 80 25 84 29" {...stroke('#f6c2c2', 3)} />
          </g>,
        )}
        <circle cx="88" cy="82" r="7" {...F('#ffffff', '#d8c8bb')} />
      </g>
    ),
    champ: <path d="M14 90c-4-4-2-9 2-10" {...stroke('#9fd98a', 3)} />,
  },
  truffle: {
    head: 'mochi',
    body: 'pear',
    c: ['#f8c3cb', '#ffe3e7', '#ef97a8'],
    nose: 'snout',
    mouth: 'small',
    back: () => ears.pig('#f8c3cb', '#ef97a8'),
    front: (s) => grow(s, [80, 86], <path d="M80 86c6 0 8-4 6-6-2-2-5 0-3 2 2 2 6 0 7-3 1-2 3-3 5-2" {...stroke(shade('#f8c3cb'), 2.4)} />),
    champ: dots('#f2a8b6', [
      [32, 76, 2.4],
      [68, 78, 2],
    ]),
  },
  pebble: {
    head: 'onigiri',
    body: 'egg',
    c: ['#f6e1c4', '#fff4e2', '#a87850'],
    mouth: 'w',
    back: (s) =>
      grow(
        0.7 + 0.3 * s,
        [50, 60],
        <path
          d="M12 80 2 72 12 66 4 56 16 52 10 40 24 40 22 26 34 32 38 18 48 28 56 16 62 30 74 22 74 36 88 34 84 46 96 52 86 60 96 70 86 74 92 86Z"
          {...F('#a87850')}
        />,
      ),
    face: <ellipse cx="50" cy="54" rx="20" ry="15" fill="#fff4e2" />,
    champ: <path d="M72 30c3-4 8-4 10 0-4 0-6 2-7 5z" {...F('#9fd98a')} />,
    master: dots('#c49668', [
      [22, 50, 2],
      [78, 50, 2],
      [18, 64, 1.6],
      [82, 64, 1.6],
    ]),
  },
  quartz: {
    head: 'gem',
    body: 'hover',
    c: ['#f7dd92', '#fff3cf', '#e6b84e'],
    mouth: 'small',
    eyes: 'sparkle',
    back: (s) =>
      both(
        grow(
          s,
          [28, 34],
          <g {...F('#f7dd92', '#d4a640')}>
            <path d="M18 40 14 20 22 10 28 22 28 38Z" />
            <path d="M28 36 30 16 36 22 36 34Z" />
          </g>,
        ),
      ),
    champ: both(<path d="M10 70l-4-6 3-6 4 5z" {...F('#fde9b0', '#d4a640')} />),
    master: <path d="M36 74l6 6M58 74l-6 6M50 70v8" {...stroke('#fff', 1.4)} />,
  },
  ribbit: {
    head: 'bean',
    body: 'puddle',
    c: ['#b4dd96', '#ecf8dc', '#86c26a'],
    mouth: 'wide',
    eyes: 'happy',
    back: () => both(<circle cx="35" cy="30" r="10" {...F('#b4dd96')} />),
    front: (s) => both(grow(s, [20, 92], <path d="M24 92 6 92C4 88 8 86 10 88 9 84 14 84 15 87 16 83 21 84 21 88Z" {...F('#9fd083')} />)),
    face: dots('#9fd083', [
      [24, 44, 2],
      [77, 42, 2.4],
      [70, 60, 1.4],
    ]),
    champ: <path d="M30 22c3-4 8-4 10 0" {...stroke('#86c26a', 2)} />,
  },
  cotton: {
    head: 'cloud',
    body: 'egg',
    c: ['#fffaf2', '#f4dfca', '#c49668'],
    line: '#cdb39a',
    mouth: 'w',
    face: <ellipse cx="50" cy="53" rx="17" ry="14" fill="#f4dfca" />,
    back: (s) => both(grow(s, [24, 50], <path d="M26 46c-8-2-12 4-10 9 2 5 9 5 10 0 1-3-2-5-4-3" {...stroke('#c49668', 3.2)} />)),
    bodyFluff: true,
    master: dots('#f6c2c2', [
      [36, 26, 2.4],
      [64, 26, 2.4],
    ]),
  },
  squeak: {
    head: 'onigiri',
    body: 'sit',
    c: ['#d8cec6', '#f4ece4', '#f4b8b8'],
    mouth: 'small',
    whiskers: true,
    back: (s) => grow(0.75 + 0.25 * s, [50, 40], ears.disc('#d8cec6', '#f4b8b8')),
    front: (s) => grow(s, [66, 90], <path d="M66 90c12 2 20-2 20-10 0-5-5-6-7-3" {...stroke('#f2b6b6', 2.4)} />),
    champ: <ellipse cx="50" cy="83" rx="7" ry="5" fill="#fff" opacity=".6" />,
  },
  maple: {
    head: 'ruff',
    body: 'stand',
    c: ['#e9a07a', '#fff4e6', '#8a5a44'],
    muzzle: true,
    mouth: 'open',
    back: (s) => (
      <g>
        {ringTail('#e9a07a', '#c06e50', s, true)}
        {ears.cat('#e9a07a', '#fff4e6')}
      </g>
    ),
    leftPaw: [28, 64],
    limbs: '#8a5a44',
    face: <path d="M28 44c4-3 8-3 10 0M62 44c2-3 6-3 10 0" {...stroke('#fff4e6', 3)} />,
  },
  otto: {
    head: 'bean',
    body: 'stand',
    c: ['#c49d80', '#f2e2d2', '#8e6a52'],
    muzzle: true,
    whiskers: true,
    mouth: 'w',
    back: (s) => grow(s, [60, 90], <path d="M60 92C74 94 90 90 94 80 96 74 92 72 88 76 82 82 72 86 62 86Z" {...F('#c49d80')} />),
    front: () => <ellipse cx="68" cy="73" rx="6" ry="4.4" {...F('#cfd6d2')} />,
    master: dots('#a8846a', [
      [30, 40, 1.4],
      [70, 40, 1.4],
    ]),
  },
  buzz: {
    head: 'round',
    body: 'hover',
    c: ['#fcd96f', '#fff2bd', '#7a5a44'],
    mouth: 'w',
    fuzzy: true,
    top: both(
      <g>
        <path d="M42 27C40 18 36 13 32 11" {...stroke('#7a5a44', 2.2)} />
        <circle cx="31.6" cy="10.6" r="3.2" fill="#7a5a44" />
      </g>,
    ),
    back: (s) => both(grow(s, [28, 62], <ellipse cx="16" cy="58" rx="12" ry="9" transform="rotate(-25 16 58)" {...F('#ffffff', '#cfdde0')} />)),
    bodyMarks: <path d="M35 76h30M38 83h24" {...stroke('#7a5a44', 4)} />,
    champ: both(<ellipse cx="18" cy="74" rx="7" ry="5" transform="rotate(20 18 74)" {...F('#ffffff', '#cfdde0')} />),
  },
  kiko: {
    head: 'jowl',
    body: 'sit',
    c: ['#c9c3c0', '#f2eeec', '#f4c9cb'],
    nose: 'bigBean',
    mouth: 'small',
    back: (s) => (
      <g>
        <path d="M12 94V30" {...stroke('#a8825e', 6)} />
        <path d="M12 46c6-4 10-2 10 2-4 0-7 1-10 3z" {...F('#9fd98a')} />
        {grow(
          0.8 + 0.2 * s,
          [50, 40],
          both(
            <g>
              <circle cx="20" cy="34" r="14" {...F('#c9c3c0')} />
              <path d="M10 26l-3-3M8 34H4M10 42l-3 3" {...stroke('#c9c3c0', 3)} />
              <circle cx="21" cy="35" r="8" fill="#f4c9cb" />
            </g>,
          ),
        )}
      </g>
    ),
    leftPaw: [18, 70],
    champ: <path d="M12 60c6-4 10-2 10 2-4 0-7 1-10 3z" {...F('#9fd98a')} />,
  },
  splash: {
    head: 'egg',
    body: 'coil',
    c: ['#d9d1ca', '#f4efea', '#b9aea5'],
    whiskers: true,
    mouth: 'w',
    flippers: true,
    back: (s) =>
      grow(
        s,
        [64, 90],
        <g {...F('#d9d1ca')}>
          <path d="M60 92C76 94 86 88 88 76 84 70 92 62 96 64 96 70 94 74 90 76 94 78 96 82 94 86 90 84 88 80 88 78" />
        </g>,
      ),
    face: dots('#bfb4ab', [
      [34, 36, 2.2],
      [64, 32, 1.8],
      [70, 39, 1.4],
    ]),
  },
  shroomy: {
    head: 'egg',
    body: 'sit',
    c: ['#fff0dc', '#ffffff', '#f2a093'],
    mouth: 'small',
    narrow: true,
    top: (s) =>
      grow(
        0.85 + 0.15 * s,
        [50, 44],
        <g>
          <path d="M7 44C7 22 26 10 50 10S93 22 93 44C93 48 89 49 84 48 74 46 62 45 50 45S26 46 16 48C11 49 7 48 7 44Z" {...F('#f2a093')} />
          {dots('#fff6ee', [
            [32, 24, 5],
            [56, 18, 5.6],
            [76, 30, 4],
            [20, 36, 3],
          ])}
        </g>,
      ),
    champ: both(<path d="M30 92c-6-2-10-6-10-10 5 0 9 4 10 10z" {...F('#9fd98a')} />),
  },
  bandit: {
    head: 'ruff',
    body: 'sit',
    c: ['#c4bdb7', '#f1ece6', '#5e5552'],
    muzzle: true,
    mouth: 'w',
    back: (s) => (
      <g>
        {ringTail('#c4bdb7', '#5e5552', s)}
        {ears.cat('#c4bdb7', '#f1ece6')}
      </g>
    ),
    face: <path d="M22 50c4-9 14-10 28-5 14-5 24-4 28 5-5 6-15 8-28 4-13 4-23 2-28-4z" fill="#5e5552" />,
  },
  waddles: {
    head: 'bell',
    body: 'egg',
    c: ['#5f5a66', '#fff4e6', '#f6b26b'],
    nose: 'beak',
    mouth: 'none',
    flipperWings: true,
    face: <path d="M50 38c8-7 21-3 23 9 2 12-9 20-23 21-14-1-25-9-23-21 2-12 15-16 23-9z" fill="#fff4e6" />,
    feetColor: '#f6b26b',
    bigFeet: true,
    master: <path d="M50 22c-2-3 0-6 3-6-1 2 0 4 2 4-1 2-3 3-5 2z" {...F('#f8cd52')} />,
  },
  fawn: {
    head: 'heart',
    body: 'stand',
    c: ['#e0b089', '#fff4e6', '#a8734a'],
    mouth: 'small',
    muzzle: true,
    back: (s) => (
      <g>
        {both(<ellipse cx="13" cy="46" rx="11" ry="5.6" transform="rotate(-12 13 46)" {...F('#e0b089')} />)}
        {grow(s, [50, 28], both(<path d="M38 28c-2-6-4-9-7-11M33 20c0-3 1-5 3-6" {...stroke('#a8734a', 3.2)} />))}
      </g>
    ),
    bodyMarks: dots('#fff4e6', [
      [42, 72, 1.6],
      [58, 72, 1.6],
      [46, 78, 1.2],
      [56, 80, 1.2],
    ]),
    face: dots('#fff4e6', [
      [30, 40, 1.6],
      [70, 40, 1.6],
    ]),
    fourLegs: true,
  },
  shelly: {
    head: 'egg',
    body: 'puddle',
    c: ['#cde6a6', '#eaf6d6', '#f2b48a'],
    mouth: 'w',
    back: (s) =>
      grow(
        s,
        [76, 70],
        <g>
          <circle cx="76" cy="62" r="24" {...F('#f2b48a')} />
          <path d="M76 62m-4 0a4 4 0 1 1 8 0 8 8 0 1 1-16 0 12 12 0 1 1 24 0 16 16 0 1 1-32 0" {...stroke('#d48f68', 2)} />
        </g>,
      ),
    top: both(
      <g>
        <path d="M42 28c-2-8-4-12-6-15" {...stroke('#a8cf86', 2.4)} />
        <circle cx="35.6" cy="12.4" r="3.4" fill="#a8cf86" />
      </g>,
    ),
    champ: <path d="M88 44c3-4 8-4 9 0-3 0-6 1-7 4z" {...F('#9fd98a')} />,
  },
  inky: {
    head: 'bell',
    body: 'none',
    c: ['#f6a9b6', '#ffe0e6', '#e98a9e'],
    mouth: 'open',
    back: (s) =>
      grow(
        0.8 + 0.2 * s,
        [50, 70],
        <g {...F('#f6a9b6')}>
          <path d="M22 66C20 78 14 86 6 88 10 92 18 90 22 86 22 92 28 94 32 90 34 94 40 94 42 90 44 94 48 94 50 90 52 94 56 94 58 90 60 94 66 94 68 90 72 94 78 92 78 86 82 90 90 92 94 88 86 86 80 78 78 66Z" />
          <path d="M8 88C2 84 2 76 8 74M92 88C98 84 98 76 92 74" {...stroke(shade('#f6a9b6'), 3)} />
        </g>,
      ),
    face: dots('#ffd3dc', [
      [36, 32, 2],
      [64, 30, 2.6],
      [70, 38, 1.4],
    ]),
  },
  puff: {
    head: 'cloud',
    body: 'hover',
    c: ['#fbfefd', '#eefaf6', '#9fdccc'],
    line: '#9fc9bf',
    mouth: 'wide',
    blush: '#9fdccc',
    front: (s) =>
      grow(
        s,
        [50, 92],
        <g fill="#9fdccc">
          {[
            [38, 92],
            [50, 96],
            [62, 92],
          ].map(([x, y]) => (
            <path key={x} d={`M${x} ${y - 6}c2 3 3 4 3 6a3 3 0 0 1-6 0c0-2 1-3 3-6z`} />
          ))}
        </g>,
      ),
  },
  twinkle: {
    head: 'star',
    body: 'none',
    c: ['#fde282', '#fff3c0', '#f2c24e'],
    mouth: 'w',
    back: (s) => grow(s, [50, 54], both(<path d="M10 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fde282" />)),
  },
  starla: {
    head: 'round',
    body: 'stand',
    c: ['#fff5f1', '#ffffff', '#f6b8d2'],
    line: '#e2c4c8',
    mouth: 'w',
    top: (
      <g>
        <path d="M46 26 50 6 54 26Z" {...F('#f5cf6a')} />
        <path d="M47 20l6-2M48 14l4-1.4" {...stroke('#d8a840', 1.2)} />
      </g>
    ),
    back: (s) =>
      grow(
        s,
        [64, 30],
        <path d="M58 26C70 20 84 26 86 40 88 50 84 58 80 62 80 54 76 48 72 46 74 52 72 58 68 62 68 50 64 40 56 34Z" {...F('#f6b8d2')} />,
      ),
    raisedHoof: true,
    champ: <path d="M66 92c10 2 16-4 16-10 0-4-4-6-6-3" {...stroke('#f6b8d2', 5)} />,
  },
  ziggy: {
    head: 'onigiri',
    body: 'pear',
    c: ['#f6b28a', '#fff0d8', '#d98a62'],
    snout: true,
    mouth: 'w',
    back: (s) => (
      <g>
        {grow(s, [50, 30], both(<path d="M36 30 30 14 42 26Z" {...F('#fde0a8')} />))}
        <path d="M78 64l6-4 0 7 6-2-2 7 6 0-5 6" {...F('#d98a62')} />
      </g>
    ),
    front: (s) => grow(s, [76, 90], <path d="M74 88c12 4 16 8 10 10-6 1-14-1-24-2" {...F('#f6b28a')} />),
    champ: both(<path d="M28 74C18 64 8 66 6 72c4-1 6 1 6 4 3-2 6-1 7 2 3-2 6-1 7 2z" {...F('#d98a62')} />),
  },
  leo: {
    head: 'ruff',
    body: 'sphinx',
    c: ['#f6c56a', '#fff0c8', '#d68a3e'],
    muzzle: true,
    mouth: 'w',
    rarity: 'legendary',
    back: (s) =>
      grow(
        0.55 + 0.45 * s,
        [50, 48],
        <g>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const x = 50 + Math.cos(a) * 34;
            const y = 48 + Math.sin(a) * 28;
            return <ellipse key={i} cx={x} cy={y} rx="9" ry="12" transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`} {...F('#e39a4a')} />;
          })}
        </g>,
      ),
    front: () => ears.bear('#f6c56a', '#fff0c8', 26, 30, 7),
    champ: <path d="M84 84c6-4 8-10 6-14" {...stroke('#d68a3e', 3)} />,
    master: both(<circle cx="17" cy="48" r="2.2" fill={GOLD} />),
  },
  koi: {
    head: 'egg',
    body: 'hover',
    c: ['#fff4ec', '#ffffff', '#f49a6c'],
    line: '#e8b8a0',
    mouth: 'open',
    rarity: 'legendary',
    back: (s) =>
      grow(
        s,
        [50, 86],
        <g {...F('#f9b590', '#e88e66')}>
          <path d="M46 86C34 90 22 98 16 92 14 86 26 82 34 80Z" />
          <path d="M54 86C66 90 78 98 84 92 86 86 74 82 66 80Z" />
          <path d="M26 64C14 60 8 66 10 72 16 70 22 70 28 72Z" />
          <path d="M74 64C86 60 92 66 90 72 84 70 78 70 72 72Z" />
        </g>,
      ),
    face: dots('#f49a6c', [
      [60, 34, 6],
      [36, 38, 3.4],
    ]),
    bodyMarks: dots('#f49a6c', [[42, 74, 3.4]]),
    top: <path d="M42 27c2-8 10-12 16-10-2 4-4 8-4 11z" {...F(GOLD)} />,
  },
  bamboo: {
    head: 'jowl',
    body: 'pear',
    c: ['#fbf8f3', '#ffffff', '#4a4245'],
    line: '#a69a94',
    mouth: 'small',
    rarity: 'legendary',
    back: () => (
      <g>
        {ears.bear('#4a4245', '#6a6064', 24, 28, 9)}
        <path d="M22 94V40" {...stroke('#8fcf7c', 5)} />
        <path d="M18 52h8M18 70h8" {...stroke('#6aab5a', 2)} />
        <path d="M22 44c4-6 10-6 12-2-4 0-8 1-12 4z" {...F('#9fd98a')} />
      </g>
    ),
    face: (
      <g fill="#4a4245">
        <ellipse cx="38" cy="51" rx="8" ry="9.6" transform="rotate(22 38 51)" />
        <ellipse cx="62" cy="51" rx="8" ry="9.6" transform="rotate(-22 62 51)" />
      </g>
    ),
    limbs: '#4a4245',
    leftPaw: [24, 74],
    master: <path d="M26 46h-6" {...stroke(GOLD, 3)} />,
  },
  aurora: {
    head: 'ruff',
    body: 'loaf',
    c: ['#f7f3ee', '#ffffff', '#9fdcc8'],
    line: '#c9bcb0',
    mouth: 'w',
    rarity: 'legendary',
    back: () => ears.fox('#f7f3ee'),
    front: (s) =>
      grow(
        s,
        [84, 88],
        <g>
          <path d="M86 86C90 96 60 100 30 96 22 94 20 90 26 88 44 90 66 90 80 82Z" {...F('#f7f3ee', '#c9bcb0')} />
          <path d="M30 96C22 94 20 90 26 88 30 90 34 92 36 95Z" fill="#9fdcc8" />
        </g>,
      ),
    top: <path d="M50 30v8M46.5 32l7 4M46.5 36l7-4" {...stroke('#58ac82', 1.6)} />,
    master: <path d="M44 30l6-4 6 4" {...stroke(GOLD, 1.6)} />,
  },
  storm: {
    head: 'mochi',
    body: 'puddle',
    c: ['#f6ad78', '#fff4e6', '#a8603e'],
    muzzle: true,
    mouth: 'w',
    rarity: 'legendary',
    back: (s) => (
      <g>
        {ears.bear('#f6ad78', '#fff4e6', 22, 30, 7)}
        {grow(s, [84, 86], <path d="M84 88C92 80 86 70 92 60 96 54 94 48 90 48 86 56 88 66 80 76Z" {...F('#f6ad78')} />)}
      </g>
    ),
    face: <path d="M50 28v6M44 29l1 5M56 29l-1 5M17 46h7M17 53h6M83 46h-7M83 53h-6" {...stroke('#b8693e', 2.4)} />,
    bigPaws: true,
    master: <path d="M88 52l4-2M90 60l4-1" {...stroke(GOLD, 2.4)} />,
  },
  plume: {
    head: 'egg',
    body: 'egg',
    c: ['#8cd3c2', '#dff5ee', '#f2c95a'],
    nose: 'beak',
    mouth: 'none',
    rarity: 'legendary',
    back: (s) =>
      grow(
        0.5 + 0.5 * s,
        [50, 82],
        <g>
          {Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI * (i / 8);
            const x = 50 - Math.cos(a) * 42;
            const y = 82 - Math.sin(a) * 40;
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx="9" ry="13" transform={`rotate(${(a * 180) / Math.PI - 90} ${x} ${y})`} {...F('#8cd3c2')} />
                <circle cx={x} cy={y} r="4" fill={GOLD} />
                <circle cx={x} cy={y} r="1.8" fill="#4f9a86" />
              </g>
            );
          })}
        </g>,
      ),
    top: <path d="M50 26c-3-6-1-12 3-14 0 5 2 7 4 8-1 3-4 5-7 6z" {...F(GOLD)} />,
  },
  nova: {
    head: 'bean',
    body: 'coil',
    c: ['#a8dccd', '#eaf8f4', '#f5d98a'],
    mouth: 'open',
    rarity: 'legendary',
    flippers: true,
    top: (s) =>
      grow(
        s,
        [58, 30],
        <g>
          <path d="M55 30 82 2 61 33Z" {...F('#f5e2a8', '#d4b062')} />
          <path d="M62 24l4 2M68 18l3 2M74 11l2 2" {...stroke('#d4b062', 1.2)} />
        </g>,
      ),
    back: (s) =>
      grow(
        s,
        [64, 90],
        <path d="M60 92C76 94 86 88 88 76 84 70 92 62 96 64 96 70 94 74 90 76 94 78 96 82 94 86 90 84 88 80 88 78" {...F('#a8dccd')} />,
      ),
    face: dots('#d2efe6', [
      [30, 42, 2],
      [72, 40, 2.4],
      [66, 34, 1.4],
    ]),
  },
  luna: {
    head: 'mochi',
    body: 'loaf',
    c: ['#ede8e2', '#ffffff', '#a89e96'],
    line: '#b8aca2',
    mouth: 'w',
    eyes: 'sleepy',
    rarity: 'legendary',
    back: (s) => (
      <g>
        {ears.bear('#ede8e2', '#e0d4ca', 22, 30, 7)}
        {grow(s, [84, 86], <path d="M80 88C96 84 98 60 88 46 80 36 66 40 68 50 70 56 78 54 78 50" {...stroke('#b8aca2', 12)} />)}
        {grow(s, [84, 86], <path d="M80 88C96 84 98 60 88 46 80 36 66 40 68 50 70 56 78 54 78 50" {...stroke('#ede8e2', 8)} />)}
      </g>
    ),
    face: dots('#b4aaa2', [
      [28, 40, 2.4],
      [72, 38, 2],
      [66, 32, 1.6],
    ]),
    bodyMarks: dots('#b4aaa2', [
      [24, 82, 2.2],
      [76, 80, 2],
      [64, 76, 1.6],
    ]),
  },
  sol: {
    head: 'egg',
    body: 'egg',
    c: ['#f9ac74', '#fde2a6', '#f6cd5a'],
    nose: 'beak',
    mouth: 'none',
    eyes: 'sparkle',
    rarity: 'mythic',
    element: '#f6cd5a',
    back: (s) => (
      <g>
        {grow(
          s,
          [50, 30],
          <path d="M50 28C40 20 42 8 46 2 48 10 52 12 54 10 56 4 62 2 64 6 60 10 62 16 66 18 62 24 56 28 50 28Z" {...F('#f6cd5a')} />,
        )}
        {grow(s, [50, 90], both(<path d="M30 90C18 92 6 86 4 76 10 80 16 80 20 78 14 74 12 68 14 62 18 70 26 76 34 80Z" {...F('#f68f5e')} />))}
      </g>
    ),
  },
  kiri: {
    head: 'round',
    body: 'stand',
    c: ['#f6e2b4', '#fff8e8', '#8ed6c0'],
    mouth: 'w',
    eyes: 'sparkle',
    rarity: 'mythic',
    element: '#8ed6c0',
    back: (s) => (
      <g>
        <Scallops cx={50} cy={50} rx={30} ry={24} n={12} r={7} color="#c6eedf" line="#8ec4b2" />
        {grow(s, [50, 28], both(<path d="M38 28c-2-7-6-11-10-13M31 20c-1-4 0-7 2-9M28 17c-4-1-7 0-9 2" {...stroke('#e6b44c', 3.4)} />))}
      </g>
    ),
    fourLegs: true,
  },
  gryff: {
    head: 'heart',
    body: 'sit',
    c: ['#fbf0de', '#fff8ec', '#e8b066'],
    line: '#c9a882',
    nose: 'beak',
    mouth: 'none',
    eyes: 'sparkle',
    rarity: 'mythic',
    element: GOLD,
    body2: '#f0c27e',
    back: (s) =>
      grow(s, [50, 64], both(<path d="M36 64C24 54 18 38 22 18 26 26 32 30 36 32 34 38 36 44 40 48 38 54 38 60 36 64Z" {...F('#e8b066')} />)),
    front: (s) => grow(s, [66, 90], <path d="M66 90c8 0 14-5 14-12" {...stroke('#c9955a', 2.6)} />),
  },
  nessa: {
    head: 'bean',
    body: 'nessa',
    c: ['#a6dbc0', '#eef8de', '#7fc7a6'],
    mouth: 'wide',
    eyes: 'sparkle',
    rarity: 'mythic',
    element: '#9fd6e0',
    back: (s) =>
      grow(
        s,
        [76, 92],
        <g {...F('#a6dbc0')}>
          <path d="M68 92c0-10 6-15 11-15s9 5 9 10z" />
          <path d="M84 92c0-6 4-9 7-9s5 4 4 8z" />
        </g>,
      ),
    top: <path d="M38 30l3-9 5 7M47 28l3-10 4 9M56 28l4-8 3 9" {...F('#7fc7a6')} />,
  },
  dozy: {
    head: 'mochi',
    body: 'loaf',
    c: ['#c2b7b4', '#ece6e2', '#e8cfd4'],
    mouth: 'none',
    eyes: 'sleepy',
    rarity: 'mythic',
    element: '#d6c8ee',
    back: () => both(<ellipse cx="14" cy="44" rx="10" ry="13" {...F('#c2b7b4')} />),
    front: (s) => grow(s, [50, 58], <path d="M44 56c0 8-2 14 2 18 3 3 8 2 8-2 0-3-3-3-4-1M56 56c0 4 0 8-2 12" {...F('#c2b7b4')} />),
    top: (s) =>
      grow(
        s,
        [70, 22],
        <g>
          <circle cx="78" cy="14" r="8" {...F('#ffffff', '#d6c8ee')} />
          <circle cx="70" cy="24" r="2.6" {...F('#ffffff', '#d6c8ee')} />
          <path d="M78 9a4 4 0 1 0 3 7 3 3 0 1 1-3-7z" fill={GOLD} />
        </g>,
      ),
  },
  nimbus: {
    head: 'round',
    body: 'stand',
    c: ['#fff8ec', '#ffffff', '#a8e0d0'],
    line: '#cdbfae',
    mouth: 'w',
    eyes: 'sparkle',
    rarity: 'mythic',
    element: '#a8e0d0',
    back: (s) => (
      <g>
        {grow(
          s,
          [50, 64],
          both(<path d="M36 66C22 58 12 44 14 24 20 32 26 34 32 34 28 40 30 46 34 50 30 54 32 60 36 66Z" {...F('#ffffff', '#a8c8c0')} />),
        )}
        <path d="M58 26C70 20 84 26 86 40 88 50 84 58 80 62 80 54 76 48 72 46 74 52 72 58 68 62 68 50 64 40 56 34Z" {...F('#a8e0d0')} />
      </g>
    ),
    under: <Scallops cx={50} cy={92} rx={26} ry={3} n={7} r={6} color="#ffffff" line="#a8c8c0" />,
  },
  hopscotch: {
    head: 'egg',
    body: 'stand',
    c: ['#e9c39a', '#fff4e6', '#a8734a'],
    mouth: 'w',
    eyes: 'sparkle',
    rarity: 'mythic',
    element: '#f6b6c8',
    back: (s) => (
      <g>
        {both(
          <g>
            <ellipse cx="38" cy="8" rx="6" ry="18" transform="rotate(-10 38 8)" {...F('#e9c39a')} />
            <ellipse cx="38" cy="9" rx="2.6" ry="12" transform="rotate(-10 38 9)" fill="#f6c2c2" />
          </g>,
        )}
        {grow(s, [50, 26], both(<path d="M46 26c-2-6-2-10 0-14M46 18c-3-2-5-2-7 0" {...stroke('#a8734a', 2.6)} />))}
      </g>
    ),
    raisedHoof: true,
  },
  frosty: {
    head: 'jowl',
    body: 'frosty',
    c: ['#f6f3f0', '#ffffff', '#9fd6c8'],
    line: '#a8bcb6',
    mouth: 'open',
    eyes: 'sparkle',
    rarity: 'mythic',
    element: '#bfeee2',
    face: <ellipse cx="50" cy="54" rx="18" ry="14" fill="#e3f4ef" />,
    back: (s) => grow(0.8 + 0.2 * s, [50, 50], <Scallops cx={50} cy={48} rx={29} ry={24} n={14} r={8} color="#f6f3f0" line="#a8bcb6" />),
    bigFeet: true,
  },
  fen: {
    head: 'onigiri',
    body: 'sit',
    c: ['#c6c1be', '#f6efe6', '#7c7672'],
    muzzle: true,
    mouth: 'w',
    eyes: 'sparkle',
    rarity: 'mythic',
    element: '#d6c8ee',
    back: (s) => (
      <g>
        {grow(s, [86, 90], <path d="M60 94C78 96 96 88 94 72 92 66 86 66 86 72 86 80 76 86 62 88Z" {...F('#c6c1be')} />)}
        {ears.tallFox('#c6c1be')}
      </g>
    ),
    front: (
      <path d="M30 64 34 72 38 66 42 74 46 68 50 76 54 68 58 74 62 66 66 72 70 64C66 70 58 74 50 74S34 70 30 64Z" {...F('#f6efe6', '#c9bcb0')} />
    ),
    top: <path d="M50 30a4 4 0 1 0 3 6 3 3 0 1 1-3-6z" fill={GOLD} />,
  },
  riddle: {
    head: 'mochi',
    body: 'sphinx',
    c: ['#f2d09a', '#fff0d2', '#7fb5d6'],
    mouth: 'w',
    eyes: 'sparkle',
    rarity: 'mythic',
    element: GOLD,
    back: (s) =>
      grow(
        0.75 + 0.25 * s,
        [50, 40],
        <g>
          <path d="M14 46C14 26 30 18 50 18S86 26 86 46L92 76 78 70 74 52H26L22 70 8 76Z" {...F(GOLD, '#c99a2e')} />
          <path d="M18 54l-4 18M24 50l-3 18M82 54l4 18M76 50l3 18" {...stroke('#7fb5d6', 3)} />
        </g>,
      ),
    top: <path d="M46 22l4-6 4 6z" {...F('#7fb5d6')} />,
  },
};

/* ---------- special bodies ---------- */

BODIES.none = { d: null, paws: [], feet: [] };
BODIES.nessa = {
  d: 'M36 64C36 74 38 82 40 88H60C62 82 64 74 64 64Z',
  belly: [50, 80, 5, 6],
  paws: [],
  feet: [],
  water: true,
};
BODIES.frosty = {
  d: 'M30 66C18 70 10 80 8 90L14 88 18 94 24 89 30 94 36 89 42 94 50 89 58 94 64 89 70 94 76 89 82 94 86 88 92 90C90 80 82 70 70 66Z',
  belly: [50, 82, 14, 8],
  paws: [
    [16, 86],
    [76, 80],
  ],
  feet: [
    [38, 94],
    [62, 94],
  ],
};

/* ---------- face ---------- */

function Eyes({ kind }) {
  if (kind === 'sleepy') return <path d="M33.6 51q5.4 4.6 10.8 0M55.6 51q5.4 4.6 10.8 0" {...stroke(INK, 2.4)} />;
  if (kind === 'happy') return <path d="M34 52q5-7 10 0M56 52q5-7 10 0" {...stroke(INK, 2.6)} />;
  const r = kind === 'big' ? 6.8 : 6;
  return (
    <g>
      {[39, 61].map((x) => (
        <g key={x}>
          <circle cx={x} cy="51" r={r} fill={INK} />
          <ellipse cx={x} cy="54.6" rx={r * 0.62} ry={r * 0.36} fill="#8a5a44" opacity=".6" />
          <circle cx={x + 2.2} cy="48.6" r="2.4" fill="#fff" />
          {kind === 'sparkle' ? (
            <path d={`M${x - 2.4} 52l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z`} fill="#fff" />
          ) : (
            <circle cx={x - 2} cy="54" r="1" fill="#fff" opacity=".95" />
          )}
        </g>
      ))}
    </g>
  );
}

function Mouth({ kind, nose, base }) {
  const n =
    nose === 'beak' ? (
      <path d="M45.6 55h8.8l-4.4 5.4z" {...F('#f6b26b', null, 1.4)} />
    ) : nose === 'snout' ? (
      <g>
        <ellipse cx="50" cy="59" rx="7" ry="5" {...F('#f3a3b2', null, 1.4)} />
        <ellipse cx="47.8" cy="59" rx="1.1" ry="1.6" fill={INK} />
        <ellipse cx="52.2" cy="59" rx="1.1" ry="1.6" fill={INK} />
      </g>
    ) : nose === 'big' ? (
      <ellipse cx="50" cy="57" rx="3.6" ry="2.8" fill={INK} />
    ) : nose === 'bigBean' ? (
      <ellipse cx="50" cy="57" rx="4.6" ry="6" fill="#5a4a46" />
    ) : nose === 'pink' ? (
      <path d="M48 57.6h4c.7 0 1 .7.6 1.2L50.6 61c-.3.4-.9.4-1.2 0l-2-2.2c-.4-.5-.1-1.2.6-1.2z" fill="#e77f8a" />
    ) : nose === 'none' ? null : (
      <path d="M48.3 55.4h3.4c.6 0 .9.6.5 1.1L50.6 58c-.3.4-.9.4-1.2 0l-1.6-1.5c-.4-.5-.1-1.1.5-1.1z" fill={INK} />
    );
  const y = nose === 'bigBean' ? 64 : nose === 'snout' ? 65 : 60;
  const m = {
    w: `M46.4 ${y}q1.8 2 3.6 0q1.8 2 3.6 0`,
    small: `M48 ${y + 0.4}q2 1.8 4 0`,
    flat: `M46 ${y + 1}h8`,
    wide: `M41 ${y - 1}q9 7 18 0`,
    open: null,
    none: null,
  }[kind ?? 'w'];
  return (
    <g>
      {n}
      {m && <path d={m} {...stroke(INK, 1.5)} />}
      {kind === 'open' && <path d={`M46.4 ${y - 0.6}h7.2c0 3-1.6 5-3.6 5s-3.6-2-3.6-5z`} fill="#c95f6a" stroke={INK} strokeWidth="1.2" />}
      {base && null}
    </g>
  );
}

/* ---------- the Pal ---------- */

const SIG = [0.5, 0.72, 1, 1.1, 1.22];
const BODY_K = [0.8, 0.9, 1, 1.05, 1.1];
const run = (part, s) => (typeof part === 'function' ? part(s) : part);

/** One Pal from the roster, in form `stageIndex` (0 Baby … 4 Master). Anchors never move, so outfits always fit. */
export function CozyPal2({ palId, stageIndex = 0 }) {
  const p = ROSTER[palId];
  if (!p) return null;
  const [base, patch, accent] = p.c;
  const line = p.line ?? shade(base);
  const s = SIG[stageIndex];
  const body = BODIES[p.body];
  const bodyColor = p.body2 ?? base;
  const limbs = p.limbs ?? bodyColor;
  const bk = BODY_K[stageIndex];
  const bodyT = `translate(50 94) scale(${p.narrow ? bk * 0.82 : bk} ${bk}) translate(-50 -94)`;
  const paws = body.paws.map(([x, y, kind], i) => (i === 0 && p.leftPaw ? [...p.leftPaw, 'round'] : [x, y, kind]));
  const pawKind = (kind) => (p.flippers || p.flipperWings ? 'wing' : kind);

  const stickerColors = [base, patch, accent, bodyColor, limbs];
  return (
    <g>
      <g filter="url(#czSticker)">
        {p.rarity === 'mythic' && stageIndex >= 3 && (
          <g fill={p.element} opacity=".9">
            {[
              [12, 30, 3],
              [88, 22, 2.4],
              [90, 60, 2],
              [8, 64, 2.2],
            ].map(([x, y, r]) => (
              <path
                key={x}
                d={`M${x} ${y - r * 2}l${r * 0.6} ${r * 1.4} ${r * 1.4} ${r * 0.6}-${r * 1.4} ${r * 0.6}-${r * 0.6} ${r * 1.4}-${r * 0.6}-${r * 1.4}-${r * 1.4}-${r * 0.6} ${r * 1.4}-${r * 0.6}z`}
              />
            ))}
          </g>
        )}
        {p.under}
        {run(p.back, s)}
        {stageIndex >= 3 && p.champ}
        {body.d && (
          <g transform={bodyT}>
            {body.water && <path d="M10 88c8-4 16 4 24 0s16 4 24 0 16 4 24 0 12 3 12 3" {...stroke('#9fd6e0', 2.4)} />}
            {body.haunch && <ellipse cx="80" cy="84" rx="12" ry="10" {...F(bodyColor, line)} />}
            {body.legs &&
              (p.fourLegs ? [36, 44, 56, 64] : [44, 56]).map((x, i) => (
                <path key={x} d={`M${x} 82V${p.raisedHoof && i === 0 ? 86 : 92}`} {...stroke(line, 7.4)} />
              ))}
            {body.legs &&
              (p.fourLegs ? [36, 44, 56, 64] : [44, 56]).map((x, i) => (
                <path key={`f${x}`} d={`M${x} 82V${p.raisedHoof && i === 0 ? 86 : 92}`} {...stroke(limbs, 4.6)} />
              ))}
            {(p.body === 'sit' || p.body === 'pear') && (
              <g>
                <path d="M24 88C22 80 26 74 33 74 40 74 43 81 41 88 40 92 36 94 31 94 27 94 25 92 24 88Z" {...F(bodyColor, line)} />
                <path d="M76 88C78 80 74 74 67 74 60 74 57 81 59 88 60 92 64 94 69 94 73 94 75 92 76 88Z" {...F(bodyColor, line)} />
              </g>
            )}
            <path d={body.d} {...F(bodyColor, line)} />
            {p.bodyFluff && <Scallops cx={50} cy={78} rx={22} ry={11} n={10} r={6} color={base} line={line} />}
            {['sit', 'pear', 'stand'].includes(p.body) && !p.noBib && (
              <path
                d="M38 68C41 71 43 70 45 68 46 71 49 72 50 69 52 72 54 71 55 68 57 70 59 71 62 68 62 76 58 82 50 84 42 82 38 76 38 68Z"
                {...F(patch, line, 1.2)}
              />
            )}
            {['sit', 'pear', 'stand'].includes(p.body) && !p.noBib
              ? null
              : body.belly && <ellipse cx={body.belly[0]} cy={body.belly[1]} rx={body.belly[2]} ry={body.belly[3]} fill={paint(patch)} />}
            {p.bodyMarks}
            {body.feet.map(([x, y, kind]) =>
              kind === 'small' || p.feetColor ? (
                <ellipse key={x} cx={x} cy={y} rx={p.bigFeet ? 9 : 6} ry={p.bigFeet ? 3.8 : 3} {...F(p.feetColor ?? '#f6b26b')} />
              ) : (
                <ellipse key={x} cx={x} cy={y} rx={p.bigFeet ? 9.6 : 7} ry="4.4" {...F(limbs, shade(limbs))} />
              ),
            )}
          </g>
        )}
        {body.merge && <ellipse cx="50" cy="68" rx="24" ry="7" fill={bodyColor} />}
        {p.head === 'cloud' ? <Head shape="cloud" color={base} line={line} /> : <Head shape={p.head} color={base} line={line} />}
        {p.muzzleBun && <ellipse cx="50" cy="62" rx="15" ry="9.6" {...F(patch, line)} />}
        {p.muzzle && !p.muzzleBun && (
          <path
            d="M50 55C44 55 40 58 38 61 34 61 31 62 29 63 33 68 41 70 50 70S67 68 71 63C69 62 66 61 62 61 60 58 56 55 50 55Z"
            fill={paint(patch)}
            stroke={line}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        )}
        {p.snout && <ellipse cx="50" cy="61" rx="13" ry="8" fill={paint(patch)} />}
        {p.face}
        {stageIndex >= 4 && p.master}
        {run(p.top, s)}
        <Eyes kind={p.eyes} />
        <ellipse cx="29.6" cy="59" rx="5" ry="2.9" fill={p.blush ?? '#f59a9a'} opacity=".5" />
        <ellipse cx="70.4" cy="59" rx="5" ry="2.9" fill={p.blush ?? '#f59a9a'} opacity=".5" />
        <Mouth kind={p.mouth} nose={p.nose} />
        {p.whiskers && <path d="M26 57l-7-1M26 61l-7 1M74 57l7-1M74 61l7 1" {...stroke(shade(base, 0.45), 1)} />}
        {paws.map(([x, y, kind]) => (
          <Paw key={`${x}${y}`} x={x} y={y} kind={p.bigPaws ? 'round' : pawKind(kind)} color={limbs} line={shade(limbs)} />
        ))}
        {p.frontFill ? (
          <g>
            {run(p.front, s)}
            {run(p.frontFill, s)}
          </g>
        ) : (
          run(p.front, s)
        )}
      </g>
      <StickerDefs extra={stickerColors} />
    </g>
  );
}
