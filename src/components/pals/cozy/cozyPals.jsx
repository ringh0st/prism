import { Body, Ears, Face, Feet, Head, Paws, Sparkle, Spots, Tail, Wings, fill, shade } from './cozyParts.jsx';

/* ---------- parts some Pals add around the template ---------- */

const shell = (top, rim) => (
  <g>
    <path d="M16 90c-4-20 12-34 34-34s38 14 34 34z" {...fill(top)} />
    <path
      d="M22 76l10-6 10 4 8-6 8 6 10-4 10 6M19 86l10-4 21 0 21 0 10 4"
      fill="none"
      stroke={shade(top, 0.22)}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M17 90h66" stroke={rim} strokeWidth="3.4" strokeLinecap="round" />
  </g>
);
const snailShell = (color) => (
  <g>
    <circle cx="70" cy="72" r="17" {...fill(color)} />
    <path
      d="M70 72m-3 0a3 3 0 1 1 6 0 6 6 0 1 1-12 0 9 9 0 1 1 18 0 12 12 0 1 1-24 0"
      fill="none"
      stroke={shade(color, 0.25)}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </g>
);
const spikes = (color) => (
  <path d="M22 54l-6-6 8-2-5-8 9 0-2-9 8 3 1-9 7 6 4-8 4 8 4-8 4 8 7-6 1 9 8-3-2 9 9 0-5 8 8 2-6 6 6 6-8 2 4 8-9-1z" {...fill(color)} />
);
const starPoints = (color) => <path d="M50 2l11 18 22 2-14 16 8 22-27-8-27 8 8-22-14-16 22-2z" {...fill(color)} />;
const crystal = (color) => (
  <g {...fill(color)}>
    <path d="M22 44l2-18 8-8 6 20z" />
    <path d="M78 44l-2-18-8-8-6 20z" />
    <path d="M36 30l6-24 8-4 8 4 6 24z" />
    <path d="M42 6l8 8 8-8M50 14v16" fill="none" />
  </g>
);
const cloudBack = (color) => (
  <path d="M18 54c-6-2-8-12 0-16-2-8 6-14 13-11 2-9 14-12 19-5 5-7 17-4 19 5 7-3 15 3 13 11 8 4 6 14 0 16z" {...fill(color, { stroke: '#cfe3df' })} />
);
const wool = (color) => (
  <g {...fill(color)}>
    {[
      [30, 30],
      [40, 23],
      [50, 21],
      [60, 23],
      [70, 30],
      [25, 40],
      [75, 40],
    ].map(([x, y]) => (
      <circle key={`${x}${y}`} cx={x} cy={y} r="8" />
    ))}
  </g>
);
const fur = (color) => (
  <g {...fill(color)}>
    <path d="M20 64l-8-4 5-4-7-6 8-3-4-8 9 0-1-9 9 3 1-9 8 5 4-8 6 6 6-6 4 8 8-5 1 9 9-3-1 9 9 0-4 8 8 3-7 6 5 4-8 4z" />
  </g>
);
const headdress = (gold, blue) => (
  <g>
    <path d="M20 46c0-18 13-26 30-26s30 8 30 26l4 22-12-6-4-14H32l-4 14-12 6z" {...fill(gold)} />
    <path d="M24 50l-3 14M29 47l-2 15M76 50l3 14M71 47l2 15" stroke={blue} strokeWidth="3" strokeLinecap="round" />
  </g>
);
const humps = (color) => (
  <g {...fill(color)}>
    <path d="M70 92c0-10 6-14 10-14s8 4 8 10z" />
    <path d="M84 92c0-6 4-9 7-9s5 4 4 8z" />
  </g>
);
const tentacles = (color) => (
  <g {...fill(color)}>
    <path d="M28 70c-6 10-10 16-16 18 2 3 8 3 12 0 2 3 6 5 9 4 0 3 3 4 6 3 2 2 5 2 7 0 2 2 5 2 7 0 3 1 6 0 6-3 3 1 7-1 9-4 4 3 10 3 12 0-6-2-10-8-16-18z" />
    <path d="M30 86q4-2 6 1M42 90q4-2 6 1M54 90q4-2 6 1M66 86q4-2 6 1" fill="none" stroke={shade(color, 0.2)} strokeWidth="1.4" />
  </g>
);

