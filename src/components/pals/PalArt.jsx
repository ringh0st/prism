import { accessoryById, palStage } from '../../game/pals.js';
import { ThemeOutfit } from './themeOutfitArt.jsx';
import styles from './PalArt.module.css';
import PAL_FIT from './palFit.json';

const SLOT_ORDER = ['neck', 'head', 'hand'];
const slotOf = (id) => accessoryById(id)?.slot;
const bySlotOrder = (a, b) => SLOT_ORDER.indexOf(slotOf(a)) - SLOT_ORDER.indexOf(slotOf(b));

/*
 * Pals are hand-drawn kawaii stickers, one SVG per form (assets/pals/drawn/<id>-<1…5>.svg, Baby to Master) on a
 * shared 100×100 stage: every Pal sits on y≈94 with the top of its head at y≈25, its eyes at (39,51)/(61,51) and
 * its neck at y≈70, so each outfit piece fits every Pal and form. Each form is drawn older and grander (the Master
 * brings its own golden glow); every form is shown at the same size.
 */
const PICTURES = Object.fromEntries(
  Object.entries(import.meta.glob('../../assets/pals/drawn/*.svg', { eager: true, query: '?url', import: 'default' })).map(([path, url]) => [
    path.split('/').pop().replace('.svg', ''),
    url,
  ]),
);
const HAT = [50, 23];
const NECK = 70;
// Capes and cloaks hang behind the Pal; only their clasp shows in front.
const WORN_BEHIND = new Set(['cape', 'elvenCloak']);


export function Accessory({ id, hat, neck }) {
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
    case 'beanie':
      return (
        <g transform={`translate(${hx} ${hy + 6})`}>
          <path d="M-20 4a20 18 0 0 1 40 0z" fill="#df9078" />
          <rect x="-21" y="1" width="42" height="7" rx="3" fill="#c97a52" />
          <circle cx="0" cy="-15" r="5" fill="#fffaf2" />
        </g>
      );
    case 'wizardHat':
      return (
        <g transform={`translate(${hx} ${hy + 4}) rotate(-8)`}>
          <ellipse cx="0" cy="2" rx="22" ry="5" fill="#3f8a64" />
          <path d="M-13 1 3-32 13 1z" fill="#58ac82" />
          <path d="M-2-14l2-4 2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3z" fill="#f0c14e" />
        </g>
      );
    case 'medal':
      return (
        <g>
          <path d={`M42 ${neck - 6}l8 14 8-14`} stroke="#58ac82" strokeWidth="4" fill="none" />
          <circle cx="50" cy={neck + 11} r="6.5" fill="#f0c14e" />
          <path d={`M50 ${neck + 7}l1.4 3 3 .4-2.2 2 .6 3-2.8-1.5-2.8 1.5.6-3-2.2-2 3-.4z`} fill="#c99a2e" />
        </g>
      );
    case 'cape':
      return (
        <g>
          <path d={`M30 ${neck - 3}q20 8 40 0l8 26q-28 8-56 0z`} fill="#df7458" opacity=".9" />
          <path d={`M30 ${neck - 3}q20 8 40 0`} stroke="#b05a40" strokeWidth="4" fill="none" />
          <circle cx="50" cy={neck + 1} r="3.5" fill="#f0c14e" />
        </g>
      );
    case 'balloon':
      return (
        <g>
          <path d={`M78 ${neck + 6}q-4-18 4-34`} stroke="#7d6e63" strokeWidth="1.5" fill="none" />
          <ellipse cx="84" cy={neck - 34} rx="10" ry="12" fill="#df7458" />
          <ellipse cx="80" cy={neck - 38} rx="3" ry="4" fill="#fff" opacity=".6" />
        </g>
      );
    case 'lantern':
      return (
        <g transform={`translate(80 ${neck - 4})`}>
          <circle cx="0" cy="8" r="12" fill="#ffe27a" opacity=".35" />
          <path d="M0-8v6" stroke="#7d6e63" strokeWidth="2" />
          <rect x="-6" y="-2" width="12" height="16" rx="4" fill="#f0c14e" />
          <rect x="-7" y="-4" width="14" height="4" rx="2" fill="#7d6e63" />
        </g>
      );
    case 'magicWand':
      return (
        <g transform={`translate(80 ${neck})`}>
          <path d="M-6 12 8-14" stroke="#4a3e36" strokeWidth="4" strokeLinecap="round" />
          <path d="M8-24l2.6 5.4 6 .9-4.3 4.2 1 5.9L8-10.4l-5.3 2.8 1-5.9-4.3-4.2 6-.9z" fill="#f0c14e" />
        </g>
      );
    case 'heroShield':
      return (
        <g transform={`translate(80 ${neck + 2})`}>
          <path d="M-12-12h24v8c0 10-6 16-12 19-6-3-12-9-12-19z" fill="#58ac82" />
          <path d="M-7-7h14v4c0 6-3 9-7 11-4-2-7-5-7-11z" fill="#f0c14e" />
        </g>
      );
    case 'sword':
      return (
        <g transform={`translate(80 ${neck + 4}) rotate(18)`}>
          <path d="M-3-36h6v30h-6z" fill="#d8dde0" />
          <path d="M-3-36 0-41 3-36z" fill="#d8dde0" />
          <path d="M0-35v28" stroke="#fff" strokeWidth="1.5" opacity=".7" />
          <rect x="-10" y="-7" width="20" height="5" rx="2" fill="#c99a2e" />
          <rect x="-2.5" y="-2" width="5" height="11" rx="2" fill="#a8734a" />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path
            d={`M${hx - 25} ${hy + 24}Q${hx} ${hy - 12} ${hx + 25} ${hy + 24}`}
            stroke="#4a3e36"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <rect x={hx - 32} y={hy + 16} width="12" height="18" rx="5" fill="#58ac82" />
          <rect x={hx + 20} y={hy + 16} width="12" height="18" rx="5" fill="#58ac82" />
        </g>
      );
    case 'crown':
      return (
        <g transform={`translate(${hx} ${hy})`}>
          <path d="M-15 2-17-14l9 7 8-12 8 12 9-7-2 16z" fill="#f0c14e" />
          <rect x="-15" y="0" width="30" height="5" rx="2" fill="#c99a2e" />
          <circle cx="0" cy="-4" r="2.6" fill="#df7458" />
        </g>
      );
    default:
      return <ThemeOutfit id={id} hat={hat} neck={neck} />;
  }
}

