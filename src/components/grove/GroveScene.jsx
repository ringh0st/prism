import { useState } from 'react';
import { usePalLife } from '../../hooks/usePalLife.js';
import PalArt from '../pals/PalArt.jsx';
import GroveItemShape from './GroveItemShape.jsx';
import { groveItemById } from '../../game/grove.js';
import { palById, palStage } from '../../game/pals.js';
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

/** How wide your partner is, as % of the scene. */
const PAL_SIZE = 30;

const HELLOS = ['Hi there!', 'I love it here!', 'Let’s play!', 'Wheee!', 'So cozy!', '*happy wiggle*', 'You’re the best!'];

/** The sky through the day: soft pink mornings, warm days, peach evenings, quiet starry nights. */
const SKIES = {
  dawn: { sky: '#F8E4D4', sun: '#F9C9A0', tint: null },
  day: { sky: '#F6EED9', sun: '#FBE3A6', tint: null },
  dusk: { sky: '#F3D2B5', sun: '#F2A67E', tint: 'rgba(223, 116, 88, 0.12)' },
  night: { sky: '#3A3530', sun: null, tint: 'rgba(28, 26, 22, 0.42)' },
};

/** Hills and trees under the sky of the moment; at night the moon and stars come out. */
function ForestBackdrop({ time, hasMoon }) {
  const sky = SKIES[time];
  const isNight = time === 'night';
  return (
    <>
      <rect width="400" height="280" fill={hasMoon && !isNight ? '#EDE6D6' : sky.sky} />
      {isNight && (
        <g fill="#FFF1C2">
          <path d="M338 30a18 18 0 1 0 14 30 15 15 0 1 1-14-30z" />
          {[
            [60, 30],
            [120, 18],
            [200, 36],
            [260, 14],
            [300, 60],
            [90, 64],
          ].map(([x, y]) => (
            <circle key={x} className={styles.star} cx={x} cy={y} r="1.6" style={{ animationDelay: `${-x / 40}s` }} />
          ))}
        </g>
      )}
      {sky.sun && !hasMoon && <circle cx="330" cy={time === 'day' ? 46 : 70} r="26" fill={sky.sun} />}
      <path
        className={styles.cloud}
        d="M30 60a10 10 0 0 1 3-19 15 15 0 0 1 28-4 12 12 0 0 1 22 3 11 11 0 0 1 18 10 8 8 0 0 1 5 10z"
        fill="#FFFDF6"
        opacity=".85"
      />
      <g fill="#B9D9B8" className={styles.canopy}>
        <circle cx="20" cy="120" r="46" />
        <circle cx="90" cy="96" r="40" />
        <circle cx="200" cy="104" r="44" />
        <circle cx="300" cy="100" r="42" />
        <circle cx="380" cy="118" r="44" />
      </g>
      <g fill="#9CC9A3" className={`${styles.canopy} ${styles.canopyNear}`}>
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

/** A little butterfly looping around the clearing. */
function Butterfly() {
  return (
    <g className={styles.butterfly} aria-hidden="true">
      <animateMotion dur="16s" repeatCount="indefinite" path="M60 150C110 90 170 120 200 90S300 60 340 110 300 190 230 170 120 210 60 150z" />
      <g className={styles.wings}>
        <ellipse cx="-4" cy="-2" rx="5" ry="4" fill="#F2A67E" />
        <ellipse cx="4" cy="-2" rx="5" ry="4" fill="#F2A67E" />
        <ellipse cx="-3" cy="3" rx="3" ry="2.6" fill="#F0C14E" />
        <ellipse cx="3" cy="3" rx="3" ry="2.6" fill="#F0C14E" />
      </g>
      <rect x="-0.8" y="-4" width="1.6" height="9" rx="0.8" fill="#5E5047" />
    </g>
  );
}

/** A pair of birds crossing the sky now and then (mornings and days). */
function Birds() {
  return (
    <g className={styles.birds} aria-hidden="true" fill="none" stroke="#5E5047" strokeWidth="1.6" strokeLinecap="round">
      <path className={styles.bird} d="M0 0q4-4 8 0q4-4 8 0" />
      <path className={styles.bird} d="M14 10q3-3 6 0q3-3 6 0" style={{ animationDelay: '-0.2s' }} />
    </g>
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
 * The Grove: your partner Pal's home in the enchanted forest, with the decor you placed. The Pal wanders,
 * visits the decor, shows little moods, follows the time of day and naps late at night. Tap it to pet it.
 */
export default function GroveScene({ placed, partnerId, stage = 0, wearing = [] }) {
  const [pet, setPet] = useState(null);
  const bySpot = Object.fromEntries(placed.map((id) => [groveItemById(id)?.spot, id]).filter(([spot]) => spot));
  const partner = palById(partnerId);
  const life = usePalLife(Object.keys(bySpot));
  const sky = SKIES[life.time];

  const petPal = () => {
    const line = life.isNapping ? 'Five more minutes…' : HELLOS[Date.now() % HELLOS.length];
    setPet({ line, key: Date.now() });
    sfx.hello();
  };
  const talk = pet?.line ?? life.emote?.line;

  return (
    <div className={`${styles.scene} ${styles[life.time]}`}>
      <svg className={styles.art} viewBox="0 0 400 280" role="img" aria-label={sceneLabel(bySpot, partner, life)} focusable="false">
        <ForestBackdrop time={life.time} hasMoon={bySpot.sky === 'moonStars'} />
        {DRAW_ORDER.map((spot) =>
          bySpot[spot] ? (
            <g key={spot} transform={SPOT_PLACES[spot]}>
              <GroveItemShape id={bySpot[spot]} />
            </g>
          ) : null,
        )}
        {sky.tint && <rect width="400" height="280" fill={sky.tint} />}
        {(life.time === 'dawn' || life.time === 'day') && <Birds />}
        <Fireflies />
        {life.time !== 'night' && <Butterfly />}
      </svg>
      {partner && (
        <button
          type="button"
          className={`${styles.pal} ${life.isWalking ? styles.walking : ''}`}
          style={{ left: `${life.place.left}%`, top: `${life.place.top}%`, width: `${PAL_SIZE}%`, transitionDuration: `${life.walkMs}ms` }}
          onClick={petPal}
          aria-label={`Pet ${partner.name}, ${palStage(stage).name}${life.isNapping ? ' (napping)' : ''}`}
        >
          {/* A new key on every pet replays the hop. */}
          <span key={pet?.key ?? 'still'} className={`${styles.body} ${pet ? styles.hop : ''}`} style={{ '--facing': life.facing }}>
            <PalArt palId={partner.id} stage={stage} wearing={wearing} size="100%" alive={!life.isNapping} />
          </span>
          {life.emote && !pet && (
            <span key={life.emote.key} className={`${styles.emote} ${life.emote.symbol === 'z' ? styles.snore : ''}`} aria-hidden="true">
              {life.emote.symbol}
            </span>
          )}
          {pet && (
            <span key={pet.key} className={styles.hearts} aria-hidden="true">
              <span>♥</span>
              <span>♥</span>
              <span>♥</span>
            </span>
          )}
          {talk && (
            <span key={talk} className={styles.bubble} role="status">
              {talk}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function sceneLabel(bySpot, partner, life) {
  const decor = Object.values(bySpot).map((id) => groveItemById(id).name.toLowerCase());
  const living = partner ? `${partner.name} lives here${life.isNapping ? ' and is napping' : ''}` : 'Choose a Pal to live here';
  return `Your Grove in the enchanted forest. ${living}${decor.length ? `, with a ${decor.join(', a ')}` : ''}.`;
}
