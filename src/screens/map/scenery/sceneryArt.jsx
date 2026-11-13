/**
 * Hand-drawn map scenery (inline SVG). Each piece has a size in px and is drawn standing on
 * the bottom edge of its box, so it can be placed by its "feet". Purely decorative.
 */
const LEAF = '#7fbf8e';
const LEAF_DARK = '#5a9e6c';
const TRUNK = '#a8734a';
const STONE = '#b9ad9f';

const shadow = (cx, rx) => <ellipse cx={cx} cy="97" rx={rx} ry="3" fill="rgba(60, 40, 20, 0.14)" />;

export const SCENERY = {
  /* A soft patch of darker ground (grass, sand…) in the world's own tint, for texture */
  patch: {
    size: 150,
    art: (
      <g style={{ fill: 'var(--tint-b)' }} opacity="0.16">
        <ellipse cx="42" cy="82" rx="36" ry="11" />
        <ellipse cx="64" cy="78" rx="30" ry="9" />
        <ellipse cx="30" cy="76" rx="14" ry="6" />
      </g>
    ),
  },
  treeRound: {
    size: 64,
    art: (
      <>
        {shadow(50, 22)}
        <rect x="45" y="60" width="10" height="38" rx="4" fill={TRUNK} />
        <circle cx="50" cy="40" r="30" fill={LEAF} />
        <circle cx="36" cy="50" r="18" fill={LEAF_DARK} opacity="0.55" />
        <circle cx="42" cy="28" r="9" fill="#fff" opacity="0.25" />
      </>
    ),
  },
  treePine: {
    size: 60,
    art: (
      <>
        {shadow(50, 18)}
        <rect x="46" y="76" width="8" height="22" rx="3" fill={TRUNK} />
        <path d="M50 8 78 52H22z" fill={LEAF_DARK} />
        <path d="M50 30 84 80H16z" fill={LEAF} />
      </>
    ),
  },
  treeAutumn: {
    size: 64,
    art: (
      <>
        {shadow(50, 22)}
        <rect x="45" y="60" width="10" height="38" rx="4" fill={TRUNK} />
        <circle cx="50" cy="40" r="30" fill="#f2a67e" />
        <circle cx="62" cy="50" r="17" fill="#e9895f" opacity="0.7" />
        <circle cx="40" cy="28" r="9" fill="#f7d06a" opacity="0.7" />
      </>
    ),
  },
  blossomTree: {
    size: 64,
    art: (
      <>
        {shadow(50, 22)}
        <path d="M46 98V62l-10-12M54 98V60l10-10" stroke={TRUNK} strokeWidth="8" strokeLinecap="round" fill="none" />
        <circle cx="34" cy="44" r="18" fill="#f6c3b2" />
        <circle cx="64" cy="40" r="20" fill="#f6c3b2" />
        <circle cx="50" cy="28" r="20" fill="#f9d6c9" />
        <circle cx="44" cy="22" r="3" fill="#fff" />
        <circle cx="62" cy="36" r="3" fill="#fff" />
        <circle cx="34" cy="44" r="3" fill="#fff" />
      </>
    ),
  },
  palm: {
    size: 66,
    art: (
      <>
        {shadow(48, 18)}
        <path d="M52 98c-2-24 2-48 10-64" stroke={TRUNK} strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M62 32c-14-10-30-6-38 4 12-2 24 0 38-4z" fill={LEAF} />
        <path d="M62 32c12-12 28-10 34 0-12-2-22 0-34 0z" fill={LEAF_DARK} />
        <path d="M62 32c0-14 10-24 22-24-6 8-12 16-22 24z" fill={LEAF} />
        <circle cx="60" cy="38" r="4" fill="#a8734a" />
      </>
    ),
  },
  bush: {
    size: 44,
    art: (
      <>
        {shadow(50, 34)}
        <circle cx="34" cy="70" r="24" fill={LEAF_DARK} />
        <circle cx="62" cy="64" r="30" fill={LEAF} />
        <circle cx="56" cy="50" r="8" fill="#fff" opacity="0.25" />
      </>
    ),
  },
  flowers: {
    size: 36,
    art: (
      <>
        <path d="M30 98V70M50 98V60M70 98V72" stroke={LEAF_DARK} strokeWidth="5" />
        <circle cx="30" cy="66" r="9" fill="#f2a67e" />
        <circle cx="50" cy="56" r="10" fill="#f7d06a" />
        <circle cx="70" cy="68" r="9" fill="#f6c3b2" />
        <circle cx="50" cy="56" r="4" fill="#fff" />
      </>
    ),
  },
  tuft: {
    size: 22,
    art: <path d="M30 98c0-20 4-30 10-36M50 98c0-24 0-36 0-44M70 98c0-20-4-30-10-36" stroke={LEAF_DARK} strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.6" />,
  },
  mushroom: {
    size: 34,
    art: (
      <>
        {shadow(50, 24)}
        <rect x="40" y="58" width="20" height="40" rx="8" fill="#f8efe0" />
        <path d="M14 62a36 30 0 0 1 72 0z" fill="#df7458" />
        <circle cx="36" cy="46" r="6" fill="#fff" />
        <circle cx="60" cy="40" r="5" fill="#fff" />
      </>
    ),
  },
  pumpkin: {
    size: 36,
    art: (
      <>
        {shadow(50, 30)}
        <ellipse cx="50" cy="72" rx="34" ry="26" fill="#f2a67e" />
        <path d="M50 46v52M30 50c-6 14-6 30 0 44M70 50c6 14 6 30 0 44" stroke="#c97a52" strokeWidth="4" fill="none" />
        <path d="M50 48c0-10 6-16 12-18" stroke="#5a9e6c" strokeWidth="6" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  mesa: {
    size: 76,
    art: (
      <>
        {shadow(50, 40)}
        <path d="M18 98 28 44h44l10 54z" fill="#df9078" />
        <path d="M28 44h44l3 14H25z" fill="#c96a4f" opacity="0.5" />
        <path d="M24 72h52" stroke="#c96a4f" strokeWidth="4" opacity="0.4" />
      </>
    ),
  },
  cactus: {
    size: 46,
    art: (
      <>
        {shadow(50, 18)}
        <rect x="40" y="26" width="20" height="72" rx="10" fill="#6aae7f" />
        <path d="M40 64H28V44" stroke="#6aae7f" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M60 56h12V38" stroke="#6aae7f" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="50" cy="24" r="6" fill="#f2a67e" />
      </>
    ),
  },
  rock: {
    size: 38,
    art: (
      <>
        {shadow(50, 34)}
        <path d="M14 98c0-24 12-40 34-40s38 14 38 40z" fill={STONE} />
        <path d="M30 70c6-6 14-8 22-8" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.4" fill="none" />
      </>
    ),
  },
  pond: {
    size: 78,
    art: (
      <>
        <ellipse cx="50" cy="82" rx="46" ry="16" fill="#9fd8cf" />
        <ellipse cx="50" cy="82" rx="46" ry="16" fill="none" stroke="#7cc8b5" strokeWidth="4" />
        <path d="M30 80h14M58 86h12" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <ellipse cx="72" cy="78" rx="8" ry="4" fill={LEAF} />
      </>
    ),
  },
  reeds: {
    size: 40,
    art: (
      <>
        <path d="M34 98V46M50 98V34M66 98V50" stroke={LEAF_DARK} strokeWidth="5" strokeLinecap="round" />
        <rect x="30" y="40" width="8" height="18" rx="4" fill="#a8734a" />
        <rect x="46" y="28" width="8" height="18" rx="4" fill="#a8734a" />
      </>
    ),
  },
  house: {
    size: 62,
    art: (
      <>
        {shadow(50, 34)}
        <rect x="22" y="50" width="56" height="48" rx="4" fill="#f8efe0" />
        <path d="M14 54 50 20l36 34z" fill="#df7458" />
        <rect x="42" y="70" width="16" height="28" rx="3" fill="#a8734a" />
        <rect x="28" y="62" width="10" height="10" rx="2" fill="#f7d06a" />
        <rect x="62" y="62" width="10" height="10" rx="2" fill="#f7d06a" />
      </>
    ),
  },
  houseTall: {
    size: 66,
    art: (
      <>
        {shadow(50, 26)}
        <rect x="28" y="36" width="44" height="62" rx="4" fill="#ecd5b4" />
        <path d="M22 40 50 10l28 30z" fill="#58ac82" />
        <rect x="36" y="48" width="10" height="12" rx="2" fill="#f7d06a" />
        <rect x="54" y="48" width="10" height="12" rx="2" fill="#f7d06a" />
        <rect x="44" y="74" width="12" height="24" rx="3" fill="#a8734a" />
      </>
    ),
  },
  lantern: {
    size: 50,
    art: (
      <>
        {shadow(50, 12)}
        <rect x="47" y="30" width="6" height="68" rx="3" fill="#7d6e63" />
        <circle cx="50" cy="26" r="16" fill="#f7d06a" opacity="0.35" />
        <rect x="40" y="14" width="20" height="24" rx="6" fill="#f0c14e" />
        <rect x="38" y="10" width="24" height="6" rx="3" fill="#7d6e63" />
      </>
    ),
  },
  fern: {
    size: 50,
    art: (
      <>
        <path d="M50 98C46 70 30 52 14 46M50 98c4-28 20-46 36-52M50 98V30" stroke={LEAF_DARK} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M50 30c-10 10-10 24 0 34 10-10 10-24 0-34z" fill={LEAF} />
        <path d="M14 46c6 12 18 16 28 14-4-10-16-16-28-14zM86 46c-6 12-18 16-28 14 4-10 16-16 28-14z" fill={LEAF} />
      </>
    ),
  },
  crystal: {
    size: 50,
    art: (
      <>
        {shadow(50, 24)}
        <path d="M40 98 34 50l14-22 12 22-6 48z" fill="#f7d06a" />
        <path d="M48 28 60 50l-6 48h-6z" fill="#f0c14e" />
        <path d="M58 98 62 62l10-14 8 16-4 34z" fill="#ffe08a" />
        <path d="M40 50l8-16" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      </>
    ),
  },
  mountain: {
    size: 84,
    art: (
      <>
        <path d="M4 98 40 30l20 30 12-14 24 52z" fill="#cfc4b6" />
        <path d="M40 30 30 48l10-4 8 6z" fill="#fff" />
        <path d="M72 46l-6 8 6-2 6 4z" fill="#fff" />
      </>
    ),
  },
};

/** Which pieces grow in which world theme (big pieces first, then small fillers). */
export const BIOMES = {
  sunshine: { big: ['treeRound', 'treeRound', 'house', 'bush'], small: ['flowers', 'tuft', 'tuft', 'rock'] },
  tangerine: { big: ['treeAutumn', 'treeAutumn', 'treePine'], small: ['mushroom', 'pumpkin', 'tuft'] },
  coral: { big: ['mesa', 'cactus', 'cactus'], small: ['rock', 'tuft'] },
  mint: { big: ['palm', 'pond', 'palm'], small: ['reeds', 'rock', 'tuft'] },
  ember: { big: ['house', 'houseTall', 'lantern'], small: ['lantern', 'bush', 'flowers'] },
  lime: { big: ['fern', 'treeRound', 'fern'], small: ['flowers', 'mushroom', 'tuft'] },
  peach: { big: ['blossomTree', 'blossomTree', 'bush'], small: ['flowers', 'flowers', 'tuft'] },
  gold: { big: ['mountain', 'crystal', 'treePine'], small: ['crystal', 'rock', 'tuft'] },
};
