import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { loadBuiltInWorld } from '../data/levelPack.js';
import { WORLDS, WORLD_THEMES, STARS_PER_WORLD_TO_UNLOCK, builtInLevelRefs, parseLevelId } from '../game/worlds.js';

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

const toRef = ({ id, world, index, difficulty }) => ({ id, world, index, difficulty });

/**
 * Levels = the built-in pack (loaded per world on demand) plus anything published from the
 * admin editor. Published levels with the same id replace the built-in version.
 */
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
    const publishedById = new Map(publishedLevels.map((level) => [level.id, level]));
    const extraWorldIds = [...new Set(publishedLevels.map((l) => l.world))].filter((id) => id > WORLDS.length).sort((a, b) => a - b);
    const worlds = [
      ...WORLDS,
      ...extraWorldIds.map((id) => ({
        id,
        name: `World ${id}`,
        tagline: 'Fresh from the lab',
        theme: WORLD_THEMES[(id - 1) % WORLD_THEMES.length],
        starsToUnlock: (id - 1) * STARS_PER_WORLD_TO_UNLOCK,
      })),
    ];

    /** Lightweight list of a world's levels (no tile data needed). */
    const levelRefsInWorld = (worldId) => {
      const refs = new Map(builtInLevelRefs(worldId).map((ref) => [ref.id, ref]));
      publishedLevels.filter((level) => level.world === worldId).forEach((level) => refs.set(level.id, toRef(level)));
      return [...refs.values()].sort((a, b) => a.index - b.index);
    };

    /** Full level data. Published edits win over built-in levels. */
    const loadLevel = async (id) => {
      if (publishedById.has(id)) return publishedById.get(id);
      const parsed = parseLevelId(id);
      if (!parsed) return null;
      const levels = await loadBuiltInWorld(parsed.world);
      return levels.find((level) => level.id === id) ?? null;
    };

    const nextLevelIdAfter = (id) => {
      const parsed = parseLevelId(id);
      if (!parsed) return null;
      const refs = levelRefsInWorld(parsed.world);
      const position = refs.findIndex((ref) => ref.id === id);
      if (position >= 0 && position < refs.length - 1) return refs[position + 1].id;
      return levelRefsInWorld(parsed.world + 1)[0]?.id ?? null;
    };

    // The level just before (the previous world's last level for a world's first), or null for the very first.
    const previousLevelIdBefore = (id) => {
      const parsed = parseLevelId(id);
      if (!parsed) return null;
      const refs = levelRefsInWorld(parsed.world);
      const position = refs.findIndex((ref) => ref.id === id);
      if (position > 0) return refs[position - 1].id;
      return parsed.world > 1 ? (levelRefsInWorld(parsed.world - 1).at(-1)?.id ?? null) : null;
    };

    return { worlds, levelRefsInWorld, loadLevel, nextLevelIdAfter, previousLevelIdBefore, reload, playtestLevel, setPlaytestLevel };
  }, [publishedLevels, reload, playtestLevel]);

  return <LevelsContext.Provider value={value}>{children}</LevelsContext.Provider>;
}

export function useLevels() {
  const context = useContext(LevelsContext);
  if (!context) throw new Error('useLevels must be used inside <LevelsProvider>');
  return context;
}
