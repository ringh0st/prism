/**
 * Hand-drawn shop goods (inline SVG, 100×100), so the shop shows objects you want to collect
 * rather than icons in boxes. Decorative: the item's name is always shown next to it.
 */
const SPARK = 'M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z';
const GEM = 'M6.5 3.5h11l4 5.5L12 21 2.5 9z';

const Spark = ({ x, y, size = 18, color = '#f0c14e' }) => (
  <path d={SPARK} fill={color} transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})`} />
);

const Gem = ({ x, y, size = 30, tilt = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt}) translate(${-size / 2} ${-size / 2}) scale(${size / 24})`}>
    <path d={GEM} fill="#4fbfad" />
    <path d="M2.5 9h19L12 21z" fill="#2f8f80" opacity="0.55" />
    <path d="M6.5 3.5h11l-3 5.5h-5z" fill="#bff0e6" opacity="0.8" />
  </g>
);

const GroundShadow = ({ width = 56 }) => <ellipse cx="50" cy="92" rx={width / 2} ry="5" fill="rgba(60, 40, 20, 0.16)" />;

const ART = {
  hint: (
    <>
      <GroundShadow width={40} />
      <path d="M30 18 22 10M70 18 78 10M18 42H8M82 42h10" stroke="#f0c14e" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 12a28 28 0 0 0-16 51c3 2 4 5 4 9h24c0-4 1-7 4-9a28 28 0 0 0-16-51z" fill="#ffe08a" />
      <path d="M50 12a28 28 0 0 1 16 51c-3 2-4 5-4 9h-6c0-6 2-9 6-13a24 24 0 0 0-12-47z" fill="#f0c14e" opacity="0.7" />
      <ellipse cx="40" cy="30" rx="6" ry="9" fill="#fff" opacity="0.75" transform="rotate(-25 40 30)" />
      <rect x="37" y="72" width="26" height="7" rx="3" fill="#9c8f82" />
      <rect x="39" y="79" width="22" height="7" rx="3" fill="#7d7166" />
      <rect x="44" y="86" width="12" height="4" rx="2" fill="#5f554c" />
    </>
  ),
  lens: (
    <>
      <GroundShadow />
      <rect x="58" y="58" width="14" height="38" rx="7" fill="#a8734a" transform="rotate(-45 65 77)" />
      <rect x="58" y="58" width="5" height="38" rx="2.5" fill="#c9925f" transform="rotate(-45 65 77)" />
      <circle cx="42" cy="42" r="30" fill="#7d6e63" />
      <circle cx="42" cy="42" r="23" fill="#d7f3ee" />
      <path d="M26 38a17 17 0 0 1 16-14" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="49" cy="49" r="5" fill="#4fbfad" opacity="0.45" />
    </>
  ),
  autoturn: (
    <>
      <GroundShadow width={50} />
      <rect x="44" y="30" width="11" height="62" rx="5.5" fill="#4a3e36" transform="rotate(35 50 61)" />
      <rect x="44" y="30" width="11" height="14" rx="5.5" fill="#fffdf8" transform="rotate(35 50 61)" />
      <path d={SPARK} fill="#f0c14e" transform="translate(16 6) scale(1.9)" />
      <Spark x={78} y={22} size={14} color="#f2a67e" />
      <Spark x={74} y={50} size={10} color="#4fbfad" />
    </>
  ),
  skip: (
    <>
      <GroundShadow width={58} />
      <circle cx="50" cy="50" r="38" fill="#58ac82" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#3f8a64" strokeWidth="5" opacity="0.5" />
      <path d="M36 32v36l26-18z" fill="#fffdf8" />
      <rect x="62" y="32" width="8" height="36" rx="3" fill="#fffdf8" />
      <ellipse cx="36" cy="26" rx="10" ry="5" fill="#fff" opacity="0.35" transform="rotate(-30 36 26)" />
    </>
  ),
  sparks0: (
    <>
      <GroundShadow width={50} />
      <path d="M30 50c-6 18-2 38 20 38s26-20 20-38z" fill="#f2a67e" />
      <path d="M36 48c4-6 24-6 28 0l-4 6H40z" fill="#c97a52" />
      <path d="M38 44c0-8 24-8 24 0" stroke="#c97a52" strokeWidth="4" fill="none" />
      <Spark x={50} y={68} size={22} color="#fffdf8" />
      <Spark x={46} y={36} size={14} />
      <Spark x={60} y={30} size={10} />
    </>
  ),
  sparks1: (
    <>
      <GroundShadow width={56} />
      <rect x="26" y="30" width="48" height="58" rx="12" fill="#f8efe0" opacity="0.9" />
      <rect x="22" y="22" width="56" height="12" rx="5" fill="#a8734a" />
      <Spark x={40} y={52} size={20} />
      <Spark x={60} y={62} size={18} color="#f2a67e" />
      <Spark x={44} y={74} size={16} />
      <Spark x={60} y={44} size={12} color="#f2a67e" />
      <rect x="30" y="38" width="6" height="40" rx="3" fill="#fff" opacity="0.7" />
    </>
  ),
  sparks2: (
    <>
      <GroundShadow width={70} />
      <Spark x={34} y={30} size={22} />
      <Spark x={54} y={22} size={26} color="#f2a67e" />
      <Spark x={72} y={34} size={20} />
      <Spark x={46} y={42} size={16} color="#f2a67e" />
      <rect x="16" y="46" width="68" height="42" rx="6" fill="#a8734a" />
      <rect x="16" y="46" width="68" height="10" rx="5" fill="#c9925f" />
      <path d="M16 66h68" stroke="#8a5d3a" strokeWidth="3" />
      <Spark x={50} y={72} size={18} color="#fffdf8" />
    </>
  ),
  diamonds0: (
    <>
      <GroundShadow width={44} />
      <Gem x={50} y={58} size={64} />
    </>
  ),
  diamonds1: (
    <>
      <GroundShadow width={64} />
      <Gem x={50} y={44} size={44} />
      <Gem x={32} y={68} size={42} tilt={-8} />
      <Gem x={68} y={68} size={42} tilt={8} />
    </>
  ),
  diamonds2: (
    <>
      <GroundShadow width={74} />
      <Gem x={32} y={36} size={34} tilt={-18} />
      <Gem x={68} y={34} size={34} tilt={16} />
      <Gem x={50} y={26} size={40} />
      <path d="M14 50h72l-6 38H20z" fill="#a8734a" />
      <path d="M14 50h72v8H14z" fill="#c9925f" />
      <rect x="44" y="60" width="12" height="12" rx="3" fill="#f0c14e" />
    </>
  ),
};

export default function ShopItemArt({ art, size = 96, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {ART[art]}
    </svg>
  );
}
