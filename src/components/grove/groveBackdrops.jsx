/*
 * Grove backgrounds you can buy (the "backdrop" spot in grove.js): each swaps the forest for another land under the
 * same sky (the time of day still turns it to dawn, dusk or night). Drawn in the 400×280 scene with the ground
 * from y≈160 down, so the decor spots stand where they always do. Warm and calm: blue only as a little water.
 */
const HILLS = 'M0 172C70 150 140 158 205 154s135-12 195 4V280H0z';

/** Blossom hills: rolling green hills and pink-peach blossom trees. */
function BlossomHills() {
  const trees = [
    [44, 150, 30],
    [128, 128, 24],
    [282, 132, 26],
    [366, 150, 32],
  ];
  return (
    <>
      <path d="M0 150C60 108 120 116 170 126s110 0 150-20 70-6 80 4V200H0z" fill="#C9E2B9" />
      {trees.map(([x, y, r]) => (
        <g key={x}>
          <path d={`M${x - 3} ${y + r}h6v${r * 0.9}h-6z`} fill="#A57955" />
          <circle cx={x} cy={y} r={r} fill="#F6C6C0" />
          <circle cx={x - r * 0.4} cy={y - r * 0.3} r={r * 0.55} fill="#F9D7D0" />
          <circle cx={x + r * 0.35} cy={y + r * 0.2} r={r * 0.4} fill="#F2B3AB" />
        </g>
      ))}
      <path d={HILLS} fill="#B9DBA6" />
      <path d="M140 280c18-40 60-70 70-110 10 40 40 74 64 110z" fill="#EFE1C0" />
      <g fill="#F6C6C0">
        <circle cx="70" cy="214" r="3" />
        <circle cx="96" cy="250" r="2.5" />
        <circle cx="318" cy="208" r="3" />
        <circle cx="352" cy="246" r="2.5" />
      </g>
    </>
  );
}

/** Desert oasis: honey dunes, two palms and a little mint pool. */
function DesertOasis() {
  return (
    <>
      <path d="M0 150C50 120 110 124 150 140s90 10 130-14 90-10 120 6V200H0z" fill="#F2D59A" />
      <path d="M0 176C80 150 160 162 220 156s120-14 180 0V280H0z" fill="#F0C98A" />
      <path d="M0 214C90 196 170 210 250 204s110-8 150 2V280H0z" fill="#E9BC78" />
      <ellipse cx="300" cy="196" rx="44" ry="11" fill="#9ED8CB" />
      <ellipse cx="300" cy="193" rx="30" ry="5" fill="#C9EEE6" />
      {[
        [262, 194, -6],
        [338, 192, 8],
      ].map(([x, y, lean]) => (
        <g key={x}>
          <path d={`M${x} ${y}q${lean} -34 ${lean * 2} -62`} stroke="#A57955" strokeWidth="6" fill="none" strokeLinecap="round" />
          <g transform={`translate(${x + lean * 2} ${y - 62})`} fill="#7FBF8C">
            <path d="M0 0q-26 -6 -34 10q16-12 34-10z" />
            <path d="M0 0q26 -6 34 10q-16-12 -34-10z" />
            <path d="M0 0q-12 -22 -30 -20q20 2 30 20z" />
            <path d="M0 0q12 -22 30 -20q-20 2 -30 20z" />
          </g>
        </g>
      ))}
      <g fill="#8FBF7E">
        <path d="M70 214v-26a6 6 0 0 1 12 0v26zM62 202v-8a4 4 0 0 1 8 0v8zM82 196v-6a4 4 0 0 1 8 0v10h-8z" />
      </g>
    </>
  );
}

