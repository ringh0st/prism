import { palStage } from '../../game/pals.js';

/*
 * Pals (inline SVG, 100×100, standing on y≈94). Eight are hand-drawn; the other 22 are built from a
 * kit of parts below. Every Pal has five forms that add to its look: Baby, Junior (signature feature),
 * Buddy (forehead gem), Champ (warm aura) and Legend (light wings, halo and sparkles).
 * `hat` and `neck` say where accessories sit on that Pal.
 */

const INK = '#3b1a08';

function Face({ y, gap = 10, eyeSize = 1, cx = 50 }) {
  const rx = 5.5 * eyeSize;
  const ry = 7 * eyeSize;
  return (
    <g>
      <ellipse cx={cx - gap} cy={y} rx={rx} ry={ry} fill={INK} />
      <ellipse cx={cx + gap} cy={y} rx={rx} ry={ry} fill={INK} />
      <circle cx={cx - gap + 2} cy={y - 3} r={2.2 * eyeSize} fill="#fff" />
      <circle cx={cx + gap + 2} cy={y - 3} r={2.2 * eyeSize} fill="#fff" />
      <ellipse cx={cx - gap - 9} cy={y + 9} rx="5" ry="3" fill="#ff8f7f" opacity=".55" />
      <ellipse cx={cx + gap + 9} cy={y + 9} rx="5" ry="3" fill="#ff8f7f" opacity=".55" />
      <path d={`M${cx - 5} ${y + 10}q5 6 10 0`} stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  );
}

