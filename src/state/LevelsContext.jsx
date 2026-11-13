import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import seedLevels from '../data/seedLevels.json';
import { supabase } from '../lib/supabase.js';
import { WORLDS } from '../game/worlds.js';

const LevelsContext = createContext(null);

/** Database row → level object used by the game. */
export function levelFromRow(row) {
  return {
    ...row.data,
    id: row.id,
    world: row.world,
    index: row.level_index,
    difficulty: row.difficulty,
    name: row.name,
    par: row.par,
    isPublished: row.is_published,
  };
}

/** Level object → database row. */
export function rowFromLevel(level, { isPublished }) {
  const { id, world, index, difficulty, name = '', par, width, height, tiles, version = 1 } = level;
  return {
    id,
    world,
    level_index: index,
    difficulty,
    name,
    par,
    data: { version, width, height, tiles },
    is_published: isPublished,
  };
}

const byWorldThenIndex = (a, b) => a.world - b.world || a.index - b.index;

function mergeById(base, overrides) {
  const map = new Map(base.map((level) => [level.id, level]));
  overrides.forEach((level) => map.set(level.id, level));
  return [...map.values()].sort(byWorldThenIndex);
}

export function LevelsProvider({ children }) {
  const [publishedLevels, setPublishedLevels] = useState([]);
  const [playtestLevel, setPlaytestLevel] = useState(null);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('levels')
      .select('id, world, level_index, difficulty, name, par, data, is_published')
      .eq('is_published', true);
    if (!error && data) setPublishedLevels(data.map(levelFromRow));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => {
    const levels = mergeById(seedLevels, publishedLevels);
    const worldIds = [...new Set(levels.map((level) => level.world))].sort((a, b) => a - b);
    const worlds = worldIds.map(
      (id) =>
        WORLDS.find((world) => world.id === id) ?? {
          id,
          name: `World ${id}`,
          tagline: 'New challenges',
          theme: 'sunshine',
          starsToUnlock: (WORLDS.at(-1)?.starsToUnlock ?? 0) + (id - WORLDS.length) * 40,
        },
    );
    const levelsInWorld = (worldId) => levels.filter((level) => level.world === worldId);
    return {
      levels,
      worlds,
      levelsInWorld,
      levelById: (id) => levels.find((level) => level.id === id) ?? null,
      nextLevelAfter: (id) => {
        const position = levels.findIndex((level) => level.id === id);
        return position >= 0 ? levels[position + 1] ?? null : null;
      },
      reload,
      playtestLevel,
      setPlaytestLevel,
    };
  }, [publishedLevels, reload, playtestLevel]);

  return <LevelsContext.Provider value={value}>{children}</LevelsContext.Provider>;
}

export function useLevels() {
  const context = useContext(LevelsContext);
  if (!context) throw new Error('useLevels must be used inside <LevelsProvider>');
  return context;
}
