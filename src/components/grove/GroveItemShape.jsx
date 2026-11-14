import { THEME_SHAPES } from './themeDecorShapes.jsx';

/* Grove decor, each drawn in a 100×100 box standing on the ground at y≈95. Illustration colors are fixed (like the map). */
const WOOD = '#B07A4E';
const WOOD_DARK = '#8A5A36';
const STONE = '#CFC4B4';
const STONE_DARK = '#B3A592';
const LEAF = '#6DB58C';
const LEAF_DARK = '#4F9A72';
const WATER = '#9ED8CB';
const HONEY = '#F0C14E';
const PEACH = '#F2A67E';
const TERRACOTTA = '#DF7458';
const CREAM = '#FFF8EA';
const INK = '#5A4636';

function Glow({ cx, cy, r, color = '#FFE38A' }) {
  return <circle cx={cx} cy={cy} r={r} fill={color} opacity=".35" />;
}

const SHAPES = {
  mushroomHouse: (
    <>
      <path d="M30 95V58h40v37z" fill={CREAM} />
      <path d="M30 62h40" stroke="#EADFC9" strokeWidth="4" />
      <path d="M43 95V80a7 7 0 0 1 14 0v15z" fill={WOOD} />
      <circle cx="54" cy="87" r="1.5" fill={HONEY} />
      <circle cx="38" cy="72" r="4.5" fill={HONEY} />
      <circle cx="62" cy="72" r="4.5" fill={HONEY} />
      <path d="M8 60C8 30 30 16 50 16s42 14 42 44c0 3-3 5-6 5H14c-3 0-6-2-6-5z" fill={TERRACOTTA} />
      <circle cx="30" cy="38" r="7" fill={CREAM} />
      <circle cx="56" cy="28" r="5" fill={CREAM} />
      <circle cx="72" cy="46" r="6" fill={CREAM} />
      <circle cx="46" cy="52" r="4" fill={CREAM} />
    </>
  ),
  acornCottage: (
    <>
      <path d="M50 18v8" stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="50" cy="68" rx="34" ry="28" fill="#C98B55" />
      <path d="M14 52c0-16 16-26 36-26s36 10 36 26c0 4-3 6-7 6H21c-4 0-7-2-7-6z" fill={WOOD_DARK} />
      <path d="M22 44h56M18 52h64M30 36h40" stroke="#74482A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 95V80a8 8 0 0 1 16 0v15z" fill={WOOD_DARK} />
      <circle cx="31" cy="72" r="5" fill={HONEY} />
      <circle cx="69" cy="72" r="5" fill={HONEY} />
      <path d="M58 30c8-6 16-4 20 2-7 3-14 3-20-2z" fill={LEAF} />
    </>
  ),
  treehouse: (
    <>
      <path d="M44 95V40h12v55z" fill={WOOD_DARK} />
      <path d="M44 95c-4 0-8 2-10 4M56 95c4 0 8 2 10 4" stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round" />
      <circle cx="26" cy="30" r="18" fill={LEAF_DARK} />
      <circle cx="74" cy="30" r="18" fill={LEAF_DARK} />
      <circle cx="50" cy="20" r="20" fill={LEAF} />
      <path d="M24 56h52v6H24z" fill={WOOD} />
      <path d="M30 56V40h40v16z" fill={CREAM} />
      <path d="M24 42l26-18 26 18z" fill={TERRACOTTA} />
      <path d="M45 56V46h10v10z" fill={WOOD} />
      <circle cx="37" cy="47" r="3.5" fill={HONEY} />
      <circle cx="63" cy="47" r="3.5" fill={HONEY} />
      <path d="M66 62v33M76 62v33M66 70h10M66 79h10M66 88h10" stroke={WOOD} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  logBench: (
    <>
      <rect x="20" y="78" width="12" height="17" rx="3" fill={WOOD_DARK} />
      <rect x="68" y="78" width="12" height="17" rx="3" fill={WOOD_DARK} />
      <rect x="10" y="66" width="80" height="16" rx="8" fill={WOOD} />
      <ellipse cx="86" cy="74" rx="5" ry="8" fill="#D9A877" />
      <path d="M30 72h24M60 76h14" stroke={WOOD_DARK} strokeWidth="2" strokeLinecap="round" />
      <path d="M50 66c-2-6 2-10 6-8" stroke={LEAF} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  treeSwing: (
    <>
      <path d="M84 95V20" stroke={WOOD_DARK} strokeWidth="10" strokeLinecap="round" />
      <path d="M84 24C64 18 34 18 14 26" stroke={WOOD_DARK} strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="22" r="10" fill={LEAF} />
      <circle cx="88" cy="14" r="12" fill={LEAF} />
      <path d="M32 22v50M58 20v52" stroke="#D9C2A0" strokeWidth="2.5" />
      <rect x="26" y="70" width="38" height="7" rx="3" fill={TERRACOTTA} />
    </>
  ),
  hammock: (
    <>
      <path d="M12 95V40M88 95V40" stroke={WOOD_DARK} strokeWidth="7" strokeLinecap="round" />
      <path d="M12 46c14 30 62 30 76 0" fill={PEACH} />
      <path d="M12 46c14 22 62 22 76 0" fill="none" stroke={CREAM} strokeWidth="3" strokeDasharray="6 5" />
      <path d="M12 46c14 30 62 30 76 0" fill="none" stroke="#D98A62" strokeWidth="2" />
      <circle cx="12" cy="36" r="8" fill={LEAF} />
      <circle cx="88" cy="36" r="8" fill={LEAF} />
    </>
  ),
  fireflyJar: (
    <>
      <rect x="28" y="84" width="44" height="11" rx="4" fill={WOOD} />
      <ellipse cx="50" cy="84" rx="22" ry="4" fill="#D9A877" />
      <Glow cx={50} cy={62} r={26} />
      <rect x="36" y="44" width="28" height="38" rx="9" fill="#FFF4D2" opacity=".85" />
      <rect x="38" y="38" width="24" height="7" rx="2" fill={WOOD_DARK} />
      <circle cx="45" cy="58" r="3" fill={HONEY} />
      <circle cx="55" cy="66" r="3" fill={HONEY} />
      <circle cx="47" cy="73" r="2.5" fill={HONEY} />
      <circle cx="74" cy="40" r="2.5" fill={HONEY} />
      <circle cx="24" cy="50" r="2" fill={HONEY} />
    </>
  ),
  glowShrooms: (
    <>
      <Glow cx={34} cy={66} r={18} color="#BFF0E3" />
      <Glow cx={66} cy={74} r={14} color="#BFF0E3" />
      <path d="M32 95V72h6v23zM64 95V80h5v15zM50 95V84h4v11z" fill={CREAM} />
      <path d="M20 74c0-12 8-18 15-18s15 6 15 18z" fill="#7FD3C0" />
      <path d="M55 82c0-9 6-13 11.5-13S78 73 78 82z" fill="#7FD3C0" />
      <path d="M44 86c0-6 4-9 8-9s8 3 8 9z" fill="#A8E3D5" />
      <circle cx="30" cy="66" r="2.5" fill={CREAM} />
      <circle cx="40" cy="70" r="2" fill={CREAM} />
      <circle cx="66" cy="76" r="2" fill={CREAM} />
    </>
  ),
  lanternString: (
    <>
      <path d="M10 95V24M90 95V24" stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round" />
      <path d="M10 28Q50 52 90 28" stroke={INK} strokeWidth="1.5" fill="none" />
      {[
        [26, 37, HONEY],
        [42, 42, PEACH],
        [58, 42, HONEY],
        [74, 37, PEACH],
      ].map(([x, y, color]) => (
        <g key={x}>
          <Glow cx={x} cy={y + 9} r={11} />
          <path d={`M${x} ${y}v3`} stroke={INK} strokeWidth="1.5" />
          <rect x={x - 6} y={y + 3} width="12" height="14" rx="5" fill={color} />
          <path d={`M${x - 3} ${y + 3}h6M${x - 3} ${y + 17}h6`} stroke={WOOD_DARK} strokeWidth="2" />
        </g>
      ))}
    </>
  ),
  flowerPatch: (
    <>
      <path d="M10 95c4-10 12-14 20-12 6-8 18-8 24 0 8-4 18 0 22 6 6-2 12 2 14 6z" fill={LEAF} />
      {[
        [22, 76, PEACH],
        [40, 68, HONEY],
        [58, 74, TERRACOTTA],
        [76, 70, CREAM],
        [32, 86, CREAM],
        [66, 86, HONEY],
      ].map(([x, y, color]) => (
        <g key={`${x}-${y}`}>
          <path d={`M${x} ${y + 4}v10`} stroke={LEAF_DARK} strokeWidth="2" />
          <circle cx={x - 4} cy={y} r="4" fill={color} />
          <circle cx={x + 4} cy={y} r="4" fill={color} />
          <circle cx={x} cy={y - 4} r="4" fill={color} />
          <circle cx={x} cy={y + 4} r="4" fill={color} />
          <circle cx={x} cy={y} r="3" fill={color === HONEY ? WOOD : HONEY} />
        </g>
      ))}
    </>
  ),
  berryBush: (
    <>
      <circle cx="30" cy="74" r="20" fill={LEAF_DARK} />
      <circle cx="70" cy="74" r="20" fill={LEAF_DARK} />
      <circle cx="50" cy="62" r="24" fill={LEAF} />
      <path d="M12 95h76" stroke={LEAF_DARK} strokeWidth="6" strokeLinecap="round" />
      {[
        [38, 56],
        [58, 50],
        [64, 68],
        [30, 74],
        [46, 76],
        [74, 80],
        [52, 64],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="4.5" fill={TERRACOTTA} />
          <circle cx={x - 1.5} cy={y - 1.5} r="1.3" fill={CREAM} />
        </g>
      ))}
    </>
  ),
  pumpkinPatch: (
    <>
      <path d="M8 92c14-8 30-6 44-12s28-4 40 4" stroke={LEAF_DARK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="34" cy="80" rx="22" ry="16" fill={PEACH} />
      <path d="M34 64v32M22 66c-4 8-4 22 0 28M46 66c4 8 4 22 0 28" stroke="#D98A62" strokeWidth="2" fill="none" />
      <path d="M34 64c0-6 3-9 6-10" stroke={WOOD_DARK} strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="72" cy="85" rx="15" ry="11" fill={TERRACOTTA} />
      <path d="M72 74v22M64 76c-3 6-3 14 0 18M80 76c3 6 3 14 0 18" stroke="#C25E45" strokeWidth="2" fill="none" />
      <path d="M72 74c0-4 2-6 4-7" stroke={WOOD_DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M44 60c6-6 14-4 16 2-6 2-12 2-16-2z" fill={LEAF} />
    </>
  ),
  lilyPond: (
    <>
      <ellipse cx="50" cy="80" rx="46" ry="16" fill={STONE} />
      <ellipse cx="50" cy="79" rx="40" ry="12" fill={WATER} />
      <path d="M26 78a8 4 0 1 0 12 2l-6-2z" fill={LEAF} />
      <path d="M60 84a9 4.5 0 1 0 14 2l-7-2z" fill={LEAF} />
      <circle cx="66" cy="81" r="3" fill="#F6B8A8" />
      <circle cx="66" cy="81" r="1.3" fill={HONEY} />
      <path d="M44 74h10M70 74h6" stroke={CREAM} strokeWidth="2" strokeLinecap="round" opacity=".8" />
      <path d="M8 76c-2-10 0-18 4-22M12 78c2-8 6-12 8-14" stroke={LEAF_DARK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="12" cy="52" rx="3" ry="6" fill={WOOD} />
    </>
  ),
  wishingWell: (
    <>
      <path d="M26 95V66h48v29z" fill={STONE} />
      <path d="M26 74h48M26 84h48M38 66v8M58 74v10M44 84v11" stroke={STONE_DARK} strokeWidth="2" />
      <ellipse cx="50" cy="66" rx="26" ry="6" fill={STONE_DARK} />
      <ellipse cx="50" cy="66" rx="20" ry="4" fill={WATER} />
      <path d="M30 66V34M70 66V34" stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round" />
      <path d="M20 36L50 16l30 20z" fill={TERRACOTTA} />
      <path d="M32 44h36" stroke={WOOD} strokeWidth="4" strokeLinecap="round" />
      <path d="M50 44v8" stroke={INK} strokeWidth="1.5" />
      <path d="M44 52h12l-2 9h-8z" fill={WOOD} />
    </>
  ),
  fountain: (
    <>
      <ellipse cx="50" cy="86" rx="40" ry="10" fill={STONE_DARK} />
      <ellipse cx="50" cy="84" rx="34" ry="7" fill={WATER} />
      <path d="M44 84V58h12v26z" fill={STONE} />
      <ellipse cx="50" cy="58" rx="20" ry="5" fill={STONE} />
      <ellipse cx="50" cy="57" rx="15" ry="3" fill={WATER} />
      <path d="M47 57V40h6v17z" fill={STONE} />
      <path d="M50 38c-10-12-22-6-26 14M50 38c10-12 22-6 26 14" stroke={WATER} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="36" r="4" fill="#C8EDE4" />
    </>
  ),
  kites: (
    <>
      <path d="M30 10l12 16-12 18-12-18z" fill={PEACH} />
      <path d="M30 10v34M18 26h24" stroke={CREAM} strokeWidth="1.5" />
      <path d="M30 44c-4 8 4 12 0 20s4 12 0 18" stroke={INK} strokeWidth="1.2" fill="none" />
      <path d="M26 54l4 2 4-2-4-2zM26 68l4 2 4-2-4-2z" fill={HONEY} />
      <path d="M72 20l9 12-9 14-9-14z" fill={LEAF} />
      <path d="M72 20v26M63 32h18" stroke={CREAM} strokeWidth="1.5" />
      <path d="M72 46c3 6-3 10 0 16" stroke={INK} strokeWidth="1.2" fill="none" />
      <path d="M68 54l4 2 4-2-4-2z" fill={TERRACOTTA} />
    </>
  ),
  moonStars: (
    <>
      <Glow cx={38} cy={34} r={24} color="#FFF4D2" />
      <path d="M44 14a22 22 0 1 0 12 38A18 18 0 1 1 44 14z" fill="#FFF1C2" />
      <circle cx="30" cy="34" r="2.5" fill="#F1DFA8" />
      <circle cx="36" cy="46" r="1.8" fill="#F1DFA8" />
      {[
        [70, 18, 1],
        [84, 40, 0.7],
        [62, 50, 0.6],
        [12, 16, 0.6],
      ].map(([x, y, s]) => (
        <path key={x} d="M0-8l2.4 5.6L8 0l-5.6 2.4L0 8l-2.4-5.6L-8 0l5.6-2.4z" transform={`translate(${x} ${y}) scale(${s})`} fill={HONEY} />
      ))}
    </>
  ),
  rainbow: (
    <>
      {[
        [TERRACOTTA, 44],
        [PEACH, 38],
        [HONEY, 32],
        [LEAF, 26],
        ['#7FD3C0', 20],
      ].map(([color, r]) => (
        <path key={r} d={`M${50 - r} 60a${r} ${r} 0 0 1 ${r * 2} 0`} stroke={color} strokeWidth="6.5" fill="none" />
      ))}
      <circle cx="8" cy="60" r="8" fill={CREAM} />
      <circle cx="16" cy="58" r="9" fill={CREAM} />
      <circle cx="84" cy="58" r="9" fill={CREAM} />
      <circle cx="93" cy="60" r="8" fill={CREAM} />
    </>
  ),
};

/** One piece of Grove decor as SVG content (a <g>) in a 100×100 box. */
export default function GroveItemShape({ id }) {
  return SHAPES[id] ?? THEME_SHAPES[id] ?? null;
}
