import PlayScreen from '../play/PlayScreen.jsx';
import LoadingScreen from '../LoadingScreen.jsx';
import NotFoundScreen from '../NotFoundScreen.jsx';
import { useEventLevels } from '../../hooks/useEventLevels.js';
import { EVENT_LEVELS, eventProgressOf, eventWeekendOf } from '../../game/events.js';
import { usePlayer } from '../../state/PlayerContext.jsx';

/** Puzzle n of this weekend's event (#/event/n). Opens only while the event runs, in order. */
export default function EventLevelRoute({ number }) {
  const { progress } = usePlayer();
  const weekend = eventWeekendOf();
  const { levels, isLoading } = useEventLevels(weekend);
  const stars = eventProgressOf(progress, weekend).stars;
  const isOpen = number === 1 || (stars[number - 1] ?? 0) > 0;
  if (isLoading) return <LoadingScreen />;
  const level = levels[number - 1];
  if (!weekend || !level || !isOpen) return <NotFoundScreen />;
  return (
    <PlayScreen key={level.id} level={level} mode="event" backHref="#/event" nextLevel={number < EVENT_LEVELS ? `#/event/${number + 1}` : null} />
  );
}