/* top-of-head parts */
const horn = (color) => <path d="M45.5 25 50 4l4.5 21z" {...fill(color)} />;
const hornSpiral = (color) => (
  <g>
    <path d="M46 25 50 2l4 23z" {...fill(color)} />
    <path d="M47 19l6-2M48 13l4-1.6" stroke={shade(color)} strokeWidth="1.2" />
  </g>
);
const antlers = (color, size = 1) => (
  <g
    transform={`translate(50 30) scale(${size}) translate(-50 -30)`}
    fill="none"
    stroke={color}
    strokeWidth="3.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M36 28c-2-6-6-10-10-12M30 20c-1-4 0-7 2-9M27 17c-4-1-7 0-9 2" />
    <path d="M64 28c2-6 6-10 10-12M70 20c1-4 0-7-2-9M73 17c4-1 7 0 9 2" />
  </g>
);
const smallHorns = (color) => (
  <g>
    <path d="M34 28l-3-14 11 9z" {...fill(color)} />
    <path d="M66 28l3-14-11 9z" {...fill(color)} />
  </g>
);
const crest = (color, flame = false) => (
  <g {...fill(color)}>
    <path d={flame ? 'M50 25c-6-6-4-14 0-20 1 6 4 8 6 6 1 6-1 11-6 14z' : 'M50 25c-4-4-6-10-3-15 2 4 3 6 3 6 1-4 3-8 7-9-1 6-2 12-7 18z'} />
  </g>
);
const antennae = (color) => (
  <g>
    <path d="M42 26c-2-8-5-12-8-14M58 26c2-8 5-12 8-14" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="33.6" cy="11.6" r="3.2" fill={color} />
    <circle cx="66.4" cy="11.6" r="3.2" fill={color} />
  </g>
);
const sprout = (
  <g>
    <path d="M50 25v-8" stroke="#5aa267" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M50 18c-4-5-10-5-12-2 3 4 8 4 12 2z" {...fill('#9fd98a')} />
    <path d="M50 18c4-6 10-6 12-3-3 4-8 5-12 3z" {...fill('#9fd98a')} />
  </g>
);
const cap = (color, dot) => (
  <g>
    <path d="M14 44c0-20 16-32 36-32s36 12 36 32c0 4-4 5-8 4-8-2-18-3-28-3s-20 1-28 3c-4 1-8 0-8-4z" {...fill(color)} />
    <g fill={dot}>
      <circle cx="34" cy="26" r="4.4" />
      <circle cx="56" cy="20" r="5" />
      <circle cx="72" cy="32" r="3.6" />
      <circle cx="24" cy="38" r="2.6" />
    </g>
  </g>
);
const frogBumps = (color) => (
  <g>
    <circle cx="36" cy="30" r="10" {...fill(color)} />
    <circle cx="64" cy="30" r="10" {...fill(color)} />
  </g>
);
const mane = (color) => (
  <g {...fill(color)}>
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <circle key={i} cx={50 + Math.cos(a) * 28} cy={48 + Math.sin(a) * 24} r="9" />;
    })}
  </g>
);
const unicornMane = (color) => (
  <g {...fill(color)}>
    <path d="M60 23c10-2 18 4 20 14 2 8 0 16-4 22-1-6-3-10-6-12 1 6 0 10-3 14-1-12-4-22-14-30z" />
    <path d="M38 25c4-5 12-6 18-3-7 1-12 4-14 9-2-2-3-4-4-6z" />
  </g>
);
const fan = (color, eye, big) => (
  <g transform={`translate(50 80) scale(${big ? 1.2 : 0.9}) translate(-50 -80)`}>
    {Array.from({ length: 7 }, (_, i) => {
      const a = Math.PI * (0.1 + (i / 6) * 0.8);
      const x = 50 - Math.cos(a) * 34;
      const y = 80 - Math.sin(a) * 30;
      return (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="8" ry="11" transform={`rotate(${(a * 180) / Math.PI - 90} ${x} ${y})`} {...fill(color)} />
          <circle cx={x} cy={y} r="3" fill={eye} />
        </g>
      );
    })}
  </g>
);
const flower = (x, y, color) => (
  <g transform={`translate(${x} ${y})`}>
    {[0, 72, 144, 216, 288].map((r) => (
      <ellipse key={r} cx="0" cy="-4" rx="3" ry="4" transform={`rotate(${r})`} {...fill(color, { strokeWidth: 1 })} />
    ))}
    <circle r="2.4" fill="#f0c14e" />
  </g>
);
const leaves = (color) => (
  <g {...fill(color)}>
    <path d="M30 90c-10-2-16-8-16-14 7 0 14 5 16 14z" />
    <path d="M70 90c10-2 16-8 16-14-7 0-14 5-16 14z" />
    <path d="M26 92c-8 1-14-1-16-5 6-2 12 0 16 5z" />
    <path d="M74 92c8 1 14-1 16-5-6-2-12 0-16 5z" />
  </g>
);
const crystals = (color) => (
  <g {...fill(color)}>
    <path d="M20 92l-4-12 5-8 5 8z" />
    <path d="M26 92l-1-8 4-5 3 6z" />
    <path d="M80 92l4-12-5-8-5 8z" />
    <path d="M74 92l1-8-4-5-3 6z" />
  </g>
);
const clouds = (color) => (
  <g {...fill(color)}>
    <path d="M10 92c-2-5 2-8 6-7 1-4 7-5 9-1 4-1 6 3 5 8z" />
    <path d="M70 92c-1-5 3-8 7-7 1-4 7-5 9-1 4-1 6 3 5 8z" />
  </g>
);
const bubbles = (color) => (
  <g fill="none" stroke={color} strokeWidth="1.6">
    <circle cx="84" cy="40" r="4" />
    <circle cx="90" cy="28" r="2.6" />
    <circle cx="14" cy="34" r="3" />
  </g>
);
const flameWings = (color, tip) => (
  <g>
    <Wings color={color} big />
    <path d="M12 70c-4-6-2-12 2-14-1 5 2 7 4 8zM88 70c4-6 2-12-2-14 1 5-2 7-4 8z" fill={tip} />
  </g>
);

