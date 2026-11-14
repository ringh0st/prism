import { useLevel } from '../../hooks/useLevel.js';
import { parseChallenge } from '../../game/challenges.js';
import PlayScreen from './PlayScreen.jsx';
import LoadingScreen from '../LoadingScreen.jsx';
import NotFoundScreen from '../NotFoundScreen.jsx';

/** A friend's "beat my score" link (#/challenge/w4-06/5/Name): the level, open to anyone, even brand-new guests. */
export default function ChallengeRoute({ params }) {
  const challenge = parseChallenge(params);
  const { level, isLoading } = useLevel(challenge?.levelId ?? null);
  if (!challenge) return <NotFoundScreen />;
  if (isLoading) return <LoadingScreen />;
  if (!level) return <NotFoundScreen />;
  return <PlayScreen key={level.id} level={level} mode="challenge" challenge={challenge} />;
}
