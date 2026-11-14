import { palStage } from '../../game/pals.js';

/*
 * Hand-drawn Pals (inline SVG, 100×100, standing on y≈94). Every Pal has three looks:
 * Baby (smaller), Grown (adds its signature feature) and Radiant (adds a warm aura and sparkles).
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

/** A Pal at its evolution stage, optionally wearing an accessory. Decorative unless `label` is given. */
export default function PalArt({ palId, xp = 0, accessory = null, size = 64, label, className }) {
  const art = ART[palId];
  if (!art) return null;
  const stage = palStage(xp).id;
  const scale = stage === 'baby' ? 0.82 : 1;
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
      {stage === 'radiant' && <circle cx="50" cy="54" r="46" fill="#ffe27a" opacity=".35" />}
      <ellipse cx="50" cy="95" rx="24" ry="4" fill="rgba(60,40,20,.14)" />
      <g transform={`translate(50 94) scale(${scale}) translate(-50 -94)`}>
        {stage !== 'baby' && art.grown}
        {art.base}
        {accessory && <Accessory id={accessory} hat={art.hat} neck={art.neck} />}
      </g>
      {stage === 'radiant' && (
        <g fill="#f0c14e">
          <path d={RADIANT_SPARKLES} transform="translate(4 8) scale(.6)" />
          <path d={RADIANT_SPARKLES} transform="translate(80 14) scale(.5)" />
          <path d={RADIANT_SPARKLES} transform="translate(84 62) scale(.4)" />
        </g>
      )}
    </svg>
  );
}