/*
 * Every form is shown at the same size: growing up shows in how the Pal looks (features, details, the Master's
 * glow), never in how big it is. Each drawing has its own scale to one shared size (palFit.json, `npm run pals:fit`);
 * it scales around the floor together with the outfit, which is drawn for the shared stage.
 */
/** The square to show: the whole stage, or (as a portrait) just the Pal, for round avatars. */
const viewBoxFor = (isPortrait) => (isPortrait ? '4 8 92 92' : '0 0 100 100');

/** A steady, different breathing rhythm for each Pal, so a group never moves in unison. */
const blinkDelay = (palId) => `${-([...palId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 50) / 10}s`;

/**
 * A Pal in one of its five forms, wearing up to one item per slot (head, neck, hand). Decorative unless `label` is given.
 * `portrait` zooms in on the Pal, for round avatars. `alive` makes it breathe (for big, featured Pals).
 */
export default function PalArt({ palId, stage = 0, wearing = [], size = 64, portrait = false, alive = false, label, className = '' }) {
  const stageIndex = palStage(stage).index;
  const picture = PICTURES[`${palId}-${stageIndex + 1}`];
  if (!picture) return null;
  const fit = PAL_FIT[`${palId}-${stageIndex + 1}`] ?? 1;
  return (
    <svg
      className={`${alive ? styles.alive : ''} ${className}`}
      style={alive ? { '--blink-delay': blinkDelay(palId) } : undefined}
      width={size}
      height={size}
      viewBox={viewBoxFor(portrait)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      overflow="visible"
    >
      <ellipse cx="50" cy="95" rx="24" ry="4" fill="rgba(60,40,20,.14)" />
      <g transform={`translate(50 94) scale(${fit}) translate(-50 -94)`}>
        <g className={styles.body}>
          {wearing
            .filter((id) => WORN_BEHIND.has(id))
            .map((id) => (
              <g key={id} transform={`translate(50 ${NECK}) scale(1.25 1.05) translate(-50 ${-NECK})`}>
                <Accessory id={id} hat={HAT} neck={NECK} />
              </g>
            ))}
          <image href={picture} x="0" y="0" width="100" height="100" />
          {wearing.some((id) => WORN_BEHIND.has(id)) && <circle cx="50" cy={NECK + 1} r="3.2" fill="#f0c14e" stroke="#c99a2e" strokeWidth="1" />}
          {[...wearing]
            .filter((id) => !WORN_BEHIND.has(id))
            .sort(bySlotOrder)
            .map((id) => (
              <Accessory key={id} id={id} hat={HAT} neck={NECK} />
            ))}
        </g>
      </g>
    </svg>
  );
}
