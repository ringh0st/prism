/*
 * The drawing kit for Pal growth: wings, tails, manes, horns, sprouts, marks and more, in the 100×100
 * Pal box (standing on y≈94). palGrowth.jsx picks a unique mix of these for each Pal and form.
 */

const mirror = 'translate(100 0) scale(-1 1)';

/** A pair of wings behind the body. kind: feather | fairy | bat | leaf | bee | crystal */
export function Wings({ kind, color, accent = '#fffaf2', y = 58 }) {
  const shapes = {
    feather: (
      <>
        <path d={`M40 ${y}C26 ${y - 20} 8 ${y - 18} 2 ${y - 6}c6 2 6 8 12 10 4 4 10 4 14 2 4 3 10 1 12-6z`} fill={color} />
        <path d={`M10 ${y - 4}c8 0 16 2 24 6M14 ${y + 3}c6 0 12 1 18 2`} stroke={accent} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </>
    ),
    fairy: (
      <g opacity=".85">
        <ellipse cx="24" cy={y - 10} rx="17" ry="10" fill={color} transform={`rotate(-30 24 ${y - 10})`} />
        <ellipse cx="27" cy={y + 6} rx="11" ry="7" fill={color} transform={`rotate(25 27 ${y + 6})`} />
        <ellipse cx="22" cy={y - 12} rx="7" ry="3.5" fill={accent} opacity=".7" transform={`rotate(-30 22 ${y - 12})`} />
      </g>
    ),
    bat: (
      <>
        <path d={`M42 ${y}L6 ${y - 18}l6 12-9 4 11 4-5 9 32-6z`} fill={color} />
        <path d={`M40 ${y}L12 ${y - 6}M38 ${y + 3}L14 ${y + 8}`} stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    leaf: (
      <>
        <path d={`M42 ${y}C30 ${y - 24} 8 ${y - 22} 2 ${y - 10}c10 14 26 16 40 10z`} fill={color} />
        <path d={`M40 ${y - 2}C30 ${y - 8} 18 ${y - 12} 6 ${y - 10}`} stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" />
      </>
    ),
    bee: (
      <g opacity=".8">
        <ellipse cx="26" cy={y - 14} rx="15" ry="9" fill={color} stroke={accent} strokeWidth="1.5" transform={`rotate(-35 26 ${y - 14})`} />
        <ellipse cx="28" cy={y + 2} rx="10" ry="6" fill={color} stroke={accent} strokeWidth="1.5" transform={`rotate(-10 28 ${y + 2})`} />
      </g>
    ),
    crystal: (
      <>
        <path d={`M42 ${y}L12 ${y - 26}l-6 18 10 4-8 10 32-4z`} fill={color} />
        <path d={`M12 ${y - 26}L30 ${y - 2}M6 ${y - 8}l24 6`} stroke={accent} strokeWidth="1.8" opacity=".8" />
      </>
    ),
  };
  return (
    <g>
      {shapes[kind]}
      <g transform={mirror}>{shapes[kind]}</g>
    </g>
  );
}

/** Fluffy tails fanned out from one base point (angles in degrees, 0 = straight up). */
export function Tails({ angles, color, tip, base = [50, 84], length = 20 }) {
  const [bx, by] = base;
  return (
    <g>
      {angles.map((angle) => (
        <g key={angle} transform={`rotate(${angle} ${bx} ${by})`}>
          <ellipse cx={bx} cy={by - length} rx={length * 0.42} ry={length} fill={color} />
          {tip && <ellipse cx={bx} cy={by - length * 1.6} rx={length * 0.3} ry={length * 0.42} fill={tip} />}
        </g>
      ))}
    </g>
  );
}

/** A scalloped ruff behind the head (a lion's mane, a wool collar). */
export function Mane({ color, edge, cx = 50, cy = 54, r = 32, puff = 9, count = 14 }) {
  return (
    <g fill={color}>
      {edge && <circle cx={cx} cy={cy} r={r + puff + 1.5} fill={edge} />}
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={puff} />;
      })}
      <circle cx={cx} cy={cy} r={r} />
    </g>
  );
}

