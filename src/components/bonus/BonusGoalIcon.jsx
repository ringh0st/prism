/** A gem outline (the goal's gem is marked on the board itself; here it's the idea of "a gem"). */
const gem = (x, y, size = 4.5) => `M${x} ${y - size}l${size} ${size}-${size} ${size}-${size}-${size}z`;

/** Each bonus goal as a little picture (bonusGoals.js), drawn in currentColor on a 24×24 grid. */
const ART = {
  // One beam splitting to two gems: two gems with one tap.
  combo: (
    <>
      <path d={gem(6.5, 7)} />
      <path d={gem(17.5, 7)} />
      <path d="M12 21v-4l-4-3.5M12 17l4-3.5" />
    </>
  ),
  // A gem with a "1": the first gem to light.
  firstGem: (
    <>
      <path d={gem(9, 12, 6.5)} />
      <path d="M17 6.5l2-1.5v8" />
    </>
  ),
  // A gem with a finish flag: the last gem to light.
  lastGem: (
    <>
      <path d={gem(8.5, 12, 6.5)} />
      <path d="M16.5 20V4.5h4.5l-1.3 2.2 1.3 2.3h-4.5" />
    </>
  ),
  // Light meeting a mirror, and the tap right where it shines: only turn pieces in the light.
  followLight: (
    <>
      <path d="M2.5 13.5h9V3" />
      <path d="M6.5 18.5l10-10" strokeWidth="3.2" />
      <circle cx="17.5" cy="18" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  // A "hands off" sign: never turn the marked piece.
  untouched: (
    <>
      <circle cx="12" cy="12" r="8.5" strokeWidth="2.8" />
      <path d="M6 6l12 12" strokeWidth="2.8" />
    </>
  ),
  // A flame: burn every one of Smudge's shadows.
  burnAll: (
    <path d="M12.5 2c.6 3.2-1.4 5-3 6.8C8 10.5 7 12.2 7 14.5a5 5 0 0 0 10 0c0-1.8-.8-3.2-1.6-4.2-.2 1.3-.9 2.2-1.9 2.6.6-3.6-.2-7.6-1-10.9z" />
  ),
  // The tags beside a real gem (its own shape and color) for the gem goals, and on the board's marked gem.
  firstGemTag: <path d="M9 7.5l4-3V20M8 20h8" strokeWidth="3" />,
  lastGemTag: <path d="M7 21V3.5h11l-2.6 4 2.6 4H7" strokeWidth="2.8" />,
  // A hint bulb, crossed out: no helpers.
  noHelpers: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
      <path d="M4 4l16 16" />
    </>
  ),
};

/** The picture for a bonus goal's kind (decorative: the words go in the label of whatever shows it). */
export default function BonusGoalIcon({ kind, size = 22, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ART[kind]}
    </svg>
  );
}
