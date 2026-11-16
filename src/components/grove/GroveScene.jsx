import { useEffect, useRef } from 'react';
import GrovePal from './GrovePal.jsx';
import ForestBackdrop, { SKIES } from './ForestBackdrop.jsx';
import GroveCritters from './GroveCritters.jsx';
import GroveItemShape from './GroveItemShape.jsx';
import PartyBunting from './PartyBunting.jsx';
import SeasonFall from './SeasonFall.jsx';
import { useGroveClock } from '../../hooks/useGroveClock.js';
import { useGroveParty } from '../../hooks/useGroveParty.js';
import { groveItemById } from '../../game/grove.js';
import { FRIEND_LINES, isNapTime, seasonOf, timeOfDay, visitingFriend } from '../../game/groveLife.js';
import { palById, stageOf } from '../../game/pals.js';
import { rewardShower } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { decorName } from '../../i18n/groveText.js';
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

const HELLOS = ['Hi there!', 'I love it here!', 'Let’s play!', 'Wheee!', 'So cozy!', '*happy wiggle*', 'You’re the best!'];
const FRIEND_START = { left: 34, top: 82 };

/**
 * The Grove: your partner Pal's home in the enchanted forest, with the decor you placed. The Pal wanders,
 * visits the decor, plays, follows the time of day and the season, and naps late at night. Now and then
 * one of your other Pals drops by, and after you finish a world there's a party. Tap a Pal to pet it.
 * `withPals` false leaves the Pals out (the Shop's preview of a decoration, so nothing hides it). Pals stand small
 * enough not to hide the decor.
 */
export default function GroveScene({ placed, partnerId, owned = {}, wearing = [], worldsFinished = 0, withPals = true }) {
  const { t, lang } = useI18n();
  const now = useGroveClock();
  const time = timeOfDay(now);
  const season = seasonOf(now);
  const isNapping = isNapTime(now);
  const partyWorld = useGroveParty(worldsFinished);
  const sceneRef = useRef(null);
  const bySpot = Object.fromEntries(placed.map((id) => [groveItemById(id)?.spot, id]).filter(([spot]) => spot));
  const spots = Object.keys(bySpot);
  const partner = palById(partnerId);
  const friend = palById(visitingFriend(Object.keys(owned), partnerId, now));

  useEffect(() => {
    if (!partyWorld) return undefined;
    const timer = setTimeout(() => {
      rewardShower(sceneRef.current);
      sfx.worldComplete();
    }, 500);
    return () => clearTimeout(timer);
  }, [partyWorld]);

  return (
    <div ref={sceneRef} className={`${styles.scene} ${styles[time]}`}>
      <svg
        className={styles.art}
        viewBox="0 0 400 280"
        role="img"
        aria-label={sceneLabel({ t, lang, bySpot, partner, friend, isNapping, season, partyWorld })}
        focusable="false"
      >
        <ForestBackdrop time={time} season={season} hasMoon={bySpot.sky === 'moonStars'} />
        {DRAW_ORDER.map((spot) =>
          bySpot[spot] ? (
            <g key={spot} transform={SPOT_PLACES[spot]}>
              <GroveItemShape id={bySpot[spot]} />
            </g>
          ) : null,
        )}
        {partyWorld > 0 && <PartyBunting />}
        {SKIES[time].tint && <rect width="400" height="280" fill={SKIES[time].tint} />}
        <GroveCritters time={time} season={season} />
        <SeasonFall season={season} />
      </svg>
      {withPals && friend && !isNapping && (
        <GrovePal
          palId={friend.id}
          stage={stageOf(owned[friend.id])}
          spots={spots}
          size={17}
          start={FRIEND_START}
          petLines={FRIEND_LINES}
          petLinesKey="quips.groveVisitor"
          label={t('grove.petVisitor', { name: t(`palName.${friend.id}`, {}, friend.name) })}
        />
      )}
      {withPals && partner && (
        <GrovePal
          palId={partner.id}
          stage={stageOf(owned[partner.id])}
          wearing={wearing}
          spots={spots}
          isNapping={isNapping}
          petLines={HELLOS}
          petLinesKey="quips.grovePet"
          greeting={partyWorld ? t('grove.party', { world: partyWorld }) : null}
        />
      )}
    </div>
  );
}

function sceneLabel({ t, lang, bySpot, partner, friend, isNapping, season, partyWorld }) {
  const nameOf = (pal) => t(`palName.${pal.id}`, {}, pal.name);
  const decor = Object.values(bySpot).map((id) => decorName(lang, groveItemById(id)).toLocaleLowerCase(lang));
  const living = partner ? t(isNapping ? 'grove.scene.livesNapping' : 'grove.scene.lives', { name: nameOf(partner) }) : t('grove.scene.choose');
  const visit = friend && !isNapping ? ` ${t('grove.scene.visiting', { name: nameOf(friend) })}` : '';
  const party = partyWorld ? ` ${t('grove.scene.party', { world: partyWorld })}` : '';
  const withDecor = decor.length ? t('grove.scene.with', { list: decor.join(t('grove.scene.joiner')) }) : '';
  return `${t('grove.scene.intro', { season: t(`grove.season.${season}`) })} ${living}${withDecor}.${visit}${party}`;
}