/** Sun rays behind the Pal. */
export function Rays({ color, cx = 50, cy = 54, inner = 34, outer = 48, count = 12 }) {
  return (
    <g fill={color} opacity=".8">
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const b = a + Math.PI / count;
        const c = a - Math.PI / count;
        const p = (angle, r) => `${(cx + Math.cos(angle) * r).toFixed(1)} ${(cy + Math.sin(angle) * r).toFixed(1)}`;
        return <path key={i} d={`M${p(c, inner)}L${p(a, outer)}L${p(b, inner)}z`} />;
      })}
    </g>
  );
}

/** A crest of spikes or fins over the top of the head (degrees from straight up). */
export function Spikes({ color, cx = 50, cy = 54, r = 26, spread = 70, count = 5, height = 12, round = false }) {
  return (
    <g fill={color}>
      {Array.from({ length: count }, (_, i) => {
        const deg = -spread + (2 * spread * i) / Math.max(1, count - 1) - 90;
        const a = (deg * Math.PI) / 180;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        return round ? (
          <circle key={i} cx={x + Math.cos(a) * height * 0.4} cy={y + Math.sin(a) * height * 0.4} r={height * 0.6} />
        ) : (
          <path key={i} d={`M${x - 6} ${y}l6 ${-height}l6 ${height}z`} transform={`rotate(${deg + 90} ${x} ${y})`} />
        );
      })}
    </g>
  );
}

/** Little floating things around the Pal: bubbles, fireflies, petals, snowflakes, stars or notes. */
export function Floaters({ kind, color }) {
  const spots = [
    [10, 40, 1],
    [88, 30, 0.8],
    [90, 70, 0.7],
    [12, 76, 0.6],
  ];
  return (
    <g>
      {spots.map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
          {kind === 'bubble' && <circle r="5" fill="none" stroke={color} strokeWidth="2" />}
          {kind === 'firefly' && (
            <>
              <circle r="6" fill="#ffe27a" opacity=".4" />
              <circle r="2.6" fill={color} />
            </>
          )}
          {kind === 'petal' && <path d="M0-5c4 2 4 8 0 10-4-2-4-8 0-10z" fill={color} transform="rotate(30)" />}
          {kind === 'snow' && <path d="M0-6v12M-5-3l10 6M-5 3l10-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />}
          {kind === 'star' && <path d="M0-6l1.8 4.2L6 0l-4.2 1.8L0 6l-1.8-4.2L-6 0l4.2-1.8z" fill={color} />}
          {kind === 'leaf' && <path d="M-5 4C-5-4 2-6 6-6 6 0 2 6-5 4z" fill={color} />}
        </g>
      ))}
    </g>
  );
}