/** Sunny cove: a sandy beach, a calm shallow lagoon, a palm and shells. */
function SunnyCove() {
  return (
    <>
      <path d="M0 140h400v40H0z" fill="#A8DCCF" />
      <path d="M0 150q50 -6 100 0t100 0 100 0 100 0" stroke="#D3F0E8" strokeWidth="3" fill="none" />
      <path d="M0 166q50 -5 100 0t100 0 100 0 100 0" stroke="#D3F0E8" strokeWidth="2.5" fill="none" opacity=".7" />
      <path d="M0 176C80 164 160 172 230 168s120-8 170 0V280H0z" fill="#F4DFB4" />
      <path d="M0 186C80 176 170 184 240 180s110-6 160 2" stroke="#FFF6E2" strokeWidth="4" fill="none" />
      <path d="M352 210q-4 -50 -24 -88" stroke="#A57955" strokeWidth="7" fill="none" strokeLinecap="round" />
      <g transform="translate(328 122)" fill="#7FBF8C">
        <path d="M0 0q-30 -4 -38 14q18-14 38-14z" />
        <path d="M0 0q30 -8 40 8q-20-10 -40-8z" />
        <path d="M0 0q-10 -24 -30 -24q20 4 30 24z" />
        <path d="M0 0q14 -22 32 -18q-22 2 -32 18z" />
      </g>
      <g fill="#F2A67E">
        <path d="M70 228a8 8 0 0 1 16 0z" />
        <path d="M110 250a6 6 0 0 1 12 0z" />
      </g>
      <circle cx="300" cy="244" r="4" fill="#F6C6C0" />
      <path d="M20 190l14-8 16 8z" fill="#CFC4B4" />
    </>
  );
}

/** Snowy pines: soft snow, sage pines with snowy tips and a cabin glowing in the distance. */
function SnowyPines() {
  const pines = [
    [36, 168, 34],
    [110, 152, 26],
    [300, 150, 28],
    [372, 166, 36],
  ];
  return (
    <>
      <path d="M0 150C60 126 130 130 190 138s120 -6 210 6V200H0z" fill="#E8EEE4" />
      <g transform="translate(206 120)">
        <path d="M0 22h34V0H0z" fill="#B07A4E" />
        <path d="M-4 2L17 -14 38 2z" fill="#FFFDF6" />
        <rect x="12" y="8" width="10" height="8" fill="#F7D06A" />
      </g>
      {pines.map(([x, y, h]) => (
        <g key={x}>
          <path d={`M${x} ${y - h * 1.6}L${x + h * 0.7} ${y}H${x - h * 0.7}z`} fill="#7FAF8C" />
          <path d={`M${x} ${y - h * 1.6}L${x + h * 0.3} ${y - h * 0.9}H${x - h * 0.3}z`} fill="#FFFDF6" />
          <path d={`M${x - 3} ${y}h6v10h-6z`} fill="#A57955" />
        </g>
      ))}
      <path d="M0 174C80 156 150 166 210 162s130-10 190 2V280H0z" fill="#F7F4EC" />
      <path d="M120 280c20-40 70-70 90-112 8 40 40 80 70 112z" fill="#ECE6D8" />
    </>
  );
}

/** Each background's land, by decor id (the sky is drawn by ForestBackdrop). */
export const BACKDROP_LANDS = {
  blossomHills: BlossomHills,
  desertOasis: DesertOasis,
  sunnyCove: SunnyCove,
  snowyPines: SnowyPines,
};

/** A background as a little picture for shelves: its land under a day sky, in the 100×100 decor box. */
export function BackdropThumb({ id }) {
  const Land = BACKDROP_LANDS[id];
  return (
    <g>
      <rect x="2" y="14" width="96" height="72" rx="10" fill="#F6EED9" />
      <g clipPath={`url(#thumb-${id})`}>
        <clipPath id={`thumb-${id}`}>
          <rect x="2" y="14" width="96" height="72" rx="10" />
        </clipPath>
        <g transform="translate(2 -10) scale(0.24 0.34)">
          <Land />
        </g>
      </g>
      <rect x="2" y="14" width="96" height="72" rx="10" fill="none" stroke="#B07A4E" strokeWidth="3" />
    </g>
  );
}
