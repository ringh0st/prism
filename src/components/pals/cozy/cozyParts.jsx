/*
 * Cozy kawaii pastel mascots: every Pal is built on ONE template (100×100 stage, sitting on y=94), so heads, eyes,
 * necks and paws are in the same place for all 48 Pals and all five forms, and every outfit fits every Pal.
 *   head: ellipse at (50, 48), 56 wide, 48 tall (top y=24)   eyes: (39, 50) and (61, 50)
 *   neck/chin: y≈70   body: a round sitting bean from y=66 to 94   paws: (33, 79) and (67, 79)   tail: behind, right
 * Each Pal only changes colors and the parts around that template (ears, tail, markings, wings…).
 */

/** A darker shade of a pastel, for its outline. */
export function shade(hex, amount = 0.32) {
  const n = parseInt(hex.slice(1), 16);
  // near-white Pals get a soft warm line instead of a grey one
  if (amount >= 0.3 && n >> 16 > 236 && ((n >> 8) & 255) > 236 && (n & 255) > 230) return '#d8c8bb';
  const ch = (v) =>
    Math.round(v * (1 - amount))
      .toString(16)
      .padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

const LINE = 2;
const INK = '#3d2c26';

/** A filled shape with a soft outline in a darker shade of its own color. */
const fill = (color, extra = {}) => ({
  fill: color,
  stroke: shade(color),
  strokeWidth: LINE,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
  ...extra,
});

export const HEAD = { cx: 50, cy: 48, rx: 28, ry: 24 };

/* ---------- the template ---------- */

export function Body({ c }) {
  return (
    <g>
      <path d="M27 88c-2-14 7-23 23-23s25 9 23 23c-1 5-5 6-9 6H36c-4 0-8-1-9-6z" {...fill(c.body ?? c.fill)} />
      <path
        d="M30 86c2 5 6 6 10 6h20c4 0 8-1 10-6"
        fill="none"
        stroke={shade(c.body ?? c.fill, 0.12)}
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".5"
      />
      {c.belly && <ellipse cx="50" cy="82" rx="13" ry="10.5" fill={c.belly} />}
      {c.bodyMarks}
    </g>
  );
}

export function Feet({ c }) {
  const color = c.feet ?? c.body ?? c.fill;
  return (
    <g>
      <ellipse cx="39" cy="92" rx="7.4" ry="4.6" {...fill(color)} />
      <ellipse cx="61" cy="92" rx="7.4" ry="4.6" {...fill(color)} />
      {!c.noBeans && (
        <g fill={c.beans ?? '#f5b3b3'} opacity=".85">
          <ellipse cx="39" cy="92.6" rx="2.4" ry="1.7" />
          <circle cx="35.6" cy="90.6" r="1" />
          <circle cx="39" cy="89.6" r="1" />
          <circle cx="42.4" cy="90.6" r="1" />
          <ellipse cx="61" cy="92.6" rx="2.4" ry="1.7" />
          <circle cx="57.6" cy="90.6" r="1" />
          <circle cx="61" cy="89.6" r="1" />
          <circle cx="64.4" cy="90.6" r="1" />
        </g>
      )}
    </g>
  );
}

export function Paws({ c }) {
  const color = c.paws ?? c.body ?? c.fill;
  if (c.flippers)
    return (
      <g>
        <path d="M34 74c-6 2-10 8-9 13 4 0 8-3 11-8z" {...fill(color)} />
        <path d="M66 74c6 2 10 8 9 13-4 0-8-3-11-8z" {...fill(color)} />
      </g>
    );
  return (
    <g>
      <ellipse cx="37" cy="80" rx="5.4" ry="5" {...fill(color)} />
      <ellipse cx="63" cy="80" rx="5.4" ry="5" {...fill(color)} />
    </g>
  );
}

export function Head({ c }) {
  return (
    <g>
      <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} {...fill(c.head ?? c.fill)} />
      <path d="M25 54c4 10 14 15 25 15s21-5 25-15c-4 5-13 9-25 9s-21-4-25-9z" fill={shade(c.head ?? c.fill, 0.5)} opacity=".1" />
      <ellipse cx="40" cy="32.5" rx="9.5" ry="3.8" fill="#fff" opacity=".45" transform="rotate(-14 40 32.5)" />
      <circle cx="53" cy="29" r="1.6" fill="#fff" opacity=".45" />
    </g>
  );
}

