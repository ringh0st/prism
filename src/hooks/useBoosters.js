import { useCallback, useState } from 'react';
import { BOOSTERS } from '../game/catalog.js';

/**
 * The boosters for one visit to a level: which ones the player picks on the level card, then what they give
 * once the level starts (extra moves, undos left, Head Start). Picked boosters are spent at the start; one
 * the player doesn't hold asks to be bought first (`onNeedBuy`).
 * @param enabled  boosters are offered on this level
 * @param free     boosters a win streak gives for free (always on, nothing spent), with `streak` its length
 * @returns { picker, start, extraMoves, undosLeft, spendUndo, choose }
 */
export function useBoosters({ enabled, free = [], streak = 0, owned, consumeHelper, puzzle, onNeedBuy }) {
  const [chosen, setChosen] = useState([]);
  const [active, setActive] = useState([]);
  const [undosUsed, setUndosUsed] = useState(0);

  const choose = useCallback((id) => setChosen((list) => (list.includes(id) ? list : [...list, id])), []);
  const toggle = (id) => {
    if (free.includes(id)) return;
    if (chosen.includes(id)) setChosen(chosen.filter((other) => other !== id));
    else if ((owned[id] ?? 0) < 1) onNeedBuy(id);
    else choose(id);
  };

  /** Spends the picked boosters and switches them on. @returns the ids that were used */
  const start = async () => {
    const used = enabled ? [...free] : [];
    for (const id of chosen) {
      try {
        await consumeHelper(id);
        used.push(id);
      } catch {
        // Not spent (offline, none left): that booster just isn't used.
      }
    }
    if (used.includes('headStart')) puzzle.startWithHeadStart();
    setActive(used);
    setChosen([]);
    return used;
  };

  const undos = active.includes('steadyHand') ? BOOSTERS.steadyHand.undos : 0;
  return {
    picker: enabled ? { owned, chosen, free, streak, onToggle: toggle } : null,
    start,
    choose,
    extraMoves: active.includes('spareMoves') ? BOOSTERS.spareMoves.moves : 0,
    undosLeft: undos - undosUsed,
    spendUndo: () => {
      puzzle.undo();
      setUndosUsed((n) => n + 1);
    },
  };
}