const ART = {
  ember: {
    hat: [50, 26],
    neck: 78,
    grown: <path d="M70 86c14 2 24-8 22-22-4 8-10 10-16 8 4 6 0 12-6 14z" fill="#e9895f" />,
    base: (
      <>
        <ellipse cx="50" cy="86" rx="18" ry="10" fill="#e9895f" />
        <path d="M26 34 30 10l16 18zM74 34 70 10 54 28z" fill="#e9895f" />
        <path d="M31 28l2-11 8 9zM69 28l-2-11-8 9z" fill="#fbe5d6" />
        <circle cx="50" cy="52" r="27" fill="#f2a67e" />
        <path d="M50 56c-13 0-22 7-22 15a22 18 0 0 0 44 0c0-8-9-15-22-15z" fill="#fff6ea" />
        <ellipse cx="50" cy="62" rx="4" ry="3" fill={INK} />
        <Face y={48} />
      </>
    ),
  },
  mossy: {
    hat: [50, 28],
    neck: 66,
    grown: (
      <g fill="#3f8a64" opacity=".55">
        <path d="M38 74l6-6h8l6 6-6 6h-8zM22 80l4-6h8l3 6-3 5h-8zM62 80l4-6h8l3 6-3 5h-8z" />
      </g>
    ),
    base: (
      <>
        <ellipse cx="30" cy="90" rx="8" ry="5" fill="#9fcf9a" />
        <ellipse cx="70" cy="90" rx="8" ry="5" fill="#9fcf9a" />
        <path d="M16 86a34 26 0 0 1 68 0z" fill="#58ac82" />
        <circle cx="50" cy="48" r="22" fill="#9fcf9a" />
        <Face y={46} gap={9} />
      </>
    ),
  },
  coral: {
    hat: [50, 28],
    neck: 80,
    grown: (
      <g fill="#df9078">
        <circle cx="36" cy="70" r="2.5" />
        <circle cx="64" cy="72" r="2.5" />
        <circle cx="58" cy="78" r="2" />
      </g>
    ),
    base: (
      <>
        <ellipse cx="50" cy="86" rx="20" ry="10" fill="#f6c3b2" />
        <path d="M24 40l-14-8M23 50l-16 0M24 60l-14 8M76 40l14-8M77 50l16 0M76 60l14 8" stroke="#df9078" strokeWidth="6" strokeLinecap="round" />
        <circle cx="50" cy="54" r="28" fill="#f6c3b2" />
        <Face y={52} gap={11} />
      </>
    ),
  },
  hoot: {
    hat: [50, 26],
    neck: 66,
    grown: (
      <>
        <ellipse cx="22" cy="62" rx="8" ry="18" fill="#a8734a" transform="rotate(14 22 62)" />
        <ellipse cx="78" cy="62" rx="8" ry="18" fill="#a8734a" transform="rotate(-14 78 62)" />
      </>
    ),
    base: (
      <>
        <path d="M28 30l6 14M72 30l-6 14" stroke="#a8734a" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="50" cy="60" rx="28" ry="32" fill="#c9925f" />
        <ellipse cx="50" cy="72" rx="17" ry="18" fill="#f8efe0" />
        <circle cx="39" cy="50" r="11" fill="#fff6ea" />
        <circle cx="61" cy="50" r="11" fill="#fff6ea" />
        <Face y={50} gap={11} eyeSize={0.9} />
        <path d="M46 58l4 6 4-6z" fill="#f0c14e" />
      </>
    ),
  },
  biscuit: {
    hat: [50, 38],
    neck: 84,
    grown: (
      <>
        <circle cx="26" cy="74" r="6" fill="#fffaf2" />
        <circle cx="74" cy="74" r="6" fill="#fffaf2" />
      </>
    ),
    base: (
      <>
        <ellipse cx="38" cy="22" rx="8" ry="20" fill="#ecd5b4" />
        <ellipse cx="62" cy="22" rx="8" ry="20" fill="#ecd5b4" />
        <ellipse cx="38" cy="22" rx="4" ry="13" fill="#f6c3b2" />
        <ellipse cx="62" cy="22" rx="4" ry="13" fill="#f6c3b2" />
        <ellipse cx="50" cy="88" rx="18" ry="8" fill="#ecd5b4" />
        <circle cx="50" cy="62" r="26" fill="#ecd5b4" />
        <Face y={60} />
        <ellipse cx="50" cy="66" rx="3" ry="2" fill="#df9078" />
      </>
    ),
  },
  pebble: {
    hat: [50, 30],
    neck: 82,
    grown: <circle cx="70" cy="34" r="6" fill="#df7458" />,
    base: (
      <>
        <path d="M18 74 22 52 14 46 26 38 24 26 38 28 44 16 52 26 62 16 66 30 80 26 76 40 88 46 78 54 82 74z" fill="#a8734a" />
        <ellipse cx="50" cy="88" rx="20" ry="8" fill="#c9925f" />
        <circle cx="50" cy="60" r="24" fill="#ecd5b4" />
        <Face y={58} gap={9} />
        <ellipse cx="50" cy="64" rx="3.5" ry="2.5" fill={INK} />
      </>
    ),
  },
  quartz: {
    hat: [50, 18],
    neck: 72,
    grown: (
      <g fill="#bff0e6">
        <path d="M14 30l5-7 5 7-5 7zM80 22l4-6 4 6-4 6zM84 60l3-5 3 5-3 5z" />
      </g>
    ),
    base: (
      <>
        <path d="M50 14 78 32v36L50 90 22 68V32z" fill="#9fd8cf" stroke="#9fd8cf" strokeWidth="8" strokeLinejoin="round" />
        <path d="M50 14 22 32v36l28 22z" fill="#d7f3ee" opacity=".7" />
        <path d="M58 22l12 8-5 3z" fill="#fff" />
        <Face y={52} />
      </>
    ),
  },
  maple: {
    hat: [50, 28],
    neck: 80,
    grown: (
      <path d="M68 88c12 0 20-6 22-16-4 4-8 4-12 2 2 4 0 8-4 8 0 2-2 5-6 6z" fill="#c96a4f" />
    ),
    base: (
      <>
        <circle cx="28" cy="30" r="10" fill="#c96a4f" />
        <circle cx="72" cy="30" r="10" fill="#c96a4f" />
        <circle cx="28" cy="30" r="5" fill="#fff6ea" />
        <circle cx="72" cy="30" r="5" fill="#fff6ea" />
        <ellipse cx="50" cy="88" rx="18" ry="8" fill="#7a4a3a" />
        <circle cx="50" cy="56" r="27" fill="#df7458" />
        <path d="M50 58c-12 0-20 6-20 13a20 15 0 0 0 40 0c0-7-8-13-20-13z" fill="#fff6ea" />
        <ellipse cx="38" cy="42" rx="6" ry="3" fill="#fff6ea" />
        <ellipse cx="62" cy="42" rx="6" ry="3" fill="#fff6ea" />
        <Face y={52} />
      </>
    ),
  },
};


/* ---------- The parts kit: ears, tails and special shapes for the other 22 Pals ---------- */