const FEATURES = {
  wings: (c, big) => ({ back: <Wings color={c.wing ?? c.fill} big={big} /> }),
  bat: (c, big) => ({ back: <Wings color={c.wing ?? c.fill} big={big} bat /> }),
  flames: (c, big) => ({ back: big ? flameWings(c.wing, '#f0c14e') : <Wings color={c.wing} /> }),
  mane: (c, big) => ({ back: <g transform={`translate(50 48) scale(${big ? 1.08 : 0.94}) translate(-50 -48)`}>{mane(c.mane)}</g> }),
  fan: (c, big) => ({ back: fan(c.fanColor, c.fanEye, big) }),
  flower: (c, big) => ({
    front: (
      <g>
        {flower(72, 30, c.flowerColor ?? '#f6b6c8')}
        {big && flower(28, 30, c.flowerColor ?? '#f6b6c8')}
      </g>
    ),
  }),
  leaves: (c, big) => ({ front: <g transform={`translate(50 92) scale(${big ? 1.1 : 0.8}) translate(-50 -92)`}>{leaves(c.leaf ?? '#9fd98a')}</g> }),
  crystals: (c, big) => ({
    front: <g transform={`translate(50 92) scale(${big ? 1.1 : 0.8}) translate(-50 -92)`}>{crystals(c.crystal ?? '#bfeee2')}</g>,
  }),
  clouds: (c, big) => ({ front: <g transform={`translate(50 92) scale(${big ? 1.1 : 0.85}) translate(-50 -92)`}>{clouds('#ffffff')}</g> }),
  bubbles: (c, big) => ({ front: <g opacity={big ? 1 : 0.7}>{bubbles(c.bubble ?? '#8fd3c4')}</g> }),
  bigTail: () => ({ tailGrow: 1.25 }),
};

/* ---------- the 48 Pals ---------- */

const CREAM = '#fff4e6';

