import {
  CheekMarks,
  Crystals,
  EarTufts,
  FinTail,
  Floaters,
  Fluff,
  Horns,
  LittleTree,
  Mane,
  Mark,
  RainbowArc,
  Rays,
  Ring,
  Spikes,
  Spots,
  Sprout,
  Tails,
  Tuft,
  Wings,
} from './palGrowthParts.jsx';

/*
 * Every Pal grows its own way. Each entry lists what the Junior, Buddy, Champ and Legend forms add
 * (forms build on each other). `back` is drawn behind the Pal, `front` on top of it.
 * A Junior of `null` keeps the signature feature drawn with the Pal itself (PalArt's `grown`).
 */

const HONEY = '#f0c14e';
const CREAM = '#fffaf2';
const PEACH = '#f2a67e';
const TERRACOTTA = '#df7458';
const LEAF = '#6db58c';
const LEAF_DARK = '#4f9a72';
const MINT = '#7fd3c0';
const BLUSH = '#f6c3b2';

const form = (back = [], front = []) => ({ back, front });

export const PAL_GROWTH = {
  ember: [
    null,
    form([], [<Mark key="m" kind="flame" color={HONEY} y={34} />]),
    form([<Tails key="t" angles={[-62]} base={[40, 88]} color="#e9895f" tip={CREAM} />], [<CheekMarks key="c" color={TERRACOTTA} y={56} gap={22} />]),
    form([<Tails key="t" angles={[-80, 62, 82]} base={[50, 88]} color="#e9895f" tip={CREAM} length={22} />], [<Mark key="m" kind="flame" color={TERRACOTTA} y={33} size={1.3} />]),
  ],
  mossy: [
    form([], [<Sprout key="s" kind="sprout" x={50} y={28} />]),
    null,
    form([], [<Sprout key="s" kind="flower" x={64} y={70} />, <Sprout key="l" kind="leafy" x={50} y={28} color={LEAF_DARK} />]),
    form([<LittleTree key="t" x={74} y={72} />], [<Floaters key="f" kind="firefly" color={HONEY} />]),
  ],
  coral: [
    null,
    form([<Spikes key="s" color={BLUSH} cy={54} r={27} round count={6} height={10} />]),
    form([], [<Spots key="p" color={CREAM} points={[[38, 70, 2.5], [62, 72, 3], [56, 66, 2]]} />, <Mark key="m" kind="heart" color={TERRACOTTA} y={36} />]),
    form([<Floaters key="f" kind="bubble" color={MINT} />], [<Sprout key="c" kind="coral" x={50} y={26} bloom={TERRACOTTA} />]),
  ],
  mochi: [
    null,
    form([], [<Mark key="m" kind="moon" color={HONEY} y={40} />]),
    form([], [<Fluff key="f" color={CREAM} y={82} />, <Tuft key="t" color="#e3b27e" y={28} />]),
    form([<Mane key="m" color="#e3b27e" cy={56} r={30} />], [<Floaters key="f" kind="star" color={HONEY} />]),
  ],
  hoot: [
    null,
    form([], [<EarTufts key="e" color="#a8734a" y={24} />, <Fluff key="f" color="#e9d8bf" y={70} width={22} />]),
    form([<Wings key="w" kind="feather" color="#a8734a" accent="#e9d8bf" y={62} />]),
    form([], [<Mark key="m" kind="moon" color={HONEY} y={34} />, <Floaters key="f" kind="star" color={HONEY} />]),
  ],
  waffles: [
    null,
    form([], [<Spots key="p" color="#b98256" points={[[60, 84, 5], [42, 86, 3.5]]} opacity={0.7} />]),
    form([], [<Fluff key="f" color={CREAM} y={82} />, <Tuft key="t" color="#b98256" y={28} />]),
    form([<Wings key="w" kind="feather" color={CREAM} accent="#e2c08d" y={66} />], [<Mark key="m" kind="heart" color={TERRACOTTA} y={40} size={1.1} />]),
  ],
  peep: [
    null,
    form([], [<Tuft key="t" color="#f0a830" y={26} big />]),
    form([<Wings key="w" kind="feather" color={PEACH} accent={CREAM} y={64} />]),
    form([<Tails key="t" angles={[-60, -30, 0, 30, 60]} base={[50, 70]} color={TERRACOTTA} tip={HONEY} length={24} />], [<Mark key="m" kind="flame" color={TERRACOTTA} y={40} />]),
  ],
  bruno: [
    null,
    form([], [<Mark key="m" kind="moon" color={CREAM} y={76} size={1.3} />]),
    form([<Mane key="m" color="#a06e46" cy={58} r={28} puff={7} count={12} />]),
    form([<Rays key="r" color={HONEY} cy={56} />], [<Sprout key="l" kind="leaves" x={50} y={30} color={LEAF} />]),
  ],
  biscuit: [
    null,
    form([], [<Sprout key="s" kind="carrot" x={50} y={36} color={LEAF} />]),
    form([], [<Fluff key="f" color={CREAM} y={84} />, <Spots key="p" color="#df9078" points={[[40, 68, 1.4], [44, 70, 1.4], [56, 70, 1.4], [60, 68, 1.4]]} />]),
    form([<Wings key="w" kind="leaf" color={LEAF} accent={LEAF_DARK} y={66} />], [<Floaters key="f" kind="petal" color={BLUSH} />]),
  ],
  truffle: [
    null,
    form([], [<Spots key="p" color="#e8a594" points={[[36, 46, 4], [64, 72, 5], [40, 76, 3]]} />]),
    form([], [<Sprout key="s" kind="mushroom" x={50} y={32} bloom={TERRACOTTA} />]),
    form([<Wings key="w" kind="fairy" color={BLUSH} accent={CREAM} y={60} />], [<Floaters key="f" kind="star" color={HONEY} />]),
  ],
  pebble: [
    null,
    form([], [<Spots key="p" color={CREAM} points={[[30, 34, 2], [44, 22, 2], [60, 22, 2], [74, 34, 2], [22, 50, 2], [80, 50, 2]]} />]),
    form([], [<Spots key="b" color={TERRACOTTA} points={[[30, 30, 5], [58, 20, 4.5]]} />, <Sprout key="s" kind="sprout" x={58} y={18} />]),
    form([<Rays key="r" color={HONEY} cy={52} />], [<Crystals key="c" color={HONEY} x={50} y={20} />]),
  ],
  quartz: [
    null,
    form([], [<Crystals key="c" color="#bff0e6" x={50} y={14} />]),
    form([], [<Mark key="m" kind="diamond" color={HONEY} y={32} />]),
    form([<Rays key="r" color="#bff0e6" cy={52} />, <Wings key="w" kind="crystal" color="#bff0e6" accent={CREAM} y={56} />]),
  ],
  ribbit: [
    form([], [<Spots key="p" color="#5a9e6c" points={[[30, 56, 3.5], [70, 58, 3], [64, 70, 2.5], [36, 72, 2.5]]} opacity={0.7} />]),
    form([], [<Sprout key="l" kind="lily" x={50} y={24} color={LEAF} bloom={BLUSH} />]),
    form([], [<CheekMarks key="c" color={HONEY} y={46} gap={22} />, <Mark key="m" kind="drop" color={MINT} y={76} />]),
    form([<Wings key="w" kind="fairy" color="#cfe9e2" accent={CREAM} y={56} />], [<Floaters key="f" kind="firefly" color={HONEY} />]),
  ],
  cotton: [
    null,
    form([], [<Horns key="h" kind="curl" color="#c9a77c" y={36} />]),
    form([<Mane key="m" color="#f7efe2" edge="#d9c4a6" cy={58} r={28} puff={8} />]),
    form([<Floaters key="f" kind="star" color={HONEY} />], [<Horns key="h" kind="curl" color={HONEY} y={36} />, <Mark key="m" kind="star" color={HONEY} y={40} />]),
  ],
  squeak: [
    null,
    form([], [<Tuft key="t" color="#a99c8e" y={28} />]),
    form([], [<Mark key="m" kind="heart" color={TERRACOTTA} x={84} y={70} />, <Fluff key="f" color={CREAM} y={82} />]),
    form([<Wings key="w" kind="fairy" color="#fbe3a6" accent={CREAM} y={60} />], [<Floaters key="f" kind="petal" color={HONEY} />]),
  ],
  maple: [
    null,
    form([], [<CheekMarks key="c" color="#fff6ea" y={62} gap={20} />]),
    form([], [<Tuft key="t" color="#c96a4f" y={26} big />, <Mark key="m" kind="leaf" color={HONEY} y={70} />]),
    form([<Wings key="w" kind="leaf" color="#e9895f" accent="#c96a4f" y={64} />], [<Floaters key="f" kind="leaf" color={TERRACOTTA} />]),
  ],
  otto: [
    null,
    form([], [<Tuft key="t" color="#8a5a36" y={28} />]),
    form([<Floaters key="f" kind="bubble" color={MINT} />], [<Mark key="m" kind="drop" color={MINT} y={40} />]),
    form([<Spikes key="s" color={MINT} cy={56} r={26} round count={7} height={12} spread={80} />], [<Mark key="m" kind="star" color={HONEY} y={76} />]),
  ],
  buzz: [
    null,
    form([<Wings key="w" kind="bee" color="#e6f4f0" accent="#b3a592" y={58} />]),
    form([], [<Mark key="m" kind="drop" color={HONEY} x={36} y={36} />, <Spots key="p" color={HONEY} points={[[29, 11, 6], [71, 11, 6]]} />]),
    form([<Rays key="r" color={HONEY} cy={56} />, <Wings key="w" kind="bee" color="#fbe3a6" accent={HONEY} y={56} />], [<Mark key="m" kind="star" color={HONEY} y={40} />]),
  ],
  kiko: [
    null,
    form([], [<Sprout key="s" kind="sprout" x={50} y={30} color={MINT} />]),
    form([], [<Spots key="p" color={CREAM} points={[[24, 34, 6], [76, 34, 6]]} />, <Fluff key="f" color={CREAM} y={82} />]),
    form([<Wings key="w" kind="leaf" color={MINT} accent={LEAF_DARK} y={64} />], [<Mark key="m" kind="leaf" color={LEAF_DARK} y={40} />]),
  ],
  splash: [
    null,
    form([], [<Spots key="p" color="#9a8d80" points={[[34, 44, 3], [66, 42, 2.5], [60, 74, 3]]} opacity={0.6} />]),
    form([<Floaters key="f" kind="bubble" color={MINT} />], [<Mark key="m" kind="drop" color={MINT} y={40} />]),
    form([<FinTail key="t" color="#cfc4b6" accent={MINT} />, <Spikes key="s" color={MINT} cy={56} r={26} round count={5} height={10} />]),
  ],
  shroomy: [
    form([<Floaters key="f" kind="firefly" color={MINT} />]),
    form([], [<Sprout key="s" kind="mushroom" x={74} y={44} bloom={PEACH} />]),
    form([<Wings key="w" kind="leaf" color={LEAF} accent={LEAF_DARK} y={70} />]),
    form([<Rays key="r" color={HONEY} cy={50} />], [<Spots key="p" color={HONEY} points={[[36, 34, 2.5], [58, 28, 2.5], [70, 40, 2]]} />]),
  ],
  bandit: [
    null,
    form([], [<Tuft key="t" color="#7d6e63" y={30} />]),
    form([], [<Mark key="m" kind="star" color={HONEY} y={76} size={1.2} />]),
    form([<Mane key="m" color="#9a8d80" cy={56} r={28} puff={8} />], [<Floaters key="f" kind="star" color={HONEY} />]),
  ],
  waddles: [
    null,
    form([], [<Tuft key="t" color={HONEY} y={28} big />]),
    form([], [<Mark key="m" kind="snow" color={MINT} y={74} />, <CheekMarks key="c" color={PEACH} y={62} gap={18} />]),
    form([<Floaters key="f" kind="snow" color="#cfe9e2" />], [<Crystals key="c" color="#cfe9e2" x={50} y={30} />]),
  ],
  fawn: [
    null,
    form([], [<Spots key="p" color="#fffaf2" points={[[30, 74, 2.5], [70, 76, 2.5], [40, 82, 2]]} />]),
    form([<Horns key="h" kind="antlers" color="#a8734a" y={30} />]),
    form([<Rays key="r" color={HONEY} cy={50} />], [<Sprout key="a" kind="flower" x={28} y={18} bloom={BLUSH} />, <Floaters key="f" kind="firefly" color={HONEY} />]),
  ],
  shelly: [
    null,
    form([], [<Sprout key="s" kind="sprout" x={70} y={40} />]),
    form([], [<Spots key="p" color={HONEY} points={[[62, 52, 2.5], [80, 66, 2.5], [66, 74, 2]]} />, <Sprout key="f" kind="flower" x={78} y={42} bloom={BLUSH} />]),
    form([<Rays key="r" color={HONEY} cx={70} cy={60} inner={22} outer={32} />], [<Crystals key="c" color={MINT} x={64} y={42} size={0.9} />]),
  ],
  inky: [
    form([], [<Spots key="p" color="#df7458" points={[[38, 40, 3], [62, 38, 2.5], [56, 46, 2]]} opacity={0.6} />]),
    form([<Floaters key="f" kind="bubble" color={MINT} />]),
    form([], [<Mark key="m" kind="swirl" color={TERRACOTTA} x={34} y={84} />, <Mark key="n" kind="swirl" color={TERRACOTTA} x={66} y={84} />]),
    form([], [<Sprout key="c" kind="coral" x={50} y={28} bloom={HONEY} />, <Floaters key="s" kind="star" color={HONEY} />]),
  ],
  puff: [
    null,
    form([], [<Mark key="a" kind="drop" color={MINT} x={36} y={84} />, <Mark key="b" kind="drop" color={MINT} x={60} y={88} />]),
    form([<RainbowArc key="r" cy={62} />]),
    form([<Rays key="s" color={HONEY} cy={52} />], [<Mark key="m" kind="bolt" color={HONEY} x={78} y={76} size={1.2} />]),
  ],
  twinkle: [
    null,
    form([], [<CheekMarks key="c" color={TERRACOTTA} y={60} gap={16} />]),
    form([<Ring key="r" color={PEACH} cy={58} />]),
    form([<Rays key="r" color={HONEY} cy={50} />], [<Floaters key="f" kind="star" color={HONEY} />]),
  ],
  starla: [
    null,
    form([], [<Mark key="m" kind="star" color={HONEY} y={44} />]),
    form([<Wings key="w" kind="feather" color="#fbe3a6" accent={CREAM} y={62} />]),
    form([<RainbowArc key="r" cy={60} />], [<Floaters key="f" kind="star" color={HONEY} />]),
  ],
  ziggy: [
    null,
    form([<Spikes key="s" color="#3f8a64" cy={56} r={26} count={5} height={12} />]),
    form([<Wings key="w" kind="bat" color="#3f8a64" accent="#7cc8b5" y={58} />], [<Horns key="h" kind="nubs" color={HONEY} y={28} />]),
    form([<Tails key="t" angles={[60]} base={[60, 88]} color="#7cc8b5" tip={TERRACOTTA} />], [<Mark key="m" kind="flame" color={TERRACOTTA} y={40} />]),
  ],
  // Legendary Pals
  leo: [
    null,
    form([<Mane key="m" color="#c98a3e" cy={56} r={24} puff={6} count={12} />]),
    form([<Mane key="m" color="#b57a32" edge="#8a5a36" cy={56} r={28} puff={8} />], [<Tuft key="t" color="#c98a3e" y={26} big />]),
    form([<Rays key="r" color={HONEY} cy={56} />], [<Mark key="m" kind="star" color={HONEY} y={76} size={1.2} />]),
  ],
  koi: [
    null,
    form([], [<Spots key="p" color={HONEY} points={[[60, 40, 2.5], [44, 78, 2.5], [56, 82, 2]]} />]),
    form([<Spikes key="s" color={PEACH} cy={56} r={26} round count={5} height={10} />]),
    form([<Rays key="r" color={HONEY} cy={56} />, <Floaters key="f" kind="bubble" color={MINT} />]),
  ],
  bamboo: [
    form([], [<Sprout key="s" kind="sprout" x={50} y={30} color={LEAF} />]),
    form([], [<Fluff key="f" color={CREAM} y={84} />]),
    form([], [<Sprout key="l" kind="leafy" x={50} y={30} color={LEAF_DARK} />, <Mark key="m" kind="heart" color={TERRACOTTA} y={76} />]),
    form([<Wings key="w" kind="leaf" color={LEAF} accent={LEAF_DARK} y={64} />], [<Floaters key="f" kind="leaf" color={LEAF} />]),
  ],
  aurora: [
    null,
    form([], [<Mark key="m" kind="snow" color={MINT} y={40} />]),
    form([<Tails key="t" angles={[-62]} base={[40, 88]} color="#f1ece3" tip={MINT} />]),
    form([<RainbowArc key="r" cy={58} />, <Floaters key="f" kind="snow" color="#bfe6dc" />]),
  ],
  storm: [
    null,
    form([], [<CheekMarks key="c" color="#3b3330" y={62} gap={22} />]),
    form([], [<Mark key="m" kind="bolt" color={HONEY} y={76} size={1.3} />, <Tuft key="t" color="#e08b5c" y={28} />]),
    form([<Rays key="r" color={HONEY} cy={56} />], [<Floaters key="f" kind="star" color={HONEY} />]),
  ],
  plume: [
    null,
    form([<Tails key="t" angles={[-30, 0, 30]} base={[50, 70]} color="#3f9e8f" tip={HONEY} length={20} />]),
    form([<Tails key="t" angles={[-75, -50, 50, 75]} base={[50, 70]} color="#4fbfad" tip={HONEY} length={24} />]),
    form([<Rays key="r" color="#fbe3a6" cy={52} />], [<Mark key="m" kind="star" color={HONEY} y={40} />]),
  ],
  nova: [
    null,
    form([<Floaters key="f" kind="bubble" color={MINT} />]),
    form([], [<Mark key="m" kind="drop" color={MINT} y={76} />, <CheekMarks key="c" color={CREAM} y={64} gap={20} />]),
    form([<Rays key="r" color="#bff0e6" cy={56} />], [<Floaters key="f" kind="star" color={HONEY} />]),
  ],
  luna: [
    null,
    form([], [<Mark key="m" kind="moon" color={HONEY} y={44} />]),
    form([<Mane key="m" color="#f4f0e8" edge="#c9c2b8" cy={58} r={26} puff={7} />]),
    form([<Floaters key="f" kind="snow" color="#cfe9e2" />], [<Mark key="s" kind="star" color={HONEY} y={78} size={1.1} />]),
  ],
  // Mythic Pals
  sol: [
    null,
    form([<Tails key="t" angles={[-30, 0, 30]} base={[50, 40]} color={TERRACOTTA} tip={HONEY} length={14} />]),
    form([<Wings key="w" kind="feather" color={TERRACOTTA} accent={HONEY} y={62} />]),
    form([<Rays key="r" color={HONEY} cy={56} />], [<Mark key="m" kind="star" color={HONEY} y={82} />]),
  ],
  kiri: [
    null,
    form([], [<Spots key="p" color={HONEY} points={[[38, 76, 2.5], [46, 80, 2.5], [54, 80, 2.5], [62, 76, 2.5]]} />]),
    form([<Spikes key="s" color="#fbe3a6" cy={56} r={26} round count={7} height={12} spread={85} />]),
    form([<Rays key="r" color="#bff0e6" cy={56} />], [<Floaters key="f" kind="firefly" color={HONEY} />, <Mark key="m" kind="flame" color={TERRACOTTA} y={42} />]),
  ],
  gryff: [
    null,
    form([<Wings key="w" kind="feather" color="#a8734a" accent="#fff6ea" y={68} />]),
    form([], [<Tuft key="t" color={HONEY} y={28} big />, <Fluff key="f" color="#fff6ea" y={82} />]),
    form([<Rays key="r" color={HONEY} cy={56} />], [<Mark key="m" kind="star" color={HONEY} y={76} size={1.2} />]),
  ],
  nessa: [
    null,
    form([], [<Spots key="p" color="#4f9a72" points={[[34, 44, 3], [66, 46, 2.5], [60, 36, 2]]} opacity={0.6} />]),
    form([<Spikes key="s" color="#4f9a72" cy={56} r={26} round count={5} height={10} />]),
    form([<Floaters key="f" kind="bubble" color={MINT} />], [<Sprout key="l" kind="leaves" x={50} y={30} color="#4f9a72" />]),
  ],
  dozy: [
    form([], [<Mark key="m" kind="moon" color={HONEY} y={38} />]),
    form([<Floaters key="f" kind="star" color={HONEY} />]),
    form([], [<Fluff key="f" color={CREAM} y={88} width={34} />, <Sprout key="s" kind="sprout" x={50} y={30} color={MINT} />]),
    form([<Wings key="w" kind="fairy" color="#fbe3a6" accent={CREAM} y={58} />, <Rays key="r" color="#fbe3a6" cy={56} />]),
  ],
  nimbus: [
    null,
    form([], [<Mark key="m" kind="star" color={HONEY} y={40} />]),
    form([<Wings key="w" kind="feather" color="#e6f4f0" accent="#bfe6dc" y={62} />]),
    form([<Rays key="r" color="#bff0e6" cy={56} />], [<Floaters key="f" kind="star" color={HONEY} />]),
  ],
  hopscotch: [
    null,
    form([], [<Horns key="h" kind="antlers" color="#a8734a" y={28} />]),
    form([], [<Sprout key="s" kind="flower" x={30} y={10} bloom={BLUSH} />, <Fluff key="f" color={CREAM} y={82} />]),
    form([<Rays key="r" color={HONEY} cy={56} />], [<Floaters key="f" kind="petal" color={BLUSH} />]),
  ],
  frosty: [
    null,
    form([<Floaters key="f" kind="snow" color="#bfe6dc" />]),
    form([], [<Crystals key="c" color="#cfe9e2" x={50} y={26} />]),
    form([<Mane key="m" color="#f7f3ec" edge="#cfe9e2" cy={56} r={28} puff={8} />], [<Mark key="m" kind="snow" color={MINT} y={80} />]),
  ],
  fen: [
    null,
    form([], [<Mark key="m" kind="moon" color={HONEY} y={40} />]),
    form([<Mane key="m" color="#c9c2b8" edge="#8d8278" cy={58} r={26} puff={7} />]),
    form([<Floaters key="f" kind="star" color={HONEY} />], [<CheekMarks key="c" color={MINT} y={60} gap={20} />, <Mark key="b" kind="bolt" color={HONEY} y={78} />]),
  ],
  riddle: [
    null,
    form([], [<Mark key="m" kind="diamond" color={MINT} y={40} />]),
    form([<Mane key="m" color={HONEY} edge="#4fbfad" cy={56} r={26} puff={6} count={10} />]),
    form([<Wings key="w" kind="feather" color={HONEY} accent={CREAM} y={64} />, <Rays key="r" color="#fbe3a6" cy={56} />]),
  ],
};
