import { useState } from 'react';
import PalArt from '../pals/PalArt.jsx';
import GroveItemShape from './GroveItemShape.jsx';
import { groveItemById } from '../../game/grove.js';
import { palById, palStage, stageOf } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './GroveScene.module.css';

/** Where each spot's decor stands in the 400×280 scene (its 100×100 box is moved and scaled). */
const SPOT_PLACES = {
  sky: 'translate(150 0) scale(1.1)',
  home: 'translate(26 42) scale(1.45)',
  light: 'translate(178 104) scale(.8)',
  seat: 'translate(286 98) scale(.95)',
  garden: 'translate(2 182) scale(.95)',
  water: 'translate(262 168) scale(1.25)',
};
/** Draw order: far things first. */
const DRAW_ORDER = ['sky', 'home', 'light', 'seat', 'garden', 'water'];

/** Where Pals stand, as % of the scene: the partner front and center, the rest of the team around. */
const PAL_PLACES = [
  { left: 50, top: 70, size: 25 },
  { left: 26, top: 64, size: 17 },
  { left: 74, top: 62, size: 17 },
  { left: 13, top: 78, size: 15 },
  { left: 87, top: 79, size: 15 },
  { left: 38, top: 86, size: 14 },
  { left: 64, top: 87, size: 14 },
];

const HELLOS = ['Hi there!', 'I love it here!', 'Let’s play!', 'Wheee!', 'So cozy!', '*happy wiggle*'];

/** Hills and trees; the sun steps aside when the moon is up. */
function ForestBackdrop({ hasMoon }) {
  return (
    <>
      <rect width="400" height="280" fill={hasMoon ? '#EDE6D6' : '#F6EED9'} />
      {!hasMoon && <circle cx="330" cy="46" r="26" fill="#FBE3A6" />}
      <g fill="#B9D9B8">
        <circle cx="20" cy="120" r="46" />
        <circle cx="90" cy="96" r="40" />
        <circle cx="200" cy="104" r="44" />
        <circle cx="300" cy="100" r="42" />
        <circle cx="380" cy="118" r="44" />
      </g>
      <g fill="#9CC9A3">
        <circle cx="54" cy="142" r="40" />
        <circle cx="150" cy="134" r="36" />
        <circle cx="250" cy="138" r="38" />
        <circle cx="350" cy="142" r="40" />
      </g>
      <path d="M0 168C80 150 150 160 210 156s130-10 190 2V280H0z" fill="#CFE5B5" />
      <path d="M120 280c20-40 70-70 90-112 8 40 40 80 70 112z" fill="#EBDDB8" />
      <g fill="#B7D69C">
        <path d="M40 212l4-10 4 10zM96 236l3-8 3 8zM318 160l4-9 4 9zM228 206l3-8 3 8zM360 228l4-10 4 10z" />
      </g>
    </>
  );
}

function Fireflies() {
  return (
    <g className={styles.fireflies} aria-hidden="true">
      {[
        [60, 70],
        [140, 40],
        [240, 64],
        [370, 84],
        [110, 150],
        [320, 140],
      ].map(([x, y], i) => (
        <g key={x} style={{ animationDelay: `${i * -0.7}s` }}>
          <circle cx={x} cy={y} r="6" fill="#FFE38A" opacity=".35" />
          <circle cx={x} cy={y} r="2.2" fill="#F0C14E" />
        </g>
      ))}
    </g>
  );
}

/**
 * The Grove: the Pals' home in the enchanted forest, with the player's placed decor and their team.
 * Tap a Pal to say hello.
 */
export default function GroveScene({ placed, team, partnerId, wearing = [] }) {
  const [hello, setHello] = useState(null);
  const bySpot = Object.fromEntries(placed.map((id) => [groveItemById(id)?.spot, id]).filter(([spot]) => spot));
  const ordered = [partnerId, ...team.map((pal) => pal.id).filter((id) => id !== partnerId)].filter(Boolean).slice(0, PAL_PLACES.length);

  const sayHello = (palId, index) => {
    setHello({ palId, line: HELLOS[(index + Date.now()) % HELLOS.length], key: Date.now() });
    sfx.sparkle();
  };

  return (
    <div className={styles.scene}>
      <svg className={styles.art} viewBox="0 0 400 280" role="img" aria-label={sceneLabel(bySpot, ordered)} focusable="false">
        <ForestBackdrop hasMoon={bySpot.sky === 'moonStars'} />
        {DRAW_ORDER.map((spot) =>
          bySpot[spot] ? (
            <g key={spot} transform={SPOT_PLACES[spot]}>
              <GroveItemShape id={bySpot[spot]} />
            </g>
          ) : null,
        )}
        <Fireflies />
      </svg>
      {ordered.map((palId, index) => {
        const pal = palById(palId);
        const owned = team.find((member) => member.id === palId)?.owned;
        const place = PAL_PLACES[index];
        return (
          <button
            key={palId}
            type="button"
            className={`${styles.pal} ${hello?.palId === palId ? styles.hop : ''}`}
            style={{ left: `${place.left}%`, top: `${place.top}%`, width: `${place.size}%`, animationDelay: `${index * -0.6}s` }}
            onClick={() => sayHello(palId, index)}
            aria-label={`Say hi to ${pal.name}, ${palStage(stageOf(owned)).name}`}
          >
            <PalArt palId={palId} stage={stageOf(owned)} wearing={palId === partnerId ? wearing : []} size="100%" />
            {hello?.palId === palId && (
              <span key={hello.key} className={styles.bubble} role="status">
                {hello.line}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function sceneLabel(bySpot, palIds) {
  const decor = Object.values(bySpot).map((id) => groveItemById(id).name.toLowerCase());
  const pals = palIds.map((id) => palById(id).name);
  const living = pals.length ? `${pals.join(', ')} ${pals.length === 1 ? 'lives' : 'live'} here` : 'No Pals live here yet';
  return `Your Grove in the enchanted forest. ${living}${decor.length ? `, with a ${decor.join(', a ')}` : ''}.`;
}
