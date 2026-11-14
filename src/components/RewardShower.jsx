import { useEffect } from 'react';
import { rewardShower } from '../lib/effects.js';

/** Showers stars once when it appears (chests, prizes, gifts). Renders nothing itself. */
export default function RewardShower() {
  useEffect(() => rewardShower(), []);
  return null;
}
