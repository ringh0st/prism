/*
 * The weekly theme collections' Grove decor, each in a 100×100 box standing on the ground at y≈95
 * (like GroveItemShape.jsx).
 */
const WOOD = '#B07A4E';
const WOOD_DARK = '#8A5A36';
const STONE = '#CFC4B4';
const STONE_DARK = '#B3A592';
const LEAF = '#6DB58C';
const LEAF_DARK = '#4F9A72';
const WATER = '#9ED8CB';
const HONEY = '#F0C14E';
const CREAM = '#FFF8EA';
const SNOW = '#FBFBF7';

export const THEME_SHAPES = {
  // ---------- Elven Woods ----------
  glowTree: (
    <>
      <path d="M46 95V54h8v41z" fill={WOOD_DARK} />
      <path d="M50 70l-10-8M50 64l10-9" stroke={WOOD_DARK} strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="40" r="28" fill={LEAF_DARK} />
      <circle cx="38" cy="32" r="16" fill={LEAF} />
      {[
        [30, 46],
        [62, 30],
        [56, 52],
        [42, 22],
        [68, 46],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="7" fill="#FFE38A" opacity=".35" />
          <circle cx={x} cy={y} r="3" fill={HONEY} />
        </g>
      ))}
    </>
  ),
  moonPool: (
    <>
      <ellipse cx="50" cy="82" rx="42" ry="13" fill={STONE_DARK} />
      <ellipse cx="50" cy="80" rx="36" ry="10" fill={WATER} />
      <path d="M44 76a6 6 0 1 0 4 9 5 5 0 1 1-4-9z" fill="#FFF1C2" />
      <path d="M22 78q4-2 8 0M66 84q4-2 8 0" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity=".8" />
      <path d="M14 76c-2-10 2-18 6-20M86 76c2-10-2-18-6-20" stroke={LEAF_DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  elvenTower: (
    <>
      <path d="M32 95V40h36v55z" fill={STONE} />
      <path d="M32 54h36M32 70h36M44 40v14M56 54v16M44 70v25" stroke={STONE_DARK} strokeWidth="2.5" />
      <path d="M26 42L50 8l24 34z" fill={LEAF_DARK} />
      <path d="M50 8v-6" stroke={WOOD_DARK} strokeWidth="2.5" />
      <path d="M50 2l8 3-8 3z" fill={HONEY} />
      <path d="M43 95V80a7 7 0 0 1 14 0v15z" fill={WOOD} />
      <path d="M46 60a4 4 0 0 1 8 0v8h-8z" fill={HONEY} />
      <path d="M32 90c6-8 4-16-2-22M68 88c-4-6-2-14 4-18" stroke={LEAF} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  // ---------- Autumn Harvest ----------
  hayBench: (
    <>
      <rect x="12" y="62" width="76" height="32" rx="6" fill="#E9C97A" />
      <path d="M12 72h76M12 84h76" stroke="#C9A55A" strokeWidth="2.5" />
      <path d="M20 62v32M80 62v32" stroke="#B08A3E" strokeWidth="3" />
      <path d="M18 62l-4-6M30 62l-2-7M46 62l2-6M62 62l-1-7M78 62l4-6" stroke="#E9C97A" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="70" cy="58" rx="9" ry="7" fill="#E98A4E" />
      <path d="M70 51v-4" stroke="#6B8A3A" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  appleTree: (
    <>
      <path d="M45 95V56h10v39z" fill={WOOD_DARK} />
      <circle cx="50" cy="38" r="30" fill={LEAF} />
      <circle cx="34" cy="46" r="16" fill={LEAF_DARK} opacity=".6" />
      {[
        [36, 30],
        [58, 26],
        [64, 46],
        [44, 50],
        [50, 36],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="4.5" fill="#DF7458" />
      ))}
      <circle cx="30" cy="92" r="4.5" fill="#DF7458" />
    </>
  ),
  jackLanterns: (
    <>
      {[
        [26, 80, 1],
        [56, 76, 1.25],
        [80, 84, 0.85],
      ].map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
          <circle cx="0" cy="0" r="16" fill="#FFE38A" opacity=".3" />
          <ellipse cx="0" cy="2" rx="13" ry="11" fill="#E98A4E" />
          <path d="M-5-8c-2 5-2 14 0 20M5-8c2 5 2 14 0 20" stroke="#C96F38" strokeWidth="1.5" fill="none" />
          <path d="M-6-1l2-4 2 4zM2-1l2-4 2 4zM-6 5q6 4 12 0" fill="#FFE38A" stroke="#FFE38A" strokeWidth="1" />
          <path d="M0-9v-4" stroke="#6B8A3A" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  // ---------- Winter Wonderland ----------
  snowman: (
    <>
      <ellipse cx="50" cy="94" rx="26" ry="4" fill="rgba(60, 40, 20, 0.12)" />
      <circle cx="50" cy="74" r="20" fill={SNOW} />
      <circle cx="50" cy="44" r="14" fill={SNOW} />
      <circle cx="45" cy="41" r="1.8" fill="#4A3E36" />
      <circle cx="55" cy="41" r="1.8" fill="#4A3E36" />
      <path d="M50 45l10 3-10 2z" fill="#E98A4E" />
      <path d="M36 54q14 6 28 0l-2 6q-12 5-24 0z" fill="#DF7458" />
      <path d="M36 28h28v4H36zM40 28V16h20v12z" fill="#4A3E36" />
      <circle cx="50" cy="68" r="2" fill="#4A3E36" />
      <circle cx="50" cy="78" r="2" fill="#4A3E36" />
      <path d="M31 66l-12-8M69 66l12-8" stroke={WOOD_DARK} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  iceLantern: (
    <>
      <circle cx="50" cy="56" r="26" fill="#DFF3F4" opacity=".5" />
      <path d="M50 18v10" stroke="#9FB7BA" strokeWidth="3" />
      <path d="M36 32h28l-4 44H40z" fill="#CFEEF0" />
      <path d="M40 32h20l-3 40H43z" fill="#FFF6D0" />
      <circle cx="50" cy="54" r="6" fill={HONEY} />
      <rect x="34" y="28" width="32" height="6" rx="3" fill="#9FB7BA" />
      <rect x="36" y="76" width="28" height="7" rx="3" fill="#9FB7BA" />
      <path d="M44 83l-2 12M56 83l2 12" stroke="#9FB7BA" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  snowCabin: (
    <>
      <path d="M20 95V56h60v39z" fill={WOOD} />
      <path d="M20 66h60M20 76h60M20 86h60" stroke={WOOD_DARK} strokeWidth="2" />
      <path d="M12 58L50 26l38 32z" fill={WOOD_DARK} />
      <path d="M10 58q8-6 16 0t16 0 16 0 16 0 16 0L50 22z" fill={SNOW} />
      <path d="M43 95V76h14v19z" fill={WOOD_DARK} />
      <rect x="26" y="66" width="12" height="10" rx="2" fill={HONEY} />
      <rect x="62" y="66" width="12" height="10" rx="2" fill={HONEY} />
      <path d="M66 36V22h8v20" fill={STONE_DARK} />
      <path d="M70 20q-6-6 0-12" stroke="#E6E1D6" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  // ---------- Pirate Cove ----------
  treasureChest: (
    <>
      <circle cx="50" cy="66" r="30" fill="#FFE38A" opacity=".3" />
      <path d="M20 66h60v26H20z" fill={WOOD} />
      <path d="M20 66c0-16 12-22 30-22s30 6 30 22z" fill={WOOD_DARK} />
      <path d="M20 66h60M30 46v46M70 46v46" stroke="#C99A2E" strokeWidth="4" />
      <rect x="44" y="62" width="12" height="12" rx="2" fill={HONEY} />
      <circle cx="50" cy="68" r="2" fill="#5A4636" />
      {[
        [30, 60],
        [42, 54],
        [58, 55],
        [70, 61],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill={HONEY} />
      ))}
    </>
  ),
  pirateFlag: (
    <>
      <path d="M24 20q26-10 52 0" stroke="#5A4636" strokeWidth="1.5" fill="none" />
      {[24, 36, 48, 60, 72].map((x, i) => (
        <path
          key={x}
          d={`M${x} ${20 - Math.sin(((x - 24) / 52) * Math.PI) * 5}l6 0-3 9z`}
          transform="translate(-3 0)"
          fill={i % 2 ? '#DF7458' : '#4A3E36'}
        />
      ))}
      <path d="M50 30v40" stroke={WOOD_DARK} strokeWidth="3" />
      <path d="M50 30h26l-6 9 6 9H50z" fill="#4A3E36" />
      <circle cx="61" cy="38" r="4" fill={CREAM} />
      <path d="M57 44l8 0" stroke={CREAM} strokeWidth="2" />
    </>
  ),
  littleShip: (
    <>
      <path d="M8 86q10-4 20 0t20 0 20 0 20 0 8 0V96H8z" fill={WATER} />
      <path d="M18 74h64l-8 14H26z" fill={WOOD} />
      <path d="M18 74h64" stroke={WOOD_DARK} strokeWidth="3" />
      <path d="M50 74V24" stroke={WOOD_DARK} strokeWidth="3" />
      <path d="M50 28c14 4 20 14 20 24H50z" fill={CREAM} />
      <path d="M50 34c-10 4-14 12-14 20h14z" fill="#F6E8D0" />
      <path d="M50 24h12l-4 4 4 4H50z" fill="#DF7458" />
      <circle cx="36" cy="80" r="2.5" fill={HONEY} />
      <circle cx="64" cy="80" r="2.5" fill={HONEY} />
    </>
  ),
};