/** Something growing on the head. kind: sprout | leafy | flower | carrot | lily | mushroom | coral | leaves */
export function Sprout({ kind, x, y, color = '#6db58c', bloom = '#f6c3b2' }) {
  switch (kind) {
    case 'sprout':
      return (
        <g>
          <path d={`M${x} ${y + 4}v-10`} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <path d={`M${x} ${y - 4}c-8 0-10-6-9-8 6-1 9 2 9 8zM${x} ${y - 4}c8 0 10-6 9-8-6-1-9 2-9 8z`} fill={color} />
        </g>
      );
    case 'leafy':
      return (
        <g fill={color}>
          <path d={`M${x} ${y + 2}c-14-2-16-12-14-16 10 0 14 6 14 16zM${x} ${y + 2}c14-2 16-12 14-16-10 0-14 6-14 16z`} />
          <path d={`M${x} ${y}c-4-10 0-18 4-20 3 8 0 16-4 20z`} />
        </g>
      );
    case 'flower':
      return (
        <g>
          <path d={`M${x} ${y + 4}v-12`} stroke={color} strokeWidth="2.5" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={x} cy={y - 14} rx="3.6" ry="6" fill={bloom} transform={`rotate(${a} ${x} ${y - 8})`} />
          ))}
          <circle cx={x} cy={y - 8} r="3.4" fill="#f0c14e" />
        </g>
      );
    case 'carrot':
      return (
        <g fill={color}>
          <path d={`M${x} ${y + 2}c-6-6-6-14-2-18 2 6 3 12 2 18zM${x} ${y + 2}c6-6 8-12 6-16-4 4-6 10-6 16zM${x} ${y + 2}c-8-2-12-8-12-12 6 2 10 6 12 12z`} />
        </g>
      );
    case 'lily':
      return (
        <g>
          <ellipse cx={x} cy={y + 2} rx="16" ry="5" fill={color} />
          <path d={`M${x} ${y + 2}l10-4`} stroke="#4f9a72" strokeWidth="2" />
          <path d={`M${x - 6} ${y}l6-10 6 10z`} fill={bloom} />
        </g>
      );
    case 'mushroom':
      return (
        <g>
          <rect x={x - 3} y={y - 6} width="6" height="9" rx="2" fill="#fff6ea" />
          <path d={`M${x - 10} ${y - 4}a10 9 0 0 1 20 0z`} fill={bloom} />
          <circle cx={x - 3} cy={y - 9} r="1.8" fill="#fff6ea" />
          <circle cx={x + 4} cy={y - 7} r="1.4" fill="#fff6ea" />
        </g>
      );
    case 'coral':
      return (
        <path
          d={`M${x} ${y + 4}v-12m0 4l-8-6v-6m8 12l8-8v-6m-16 4l-4-4m20 2l4-4`}
          stroke={bloom}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );
    case 'leaves':
      return (
        <g fill={color}>
          {[-16, -8, 0, 8, 16].map((dx) => (
            <path key={dx} d={`M${x + dx} ${y + 4}c-4-6-2-12 0-14 2 2 4 8 0 14z`} transform={`rotate(${dx * 1.6} ${x + dx} ${y + 4})`} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** Horns. kind: nubs (two small) | curl (ram curls at the sides) | antlers (big, branching) */
export function Horns({ kind, color, x = 50, y }) {
  if (kind === 'nubs') {
    return <path d={`M${x - 16} ${y + 6}l2-14 8 10zM${x + 16} ${y + 6}l-2-14-8 10z`} fill={color} />;
  }
  if (kind === 'curl') {
    const curl = `M${x - 18} ${y + 8}c-10-4-16 4-12 12 3 6 12 4 10-2-1-4-6-3-5 0`;
    return (
      <g stroke={color} strokeWidth="6" strokeLinecap="round" fill="none">
        <path d={curl} />
        <path d={curl} transform={`translate(${2 * x} 0) scale(-1 1)`} />
      </g>
    );
  }
  return (
    <g stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={`M${x - 12} ${y + 4}L${x - 22} ${y - 18}l-10-4m10 4l-2-12m-3 22l-9 2`} />
      <path d={`M${x + 12} ${y + 4}L${x + 22} ${y - 18}l10-4m-10 4l2-12m3 22l9 2`} />
    </g>
  );
}

/** A small symbol on the forehead, chest or cheek. kind: star | flame | moon | drop | heart | leaf | diamond | bolt | swirl | snow */
export function Mark({ kind, color, x = 50, y, size = 1 }) {
  const shapes = {
    star: <path d="M0-7l2.1 4.8L7-1.6 3.4 2l.9 5.2L0 4.8l-4.3 2.4.9-5.2L-7-1.6l4.9-.6z" />,
    flame: <path d="M0-8c4 4 6 7 6 10a6 6 0 0 1-12 0c0-2 1-4 3-5 0 2 1 3 2 3 0-3 0-5 1-8z" />,
    moon: <path d="M2-7a7 7 0 1 0 5 11A6 6 0 0 1 2-7z" />,
    drop: <path d="M0-7c3 4 5 7 5 9a5 5 0 0 1-10 0c0-2 2-5 5-9z" />,
    heart: <path d="M0 6C-7 1-7-5-3.5-5.5-1.5-6 0-4 0-3c0-1 1.5-3 3.5-2.5C7-5 7 1 0 6z" />,
    leaf: <path d="M-6 5C-6-3 1-6 6-6 6 1 2 6-6 5z" />,
    diamond: <path d="M0-7l5 7-5 7-5-7z" />,
    bolt: <path d="M2-8-4 1h4l-2 7 6-9H0z" />,
    swirl: <path d="M0 0a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />,
    snow: <path d="M0-7v14M-6-3.5l12 7M-6 3.5l12-7" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />,
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`} fill={color}>
      {shapes[kind]}
    </g>
  );
}

/** Stripes on both cheeks. */
export function CheekMarks({ color, y, gap = 20 }) {
  const stripes = (cx) => `M${cx - 4} ${y - 3}h8M${cx - 4} ${y + 2}h8`;
  return <path d={`${stripes(50 - gap)}${stripes(50 + gap)}`} stroke={color} strokeWidth="2.6" strokeLinecap="round" />;
}

/** A curl or crest of hair on top of the head. */
export function Tuft({ color, x = 50, y, big = false }) {
  return big ? (
    <path d={`M${x - 8} ${y + 4}c-4-10 2-18 8-20-2 6 0 10 4 12 0-6 4-10 10-10-4 6-4 12-2 18z`} fill={color} />
  ) : (
    <path d={`M${x - 3} ${y + 3}c-2-8 4-12 8-10-4 1-5 5-3 8`} stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" />
  );
}

/** A cluster of crystal shards. */
export function Crystals({ color, x = 50, y, size = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path d="M-4 2-2-16 4 2z" fill={color} />
      <path d="M-12 4-12-8-4 2z" fill={color} opacity=".85" />
      <path d="M6 3 12-9 13 4z" fill={color} opacity=".85" />
      <path d="M-2-16 0 2" stroke="#fff" strokeWidth="1.4" opacity=".7" />
    </g>
  );
}

/** Round spots or patches. points: [x, y, r][] */
export function Spots({ color, points, opacity = 1 }) {
  return (
    <g fill={color} opacity={opacity}>
      {points.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
      ))}
    </g>
  );
}

/** A fluffy scalloped bib on the chest. */
export function Fluff({ color, y, width = 26 }) {
  const step = width / 4;
  let d = `M${50 - width / 2} ${y}`;
  for (let i = 0; i < 4; i++) d += `q${step / 2} ${8} ${step} 0`;
  return <path d={`${d}v-6h${-width}z`} fill={color} />;
}

/** Ear tufts like an eagle owl's. */
export function EarTufts({ color, y }) {
  return <path d={`M28 ${y + 10}l-6-20 14 12zM72 ${y + 10}l6-20-14 12z`} fill={color} />;
}

/** A big fish or mermaid tail behind. */
export function FinTail({ color, accent }) {
  return (
    <g>
      <path d="M64 86c10 0 16-6 18-14" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M82 72c-2-10 4-16 12-16-2 6-2 10 2 14-6 0-10 2-14 2z" fill={accent} />
      <path d="M82 72c6-4 14-2 16 4-6-2-10-2-16-4z" fill={accent} />
    </g>
  );
}

/** A little tree growing behind (on a shell or back). */
export function LittleTree({ x = 70, y = 70 }) {
  return (
    <g>
      <path d={`M${x} ${y}v-26`} stroke="#8a5a36" strokeWidth="5" strokeLinecap="round" />
      <circle cx={x - 9} cy={y - 30} r="10" fill="#4f9a72" />
      <circle cx={x + 9} cy={y - 30} r="10" fill="#4f9a72" />
      <circle cx={x} cy={y - 40} r="12" fill="#6db58c" />
      <circle cx={x - 4} cy={y - 36} r="2.4" fill="#f6c3b2" />
      <circle cx={x + 7} cy={y - 42} r="2.4" fill="#f0c14e" />
    </g>
  );
}

/** A rainbow arc behind. */
export function RainbowArc({ cy = 60 }) {
  return (
    <g fill="none" strokeWidth="5">
      {['#df7458', '#f2a67e', '#f0c14e', '#6db58c', '#7fd3c0'].map((color, i) => (
        <path key={color} d={`M${8 + i * 5} ${cy}a${42 - i * 5} ${42 - i * 5} 0 0 1 ${84 - i * 10} 0`} stroke={color} />
      ))}
    </g>
  );
}

/** A planet ring around the middle. */
export function Ring({ color, cy = 60 }) {
  return <ellipse cx="50" cy={cy} rx="44" ry="10" fill="none" stroke={color} strokeWidth="4" transform={`rotate(-12 50 ${cy})`} />;
}