function Ears({ type, color, inner }) {
  switch (type) {
    case 'cat':
      return (
        <>
          <path d="M27 40 31 13l17 18zM73 40 69 13 52 31z" fill={color} />
          <path d="M32 33l2-12 8 9zM68 33l-2-12-8 9z" fill={inner} />
        </>
      );
    case 'bear':
      return (
        <>
          <circle cx="29" cy="34" r="10" fill={color} />
          <circle cx="71" cy="34" r="10" fill={color} />
          <circle cx="29" cy="34" r="5" fill={inner} />
          <circle cx="71" cy="34" r="5" fill={inner} />
        </>
      );
    case 'mouse':
      return (
        <>
          <circle cx="26" cy="34" r="14" fill={color} />
          <circle cx="74" cy="34" r="14" fill={color} />
          <circle cx="26" cy="34" r="8" fill={inner} />
          <circle cx="74" cy="34" r="8" fill={inner} />
        </>
      );
    case 'floppy':
      return (
        <>
          <ellipse cx="24" cy="54" rx="8" ry="16" fill={color} transform="rotate(18 24 54)" />
          <ellipse cx="76" cy="54" rx="8" ry="16" fill={color} transform="rotate(-18 76 54)" />
        </>
      );
    case 'pig':
      return <path d="M29 38 30 22l14 10zM71 38 70 22 56 32z" fill={color} />;
    case 'deer':
      return (
        <>
          <ellipse cx="25" cy="40" rx="11" ry="6" fill={color} transform="rotate(-25 25 40)" />
          <ellipse cx="75" cy="40" rx="11" ry="6" fill={color} transform="rotate(25 75 40)" />
        </>
      );
    case 'unicorn':
      return (
        <>
          <path d="M31 38 33 20l12 12zM69 38 67 20 55 32z" fill={color} />
          <path d="M46 30 50 4l4 26z" fill="#f0c14e" />
          <path d="M47 22h6M48 14h4" stroke="#fffaf2" strokeWidth="2" />
        </>
      );
    case 'dragon':
      return <path d="M34 34 30 14l12 14zM66 34 70 14 58 28z" fill={inner} />;
    case 'antenna':
      return (
        <>
          <path d="M42 32Q38 16 30 12M58 32Q62 16 70 12" stroke="#5f554c" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="29" cy="11" r="5" fill={inner} />
          <circle cx="71" cy="11" r="5" fill={inner} />
        </>
      );
    case 'crest':
      return <path d="M44 32c-2-8 0-14 4-16M50 31c0-9 2-15 6-17M56 32c1-6 4-10 8-11" stroke={inner} strokeWidth="5" strokeLinecap="round" fill="none" />;
    case 'wool':
      return (
        <g fill={inner}>
          {[26, 36, 46, 56, 66, 74].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 32 : 36} r="10" />
          ))}
        </g>
      );
    case 'frog':
      return (
        <>
          <circle cx="36" cy="34" r="12" fill={color} />
          <circle cx="64" cy="34" r="12" fill={color} />
        </>
      );
    case 'cap':
      return (
        <>
          <path d="M18 46a32 26 0 0 1 64 0c0 4-6 6-32 6s-32-2-32-6z" fill="#df7458" />
          <circle cx="36" cy="34" r="5" fill="#fffaf2" />
          <circle cx="58" cy="28" r="6" fill="#fffaf2" />
          <circle cx="70" cy="40" r="3.5" fill="#fffaf2" />
        </>
      );
    default:
      return null;
  }
}