export function Face({ c }) {
  const sleepy = c.sleepy;
  return (
    <g>
      {c.muzzle && <ellipse cx="50" cy="59" rx="10" ry="7" fill={c.muzzle} />}
      {sleepy ? (
        <g stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M34.6 51q4.4 4 8.8 0M56.6 51q4.4 4 8.8 0" />
        </g>
      ) : (
        <g>
          <ellipse cx="39" cy="50.5" rx="5.4" ry="6.4" fill={INK} />
          <ellipse cx="61" cy="50.5" rx="5.4" ry="6.4" fill={INK} />
          <ellipse cx="39" cy="53.6" rx="3.6" ry="2.4" fill={c.iris ?? '#7a5444'} opacity=".55" />
          <ellipse cx="61" cy="53.6" rx="3.6" ry="2.4" fill={c.iris ?? '#7a5444'} opacity=".55" />
          <circle cx="41" cy="47.8" r="2.3" fill="#fff" />
          <circle cx="63" cy="47.8" r="2.3" fill="#fff" />
          <circle cx="37.4" cy="53" r="1" fill="#fff" opacity=".9" />
          <circle cx="59.4" cy="53" r="1" fill="#fff" opacity=".9" />
        </g>
      )}
      <ellipse cx="30" cy="59" rx="5" ry="2.9" fill={c.blush ?? '#f59a9a'} opacity=".55" />
      <ellipse cx="70" cy="59" rx="5" ry="2.9" fill={c.blush ?? '#f59a9a'} opacity=".55" />
      <path d="M27.6 58.6l1.4-1M30.6 58.6l1.4-1M68 58.6l1.4-1M71 58.6l1.4-1" stroke="#fff" strokeWidth=".9" strokeLinecap="round" opacity=".7" />
      {c.nose === 'beak' ? (
        <path d="M46.6 55.4h6.8l-3.4 4.2z" {...fill(c.beak ?? '#f6b26b', { strokeWidth: 1.2 })} />
      ) : c.nose === 'snout' ? (
        <g>
          <ellipse cx="50" cy="58" rx="5.4" ry="3.8" {...fill(c.snout ?? '#f6a8b2', { strokeWidth: 1.2 })} />
          <ellipse cx="48.2" cy="58" rx=".9" ry="1.3" fill={INK} />
          <ellipse cx="51.8" cy="58" rx=".9" ry="1.3" fill={INK} />
        </g>
      ) : c.nose === 'big' ? (
        <ellipse cx="50" cy="56.8" rx="3.6" ry="4.4" fill={INK} />
      ) : c.nose === 'none' ? null : (
        <path d="M48.3 55.2h3.4c.6 0 .9.6.5 1.1L50.6 58c-.3.4-.9.4-1.2 0l-1.6-1.7c-.4-.5-.1-1.1.5-1.1z" fill={INK} />
      )}
      {c.mouth === 'wide' && <path d="M41 58.6q9 6.4 18 0" stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none" />}
      {c.mouth !== 'wide' && c.nose !== 'beak' && c.nose !== 'snout' && (
        <path
          d={c.nose === 'big' ? 'M46.2 62.2q1.9 2 3.8 0q1.9 2 3.8 0' : 'M46.6 59.6q1.7 1.9 3.4 0q1.7 1.9 3.4 0'}
          stroke={INK}
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {c.whiskers && (
        <g stroke={shade(c.head ?? c.fill, 0.45)} strokeWidth="1" strokeLinecap="round">
          <path d="M27 57l-6-1M27 60l-6 1M73 57l6-1M73 60l6 1" />
        </g>
      )}
    </g>
  );
}

/* ---------- ears (behind the head) ---------- */

export function Ears({ c }) {
  const color = c.ear ?? c.head ?? c.fill;
  const inner = c.inner ?? '#f7c9c4';
  switch (c.ears) {
    case 'cat':
      return (
        <g>
          <path d="M26 38 29 16l16 12z" {...fill(color)} />
          <path d="M74 38 71 16 55 28z" {...fill(color)} />
          <path d="M30 31l1.4-9 7.4 5.6z" fill={inner} />
          <path d="M70 31l-1.4-9-7.4 5.6z" fill={inner} />
        </g>
      );
    case 'fox':
      return (
        <g>
          <path d="M25 40 26 10l19 18z" {...fill(color)} />
          <path d="M75 40 74 10 55 28z" {...fill(color)} />
          <path d="M29 33l.6-14 9 8.4z" fill={inner} />
          <path d="M71 33l-.6-14-9 8.4z" fill={inner} />
        </g>
      );
    case 'bear':
      return (
        <g>
          <circle cx="28" cy="29" r="8" {...fill(color)} />
          <circle cx="72" cy="29" r="8" {...fill(color)} />
          <circle cx="28.6" cy="29.6" r="4.2" fill={inner} />
          <circle cx="71.4" cy="29.6" r="4.2" fill={inner} />
        </g>
      );
    case 'bunny':
      return (
        <g>
          <ellipse cx="39" cy="14" rx="6.4" ry="15" transform="rotate(-8 39 14)" {...fill(color)} />
          <ellipse cx="61" cy="14" rx="6.4" ry="15" transform="rotate(8 61 14)" {...fill(color)} />
          <ellipse cx="39" cy="15" rx="3" ry="10" transform="rotate(-8 39 15)" fill={inner} />
          <ellipse cx="61" cy="15" rx="3" ry="10" transform="rotate(8 61 15)" fill={inner} />
        </g>
      );
    case 'floppy':
      return (
        <g>
          <ellipse cx="24" cy="48" rx="8" ry="15" transform="rotate(16 24 48)" {...fill(color)} />
          <ellipse cx="76" cy="48" rx="8" ry="15" transform="rotate(-16 76 48)" {...fill(color)} />
        </g>
      );
    case 'mouse':
      return (
        <g>
          <circle cx="25" cy="29" r="12" {...fill(color)} />
          <circle cx="75" cy="29" r="12" {...fill(color)} />
          <circle cx="25.6" cy="29.6" r="7.4" fill={inner} />
          <circle cx="74.4" cy="29.6" r="7.4" fill={inner} />
        </g>
      );
    case 'koala':
      return (
        <g>
          <circle cx="23" cy="35" r="12.5" {...fill(color)} />
          <circle cx="77" cy="35" r="12.5" {...fill(color)} />
          <circle cx="23.6" cy="36" r="7.6" fill={inner} />
          <circle cx="76.4" cy="36" r="7.6" fill={inner} />
        </g>
      );
    case 'tufts':
      return (
        <g>
          <path d="M27 36c-3-6-3-12 0-16 3 4 8 7 12 8z" {...fill(color)} />
          <path d="M73 36c3-6 3-12 0-16-3 4-8 7-12 8z" {...fill(color)} />
        </g>
      );
    case 'pig':
      return (
        <g>
          <path d="M27 34 27 20l14 8z" {...fill(color)} />
          <path d="M73 34 73 20l-14 8z" {...fill(color)} />
          <path d="M30 29l.4-5.4 5 3z" fill={inner} />
          <path d="M70 29l-.4-5.4-5 3z" fill={inner} />
        </g>
      );
    case 'side':
      return (
        <g>
          <ellipse cx="22" cy="42" rx="9" ry="5" transform="rotate(-20 22 42)" {...fill(color)} />
          <ellipse cx="78" cy="42" rx="9" ry="5" transform="rotate(20 78 42)" {...fill(color)} />
          <ellipse cx="22" cy="42" rx="5" ry="2.4" transform="rotate(-20 22 42)" fill={inner} />
          <ellipse cx="78" cy="42" rx="5" ry="2.4" transform="rotate(20 78 42)" fill={inner} />
        </g>
      );
    case 'small':
      return (
        <g>
          <circle cx="30" cy="31" r="5.4" {...fill(color)} />
          <circle cx="70" cy="31" r="5.4" {...fill(color)} />
        </g>
      );
    case 'gills':
      return (
        <g fill={c.gill} stroke={shade(c.gill)} strokeWidth={LINE} strokeLinejoin="round">
          <path d="M24 42c-8-4-12-1-12 2 4 0 7 1 12 3zM23 50c-9-1-12 3-11 5 4-1 7-1 11-1zM25 57c-7 2-9 6-7 8 3-2 6-3 9-4z" />
          <path d="M76 42c8-4 12-1 12 2-4 0-7 1-12 3zM77 50c9-1 12 3 11 5-4-1-7-1-11-1zM75 57c7 2 9 6 7 8-3-2-6-3-9-4z" />
        </g>
      );
    case 'fins':
      return (
        <g>
          <path d="M23 42c-9-6-14-2-12 3 3 3 8 3 13 1z" {...fill(c.fin)} />
          <path d="M77 42c9-6 14-2 12 3-3 3-8 3-13 1z" {...fill(c.fin)} />
        </g>
      );
    default:
      return null;
  }
}

/* ---------- tails (behind the body, to the right) ---------- */

export function Tail({ c, grow = 1 }) {
  const color = c.tailColor ?? c.body ?? c.fill;
  const t = (d) => <g transform={`translate(70 86) scale(${grow}) translate(-70 -86)`}>{d}</g>;
  switch (c.tail) {
    case 'fox':
      return t(
        <g>
          <path d="M68 88c14 2 24-6 22-20-1-7-6-11-10-11 1 9-3 16-14 20z" {...fill(color)} />
          <path d="M80 57c4 0 9 4 10 11-4-1-8-2-10-6z" fill={c.tailTip ?? '#fff6ec'} />
        </g>,
      );
    case 'curl':
      return t(<path d="M69 88c10 0 15-6 13-12-2-5-8-5-9-1-1 3 2 5 4 4" fill="none" stroke={shade(color)} strokeWidth="4.4" strokeLinecap="round" />);
    case 'pig':
      return t(<path d="M70 86c6 0 8-4 6-6-2-2-5 0-3 2 2 2 6 0 7-3" fill="none" stroke={shade(color)} strokeWidth="2.2" strokeLinecap="round" />);
    case 'puff':
      return t(<circle cx="72" cy="86" r="5.6" {...fill(c.tailColor ?? '#fffaf4')} />);
    case 'fluffy':
      return t(<ellipse cx="76" cy="80" rx="7" ry="10" transform="rotate(30 76 80)" {...fill(color)} />);
    case 'striped':
      return t(
        <g>
          <path d="M68 88c13 1 21-6 20-17-1-6-5-9-9-9 0 8-3 15-12 18z" {...fill(color)} />
          <path d="M77 66l9 4M78 74l9 1M75 81l7-3" stroke={c.stripe} strokeWidth="3.4" strokeLinecap="round" />
        </g>,
      );
    case 'thin':
      return t(<path d="M69 89c12 2 18-4 16-10-1-4-5-4-6-1" fill="none" stroke={c.tailColor ?? '#f2b6b6'} strokeWidth="2.4" strokeLinecap="round" />);
    case 'long':
      return t(<path d="M68 90c12 2 22-2 24-10 1-4-2-6-5-4-2 4-8 7-19 8z" {...fill(color)} />);
    case 'tuft':
      return t(
        <g>
          <path d="M69 88c8 0 13-5 13-12" fill="none" stroke={shade(color)} strokeWidth="2.6" strokeLinecap="round" />
          <ellipse cx="82" cy="73" rx="4.4" ry="5.6" {...fill(c.tailTip ?? shade(color, 0.15))} />
        </g>,
      );
    case 'dragon':
      return t(
        <g>
          <path d="M68 89c12 2 20-3 20-11l6-2-5-4c-3 6-9 9-20 10z" {...fill(color)} />
        </g>,
      );
    case 'fish':
      return t(
        <g>
          <path d="M68 86c8 0 12-2 15-6l7-6c1 5 0 11-3 14 4 2 6 5 6 8-6-1-11-4-14-6-3 1-7 1-11 1z" {...fill(c.fin ?? color)} />
        </g>,
      );
    default:
      return null;
  }
}

/* ---------- small helpers for marks ---------- */

export const Spots = ({ color, dots }) => (
  <g fill={color}>
    {dots.map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} />
    ))}
  </g>
);

