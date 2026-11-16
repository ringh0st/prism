import { bonusGoalFor } from '../game/bonusGoals.js';

// Works out a level's bonus goal off the main thread (see findBonusGoal in bonusGoalSearch.js).
self.onmessage = ({ data }) => self.postMessage(bonusGoalFor(data));