function Tail({ type, color, inner }) {
  switch (type) {
    case 'fluffy':
      return <circle cx="74" cy="82" r="9" fill={inner} />;
    case 'long':
      return <path d="M66 88c14 0 22-10 18-22" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />;
    case 'thin':
      return <path d="M66 90c16 2 26-6 22-18" stroke={inner} strokeWidth="3" strokeLinecap="round" fill="none" />;
    case 'curl':
      return <path d="M68 86c8 0 10-8 4-8s-4 6 2 6" stroke={inner} strokeWidth="3.5" strokeLinecap="round" fill="none" />;
    case 'striped':
      return (
        <g>
          <path d="M66 88c14 0 22-10 18-24" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M78 84l5-4M83 74l6-1" stroke="#4a3e36" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'wings':
      return (
        <>
          <ellipse cx="28" cy="80" rx="7" ry="12" fill={inner} transform="rotate(30 28 80)" />
          <ellipse cx="72" cy="80" rx="7" ry="12" fill={inner} transform="rotate(-30 72 80)" />
        </>
      );
    case 'flippers':
      return (
        <>
          <ellipse cx="28" cy="86" rx="10" ry="5" fill={inner} transform="rotate(-20 28 86)" />
          <ellipse cx="72" cy="86" rx="10" ry="5" fill={inner} transform="rotate(20 72 86)" />
        </>
      );
    case 'antlers':
      return <path d="M36 32 30 14l-6 4M30 14l4-6M64 32l6-18 6 4M70 14l-4-6" stroke="#a8734a" strokeWidth="4" strokeLinecap="round" fill="none" />;
    case 'mane':
      return <path d="M68 30c10 4 14 14 10 24-2-6-6-8-10-8 4-6 2-12 0-16z" fill="#f6c3b2" />;
    case 'batWings':
      return (
        <>
          <path d="M30 70 8 58l6 14-4 6z" fill={inner} />
          <path d="M70 70l22-12-6 14 4 6z" fill={inner} />
        </>
      );
    case 'shellSpiral':
      return <path d="M76 64a8 8 0 1 1-8-8 5 5 0 1 1 5 5" stroke="#c97a52" strokeWidth="3" fill="none" />;
    case 'stripes':
      return <path d="M36 82h28M38 90h24" stroke="#4a3e36" strokeWidth="4" strokeLinecap="round" />;
    case 'puffs':
      return (
        <g fill="#fffaf2">
          <circle cx="16" cy="70" r="6" />
          <circle cx="84" cy="68" r="5" />
        </g>
      );
    case 'twinkles':
      return (
        <g fill="#f2a67e">
          <circle cx="18" cy="30" r="3" />
          <circle cx="84" cy="36" r="2.5" />
        </g>
      );
    default:
      return null;
  }
}

function Marking({ type, color }) {
  switch (type) {
    case 'snout':
      return (
        <g>
          <ellipse cx="50" cy="65" rx="8" ry="5.5" fill="#f2a0a0" />
          <circle cx="47" cy="65" r="1.6" fill="#3b1a08" />
          <circle cx="53" cy="65" r="1.6" fill="#3b1a08" />
        </g>
      );
    case 'beak':
      return <path d="M45 62h10l-5 6z" fill="#f2a67e" />;
    case 'nose':
      return <ellipse cx="50" cy="64" rx="5" ry="3.5" fill="#3b1a08" />;
    case 'bigNose':
      return <ellipse cx="50" cy="63" rx="6" ry="8" fill="#5f554c" />;
    case 'mask':
      return <path d="M24 50c8-6 18-4 26 0 8-4 18-6 26 0-2 8-10 10-18 8-4-2-6-2-8-2s-4 0-8 2c-8 2-16 0-18-8z" fill="#5f554c" />;
    case 'spots':
      return (
        <g fill="#fffaf2">
          <circle cx="34" cy="40" r="2.5" />
          <circle cx="66" cy="38" r="2" />
          <circle cx="62" cy="46" r="1.6" />
        </g>
      );
    case 'belly':
      return <ellipse cx="50" cy="66" rx="14" ry="10" fill={color} />;
    case 'whiskers':
      return <path d="M24 62h10M24 68l10-2M76 62H66M76 68l-10-2" stroke="#7d6e63" strokeWidth="1.8" strokeLinecap="round" />;
    default:
      return null;
  }
}

/** Builds a Pal from parts: head and body colors, ears, a signature tail/feature and face markings. */
function partsPal({ color, inner, belly = null, ears, tail, marks = [], shape = 'chibi', faceY = 54, gap = 10 }) {
  const head =
    shape === 'cloud' ? (
      <g fill={color}>
        <circle cx="34" cy="58" r="16" />
        <circle cx="50" cy="48" r="20" />
        <circle cx="66" cy="58" r="16" />
        <rect x="26" y="56" width="48" height="18" rx="9" />
      </g>
    ) : shape === 'star' ? (
      <path d="M50 18l10 20 22 3-16 15 4 22-20-11-20 11 4-22-16-15 22-3z" fill={color} stroke={color} strokeWidth="6" strokeLinejoin="round" />
    ) : (
      <circle cx="50" cy="56" r="26" fill={color} />
    );
  const body =
    shape === 'octopus' ? (
      <path d="M30 74c-4 10-10 14-14 14M40 78c-2 8-4 12-8 14M50 80v14M60 78c2 8 4 12 8 14M70 74c4 10 10 14 14 14" stroke={color} strokeWidth="7" strokeLinecap="round" fill="none" />
    ) : shape === 'snail' ? (
      <>
        <circle cx="70" cy="60" r="20" fill={inner} />
        <ellipse cx="50" cy="88" rx="30" ry="7" fill={color} />
      </>
    ) : shape === 'chibi' ? (
      <ellipse cx="50" cy="86" rx="18" ry="9" fill={color} />
    ) : null;
  return {
    hat: [50, shape === 'star' ? 22 : 32],
    neck: shape === 'cloud' ? 74 : 80,
    grown: <Tail type={tail} color={color} inner={inner} />,
    base: (
      <>
        {body}
        <Ears type={ears} color={color} inner={inner} />
        {head}
        {belly && <Marking type="belly" color={belly} />}
        {marks.map((mark) => (
          <Marking key={mark} type={mark} color={belly} />
        ))}
        {ears === 'cap' && <Ears type="cap" color={color} inner={inner} />}
        <Face y={faceY} gap={gap} />
        {marks.includes('snout') && <Marking type="snout" />}
        {marks.includes('beak') && <Marking type="beak" />}
        {marks.includes('nose') && <Marking type="nose" />}
      </>
    ),
  };
}

const PARTS_PALS = {
  mochi: { color: '#f2c9a0', inner: '#fbe5d6', ears: 'cat', tail: 'long', marks: ['whiskers'] },
  waffles: { color: '#e2c08d', inner: '#fffaf2', ears: 'floppy', tail: 'fluffy', marks: ['nose'] },
  peep: { color: '#ffd45e', inner: '#f2a67e', ears: 'crest', tail: 'wings', marks: ['beak'] },
  bruno: { color: '#b98256', inner: '#ecd5b4', ears: 'bear', tail: 'fluffy', belly: '#ecd5b4', marks: ['nose'], faceY: 52 },
  truffle: { color: '#f6c3b2', inner: '#df9078', ears: 'pig', tail: 'curl', marks: ['snout'], faceY: 50 },
  ribbit: { color: '#8cc49a', inner: '#5a9e6c', ears: 'frog', tail: 'twinkles', belly: '#dcefd5', faceY: 36, gap: 14 },
  cotton: { color: '#e8d4c0', inner: '#fffaf2', ears: 'wool', tail: 'fluffy', marks: ['nose'] },
  squeak: { color: '#cfc4b6', inner: '#f6c3b2', ears: 'mouse', tail: 'thin', marks: ['whiskers'] },
  otto: { color: '#a8734a', inner: '#ecd5b4', ears: 'bear', tail: 'long', belly: '#ecd5b4', marks: ['nose', 'whiskers'], faceY: 52 },
  buzz: { color: '#ffd45e', inner: '#4a3e36', ears: 'antenna', tail: 'stripes', faceY: 54 },
  kiko: { color: '#b9ad9f', inner: '#f6c3b2', ears: 'mouse', tail: 'fluffy', marks: ['bigNose'], faceY: 50, gap: 13 },
  splash: { color: '#cfc4b6', inner: '#9a8d80', ears: 'none', tail: 'flippers', marks: ['whiskers', 'nose'] },
  shroomy: { color: '#f8efe0', inner: '#df7458', ears: 'cap', tail: 'twinkles', faceY: 60 },
  bandit: { color: '#b9ad9f', inner: '#f8efe0', ears: 'cat', tail: 'striped', marks: ['mask', 'nose'] },
  waddles: { color: '#5f554c', inner: '#f2a67e', ears: 'none', tail: 'wings', belly: '#fffaf2', marks: ['beak'] },
  fawn: { color: '#d8946a', inner: '#ecd5b4', ears: 'deer', tail: 'antlers', marks: ['spots', 'nose'] },
  shelly: { color: '#9fcf9a', inner: '#f2a67e', ears: 'antenna', tail: 'shellSpiral', shape: 'snail', faceY: 54 },
  inky: { color: '#f6b0a0', inner: '#df7458', ears: 'none', tail: 'twinkles', shape: 'octopus', faceY: 52 },
  puff: { color: '#f4f0e8', inner: '#cfe9e2', ears: 'none', tail: 'puffs', shape: 'cloud', faceY: 56 },
  twinkle: { color: '#ffd45e', inner: '#f2a67e', ears: 'none', tail: 'twinkles', shape: 'star', faceY: 50, gap: 8 },
  starla: { color: '#fffaf2', inner: '#f6c3b2', ears: 'unicorn', tail: 'mane' },
  ziggy: { color: '#7cc8b5', inner: '#3f8a64', ears: 'dragon', tail: 'batWings', belly: '#dcefe9' },
};

for (const [id, parts] of Object.entries(PARTS_PALS)) ART[id] = partsPal(parts);

const RADIANT_SPARKLES = 'M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z';

function Accessory({ id, hat, neck }) {
  const [hx, hy] = hat;
  switch (id) {
    case 'scarf':
      return (
        <g>
          <path d={`M30 ${neck - 4}q20 10 40 0l-2 9q-18 8-36 0z`} fill="#58ac82" />
          <path d={`M60 ${neck + 2}l8 14-10-2z`} fill="#3f8a64" />
        </g>
      );
    case 'bow':
      return (
        <g fill="#df7458">
          <path d={`M50 ${neck}l-12-7v14zM50 ${neck}l12-7v14z`} />
          <circle cx="50" cy={neck} r="4" fill="#b05a40" />
        </g>
      );
    case 'partyHat':
      return (
        <g transform={`translate(${hx} ${hy}) rotate(-10)`}>
          <path d="M-12 0 0-28 12 0z" fill="#f2a67e" />
          <path d="M-8-8h16M-4-18h8" stroke="#fffaf2" strokeWidth="3" />
          <circle cx="0" cy="-29" r="4.5" fill="#f0c14e" />
        </g>
      );
    case 'flowerCrown':
      return (
        <g>
          {[-16, -8, 0, 8, 16].map((dx, i) => (
            <g key={dx} transform={`translate(${hx + dx} ${hy + Math.abs(dx) * 0.25})`}>
              <circle r="4.2" fill={['#f6c3b2', '#f0c14e', '#fffaf2', '#f0c14e', '#f6c3b2'][i]} />
              <circle r="1.6" fill="#df7458" />
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** Stage looks: size, and which extras each form adds (see PAL_STAGES in src/game/pals.js). */
const STAGE_LOOKS = [
  { scale: 0.72 },
  { scale: 0.84, feature: true },
  { scale: 0.94, feature: true, gem: true },
  { scale: 1, feature: true, gem: true, aura: 0.22 },
  { scale: 1.04, feature: true, gem: true, aura: 0.38, wings: true, halo: true, sparkles: true },
];

/** A Pal in one of its five forms, optionally wearing an accessory. Decorative unless `label` is given. */
export default function PalArt({ palId, stage = 0, accessory = null, size = 64, label, className }) {
  const art = ART[palId];
  if (!art) return null;
  const look = STAGE_LOOKS[palStage(stage).index];
  const [hx, hy] = art.hat;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {look.aura && <circle cx="50" cy="56" r="46" fill="#ffe27a" opacity={look.aura} />}
      <ellipse cx="50" cy="95" rx="24" ry="4" fill="rgba(60,40,20,.14)" />
      <g transform={`translate(50 94) scale(${look.scale}) translate(-50 -94)`}>
        {look.wings && (
          <g fill="#fffaf2" opacity=".9">
            <ellipse cx="18" cy="56" rx="18" ry="9" transform="rotate(-30 18 56)" />
            <ellipse cx="82" cy="56" rx="18" ry="9" transform="rotate(30 82 56)" />
          </g>
        )}
        {look.feature && art.grown}
        {art.base}
        {look.gem && <path d={`M${hx} ${hy + 6}l4 5-4 5-4-5z`} fill="#f0c14e" />}
        {accessory && <Accessory id={accessory} hat={art.hat} neck={art.neck} />}
        {look.halo && !accessory && <ellipse cx={hx} cy={hy - 10} rx="14" ry="4" fill="none" stroke="#f0c14e" strokeWidth="3" />}
      </g>
      {look.sparkles && (
        <g fill="#f0c14e">
          <path d={RADIANT_SPARKLES} transform="translate(4 8) scale(.6)" />
          <path d={RADIANT_SPARKLES} transform="translate(80 14) scale(.5)" />
          <path d={RADIANT_SPARKLES} transform="translate(84 62) scale(.4)" />
        </g>
      )}
    </svg>
  );
}