export const COZY_PALS = {
  ember: {
    fill: '#f6b07e',
    belly: CREAM,
    muzzle: CREAM,
    ears: 'fox',
    inner: '#fde0cc',
    tail: 'fox',
    feature: 'bigTail',
    top: <path d="M50 34c-3 0-4-3-3-5 0-1 2-2 2-4 1 2 1 2 2 3 1-1 2-3 3-3 0 3 1 5 0 7-1 1-2 2-4 2z" fill="#f7c64a" />,
  },
  coral: {
    fill: '#f9c3cb',
    belly: '#ffe3e7',
    ears: 'gills',
    gill: '#f492a5',
    tail: 'fish',
    fin: '#f7aebb',
    nose: 'none',
    feature: 'bubbles',
    bubble: '#f492a5',
  },
  mossy: { fill: '#bfe3a6', belly: '#fff2c9', ears: 'none', back: shell('#7fc18f', '#d7efc2'), top: sprout, feature: 'leaves', nose: 'none' },
  aurora: {
    fill: '#f6f2ec',
    belly: '#ffffff',
    muzzle: '#ffffff',
    ears: 'fox',
    inner: '#bfe8dc',
    tail: 'fox',
    tailTip: '#bfe8dc',
    feature: 'bigTail',
    top: (
      <g stroke="#58ac82" strokeWidth="1.6" strokeLinecap="round">
        <path d="M50 28v8M46.5 30l7 4M46.5 34l7-4" />
      </g>
    ),
  },
  mochi: {
    fill: '#fde3cf',
    belly: CREAM,
    ears: 'cat',
    tail: 'curl',
    whiskers: true,
    feature: 'flower',
    top: <path d="M50 27a4 4 0 1 0 3 6 3 3 0 1 1-3-6z" fill="#f0c14e" />,
  },
  hoot: { fill: '#c9a07c', belly: '#f4e2c6', muzzle: '#f4e2c6', ears: 'tufts', nose: 'beak', feature: 'wings', wing: '#b48b68', paws: '#b48b68' },
  waffles: { fill: '#f2cf9c', belly: CREAM, muzzle: CREAM, ears: 'floppy', ear: '#d9ae7a', tail: 'fluffy', feature: 'bigTail' },
  peep: { fill: '#fde58a', belly: '#fff3c2', ears: 'none', nose: 'beak', feet: '#f6b26b', top: crest('#f8cf5a'), feature: 'wings', wing: '#f8d76e' },
  bruno: { fill: '#c99a74', belly: '#f1dcc4', muzzle: '#f1dcc4', ears: 'bear', inner: '#f1dcc4', feature: 'flower', flowerColor: '#fff2a8' },
  biscuit: { fill: '#f6e6d4', belly: '#ffffff', ears: 'bunny', tail: 'puff', feature: 'leaves' },
  truffle: { fill: '#f9c5cc', belly: '#ffe2e6', ears: 'pig', inner: '#f3a3b0', nose: 'snout', tail: 'pig', feature: 'flower' },
  pebble: { fill: '#f6e3c9', belly: CREAM, ears: 'small', ear: '#b98a64', back: spikes('#b98a64'), feature: 'flower', flowerColor: '#f6b6c8' },
  quartz: {
    fill: '#c6f0e4',
    belly: '#e6fbf5',
    ears: 'none',
    back: crystal('#a8e6d6'),
    nose: 'none',
    top: <path d="M30 40l8-12M70 40l-8-12" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity=".8" />,
    feature: 'crystals',
  },
  ribbit: { fill: '#b8e09c', belly: '#e9f7d6', ears: 'none', nose: 'none', back: frogBumps('#b8e09c'), feature: 'leaves' },
  cotton: { fill: '#f6e2cf', belly: '#fffaf2', ears: 'side', inner: '#f6c9c4', back: wool('#fffaf2'), feature: 'flower' },
  squeak: { fill: '#d9cfc6', belly: '#f4ece4', ears: 'mouse', tail: 'thin', whiskers: true, feature: 'bigTail' },
  maple: {
    fill: '#eca57c',
    belly: '#8a5a44',
    paws: '#8a5a44',
    feet: '#8a5a44',
    ears: 'cat',
    ear: '#eca57c',
    inner: '#fff4e6',
    tail: 'striped',
    tailColor: '#eca57c',
    stripe: '#c27150',
    muzzle: CREAM,
    feature: 'bigTail',
  },
  otto: { fill: '#c9a285', belly: '#f2e2d2', muzzle: '#f2e2d2', ears: 'small', tail: 'long', whiskers: true, feature: 'bubbles' },
  buzz: {
    fill: '#fcdc7c',
    ears: 'none',
    nose: 'none',
    top: antennae('#7a5a44'),
    bodyMarks: <path d="M31 80h38M33 88h34" stroke="#8a6448" strokeWidth="4.6" strokeLinecap="round" />,
    feature: 'wings',
    wing: '#ffffff',
  },
  kiko: { fill: '#cbc5c2', belly: '#f2eeec', ears: 'koala', inner: '#f6cfd0', nose: 'big', feature: 'leaves' },
  splash: {
    fill: '#dcd5cf',
    belly: '#f3efea',
    ears: 'none',
    whiskers: true,
    top: (
      <Spots
        color="#c3b9b1"
        dots={[
          [36, 34, 2.2],
          [62, 31, 1.8],
          [68, 38, 1.4],
        ]}
      />
    ),
    feature: 'bubbles',
    bubble: '#9ccfd6',
  },
  shroomy: { fill: '#fff1de', belly: '#ffffff', ears: 'none', nose: 'none', top: cap('#f2a093', '#fff6ee'), feature: 'leaves' },
  bandit: {
    fill: '#c6bfb9',
    belly: '#f1ece6',
    ears: 'cat',
    tail: 'striped',
    stripe: '#6e6460',
    mask: '#6e6460',
    muzzle: '#f1ece6',
    feature: 'bigTail',
  },
  waddles: {
    fill: '#6f6a76',
    belly: CREAM,
    head: '#6f6a76',
    faceMask: CREAM,
    ears: 'none',
    nose: 'beak',
    feet: '#f6b26b',
    feature: 'wings',
    wing: '#6f6a76',
  },
  fawn: {
    fill: '#e3b58c',
    belly: CREAM,
    muzzle: CREAM,
    ears: 'cat',
    ear: '#e3b58c',
    top: antlers('#a8734a', 0.7),
    tail: 'puff',
    bodyMarks: (
      <Spots
        color="#fff4e6"
        dots={[
          [38, 74, 1.8],
          [62, 74, 1.8],
          [44, 70, 1.4],
          [57, 70, 1.4],
        ]}
      />
    ),
    feature: 'flower',
  },
  shelly: { fill: '#cfe7a8', belly: '#eaf6d6', ears: 'none', nose: 'none', top: antennae('#9cc77a'), back: snailShell('#f6b88f'), feature: 'flower' },
  inky: { fill: '#f7adb8', ears: 'none', nose: 'none', octo: true, feature: 'bubbles', bubble: '#f492a5' },
  puff: { fill: '#ffffff', belly: '#f2fbf8', ears: 'none', nose: 'none', back: cloudBack('#ffffff'), feature: 'clouds' },
  twinkle: { fill: '#fde58a', belly: '#fff2bd', ears: 'none', nose: 'none', back: starPoints('#fde58a'), feature: 'wings', wing: '#ffffff' },
  starla: {
    fill: '#fff6f3',
    belly: '#ffffff',
    ears: 'cat',
    inner: '#f9cfe0',
    top: horn('#f5cf6a'),
    back: unicornMane('#f8bfd8'),
    topFront: <path d="M40 26c3-4 9-6 15-4-6 1-10 4-12 8z" fill="#f8bfd8" />,
    tail: 'fluffy',
    tailColor: '#f8bfd8',
    feature: 'wings',
    wing: '#fff2d6',
  },
  ziggy: { fill: '#a3dcc9', belly: '#e8f8ef', ears: 'none', top: smallHorns('#f0c97a'), tail: 'dragon', feature: 'bat', wing: '#7cc3ac' },
  leo: {
    fill: '#f7c96c',
    belly: '#fff0c8',
    muzzle: '#fff0c8',
    ears: 'bear',
    inner: '#fff0c8',
    tail: 'tuft',
    tailTip: '#d99a4a',
    mane: '#e8a654',
    feature: 'mane',
  },
  koi: {
    fill: '#fff4ee',
    belly: '#ffffff',
    ears: 'fins',
    fin: '#f7b087',
    tail: 'fish',
    nose: 'none',
    top: (
      <Spots
        color="#f7a77c"
        dots={[
          [58, 32, 5],
          [40, 36, 3],
        ]}
      />
    ),
    bodyMarks: (
      <Spots
        color="#f7a77c"
        dots={[
          [42, 76, 4],
          [60, 84, 3.4],
        ]}
      />
    ),
    feature: 'bubbles',
  },
  bamboo: {
    fill: '#fbf8f3',
    belly: '#ffffff',
    ears: 'bear',
    ear: '#4f4649',
    inner: '#4f4649',
    paws: '#4f4649',
    feet: '#4f4649',
    patches: '#4f4649',
    top: sprout,
    feature: 'leaves',
  },
  storm: {
    fill: '#f8b47f',
    belly: CREAM,
    muzzle: CREAM,
    ears: 'bear',
    inner: CREAM,
    tail: 'striped',
    stripe: '#a8603e',
    stripes: '#c06e48',
    feature: 'bigTail',
  },
  plume: {
    fill: '#8fd5c5',
    belly: '#dff5ee',
    ears: 'none',
    nose: 'beak',
    top: crest('#f2c95a'),
    fanColor: '#8fd5c5',
    fanEye: '#f2c95a',
    feature: 'fan',
  },
  nova: {
    fill: '#acdfd3',
    belly: '#eaf8f4',
    ears: 'fins',
    fin: '#8cd0c0',
    nose: 'none',
    top: hornSpiral('#f5d98a'),
    tail: 'fish',
    feature: 'bubbles',
  },
  luna: {
    fill: '#efebe5',
    belly: '#ffffff',
    muzzle: '#ffffff',
    ears: 'bear',
    inner: '#e6dcd2',
    tail: 'long',
    top: (
      <Spots
        color="#b9b0a8"
        dots={[
          [38, 34, 2.4],
          [62, 33, 2],
          [56, 29, 1.6],
        ]}
      />
    ),
    bodyMarks: (
      <Spots
        color="#b9b0a8"
        dots={[
          [37, 74, 2],
          [63, 76, 2.2],
          [44, 70, 1.4],
        ]}
      />
    ),
    feature: 'bigTail',
  },
  sol: { fill: '#f9b27c', belly: '#fde3a8', ears: 'none', nose: 'beak', top: crest('#f6cd5a', true), wing: '#f6a35e', feature: 'flames' },
  kiri: {
    fill: '#c3eadc',
    belly: '#fff4e0',
    muzzle: '#fff4e0',
    ears: 'cat',
    top: antlers('#e6b44c', 0.8),
    tail: 'tuft',
    tailTip: '#fff4e0',
    mane: '#fff4e0',
    feature: 'mane',
  },
  gryff: {
    fill: '#f2c47e',
    head: '#fbf0de',
    belly: '#fff4e0',
    ears: 'tufts',
    ear: '#fbf0de',
    nose: 'beak',
    tail: 'tuft',
    tailTip: '#d99a4a',
    feature: 'wings',
    wing: '#e8b066',
  },
  nessa: { fill: '#a8ddc2', belly: '#e9f6dd', ears: 'fins', fin: '#8ccfae', nose: 'none', back: humps('#a8ddc2'), feature: 'bubbles' },
  dozy: {
    fill: '#c2b8b4',
    belly: '#ece6e2',
    ears: 'side',
    inner: '#e9cfd2',
    nose: 'none',
    sleepy: true,
    trunk: true,
    top: <path d="M50 26a5 5 0 1 0 4 8 4 4 0 1 1-4-8z" fill="#f0c14e" />,
    feature: 'clouds',
  },
  nimbus: {
    fill: '#fff8ec',
    belly: '#ffffff',
    ears: 'cat',
    inner: '#cdeee4',
    back: unicornMane('#bfe8dc'),
    topFront: <path d="M40 26c3-4 9-6 15-4-6 1-10 4-12 8z" fill="#bfe8dc" />,
    tail: 'fluffy',
    tailColor: '#bfe8dc',
    feature: 'wings',
    wing: '#e3f6f0',
  },
  hopscotch: { fill: '#ecc9a0', belly: CREAM, ears: 'bunny', top: antlers('#a8734a', 0.55), tail: 'puff', feature: 'flower' },
  frosty: { fill: '#f4f1ee', belly: '#ffffff', ears: 'none', back: fur('#ffffff'), head: '#eef6f3', feature: 'crystals', crystal: '#cdeee4' },
  fen: {
    fill: '#c9c4c1',
    belly: '#f6efe6',
    muzzle: '#f6efe6',
    ears: 'fox',
    inner: '#f0e6dc',
    tail: 'fox',
    tailTip: '#f6efe6',
    top: <path d="M50 28a4 4 0 1 0 3 6 3 3 0 1 1-3-6z" fill="#f0c14e" />,
    feature: 'bigTail',
  },
  riddle: {
    fill: '#f2d29e',
    belly: '#fff0d2',
    ears: 'cat',
    back: headdress('#f0c14e', '#7fb5d6'),
    tail: 'curl',
    feature: 'crystals',
    crystal: '#f5d98a',
  },
};