export const Sparkle = ({ x, y, s = 1, color = '#f0c14e' }) => (
  <path d="M0-6l1.6 4.4L6 0 1.6 1.6 0 6-1.6 1.6-6 0-1.6-1.6z" fill={color} transform={`translate(${x} ${y}) scale(${s})`} />
);

/** Feathered wings behind the body, for birds and winged Pals; `big` for the later forms. */
export function Wings({ color, big = false, bat = false }) {
  const k = big ? 1.25 : 1;
  const w = bat ? (
    <g>
      <path d="M31 72c-8-9-20-10-26-4 4 0 6 2 6 5 3-2 6-1 7 2 3-2 6-1 7 2 3-1 5-3 6-5z" {...fill(color)} />
      <path d="M29 72l-12 1M28 74l-6 5" stroke={shade(color)} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  ) : (
    <g>
      <path d="M32 72c-4-7-12-11-20-8-5 2-6 7-3 9-3 2-2 6 1 7-1 3 2 5 5 4 5 2 12-1 17-12z" {...fill(color)} />
      <path
        d="M12 72c5 1 10 0 14-3M13 78c5 0 10-2 14-5M18 82c4-1 7-3 10-6"
        fill="none"
        stroke={shade(color, 0.18)}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </g>
  );
  return (
    <g>
      <g transform={`translate(31 76) scale(${k}) translate(-31 -76)`}>{w}</g>
      <g transform={`translate(100 0) scale(-1 1) translate(31 76) scale(${k}) translate(-31 -76)`}>{w}</g>
    </g>
  );
}

export { fill, INK };