/* ---------- face marks that sit between the head and the eyes ---------- */

function FaceMarks({ c }) {
  return (
    <g>
      {c.patches && (
        <g fill={c.patches}>
          <ellipse cx="38" cy="51" rx="8" ry="9.4" transform="rotate(20 38 51)" />
          <ellipse cx="62" cy="51" rx="8" ry="9.4" transform="rotate(-20 62 51)" />
        </g>
      )}
      {c.mask && <path d="M24 50c4-8 14-8 26-4 12-4 22-4 26 4-4 6-14 8-26 4-12 4-22 2-26-4z" fill={c.mask} />}
      {c.faceMask && <path d="M50 38c8-6 20-2 22 10s-8 20-22 20-24-8-22-20 14-16 22-10z" fill={c.faceMask} />}
      {c.stripes && (
        <g stroke={c.stripes} strokeWidth="2.4" strokeLinecap="round">
          <path d="M50 26v6M44 28l1 5M56 28l-1 5M23 46h6M23 52h5M77 46h-6M77 52h-5" />
        </g>
      )}
      {c.trunk && <path d="M50 54c-3 0-4 4-4 8 0 4 3 6 6 5" {...fill(c.fill, { fill: c.fill })} />}
    </g>
  );
}

/**
 * One cozy Pal in form `stageIndex` (0 Baby … 4 Master), drawn on the shared template. Every form adds something
 * (a fluffy chest, then its own feature, bigger, then a golden glow) and nothing moves, so outfits always fit.
 */
export function CozyPal({ palId, stageIndex = 0 }) {
  const c = COZY_PALS[palId];
  if (!c) return null;
  const feature = stageIndex >= 2 ? (FEATURES[c.feature]?.(c, stageIndex >= 3) ?? {}) : {};
  const tailGrow = (stageIndex === 0 ? 0.85 : 1) * (feature.tailGrow ?? 1);
  return (
    <g>
      {stageIndex >= 4 && <circle cx="50" cy="52" r="40" fill="#ffe9a8" opacity=".35" />}
      {feature.back}
      {c.back}
      <Tail c={c} grow={tailGrow} />
      {c.octo ? tentacles(c.fill) : <Body c={c} />}
      {!c.octo && <Feet c={c} />}
      {stageIndex >= 1 && !c.octo && (
        <path d="M37 69c2 2 4 2 5 0 2 2 4 2 5 0 2 2 4 2 6 0 2 2 4 2 5 0 2 2 4 2 5 0-1 6-6 10-13 10s-12-4-13-10z" {...fill(c.belly ?? CREAM)} />
      )}
      <Ears c={c} />
      <Head c={c} />
      <FaceMarks c={c} />
      {c.top}
      {c.topFront}
      <Face c={c} />
      {!c.octo && <Paws c={c} />}
      {feature.front}
      {stageIndex >= 4 && (
        <g>
          <path d="M50 22l3 4-3 4-3-4z" {...fill('#f0c14e', { strokeWidth: 1.2 })} />
          <Sparkle x={14} y={20} s={0.9} />
          <Sparkle x={86} y={26} s={0.7} />
        </g>
      )}
    </g>
  );
}
