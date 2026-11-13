import { useCallback, useEffect, useMemo, useState } from 'react';
import Board from '../../components/board/Board.jsx';
import Button from '../../components/Button.jsx';
import Dialog from '../../components/Dialog.jsx';
import DifficultyBadge from '../../components/DifficultyBadge.jsx';
import ToolPalette from './ToolPalette.jsx';
import seedLevels from '../../data/seedLevels.json';
import { useLevels } from '../../state/LevelsContext.jsx';
import { navigate } from '../../hooks/useHashRoute.js';
import { deleteLevel, fetchAllLevels, importLevels, saveLevel } from '../../lib/adminApi.js';
import { traceBeams } from '../../game/beam.js';
import { analyzeLevel } from '../../game/solver.js';
import { validateLevel } from '../../game/levelSchema.js';
import { generateLevel } from '../../game/generator.js';
import { generatorPresetFor, levelId } from '../../game/worlds.js';
import { DIFFICULTY, TILE } from '../../game/constants.js';
import {
  applyNearestSolution,
  createBlankLevel,
  cycleTileAt,
  makeTile,
  placeTile,
  removeTileAt,
  resizeLevel,
  scrambleLevel,
  toggleLockAt,
} from '../../game/editing.js';
import { createRandom } from '../../lib/random.js';
import styles from './Admin.module.css';

const STATUS_CLASS = { published: styles.published, draft: styles.draft, 'built-in': styles.builtIn };
const clampSize = (n) => Math.max(3, Math.min(10, Number(n) || 3));

function LevelList({ entries, selectedId, onSelect }) {
  const worlds = [...new Set(entries.map((e) => e.world))].sort((a, b) => a - b);
  return (
    <nav className={styles.levelList} aria-label="Levels">
      {worlds.map((world) => (
        <div key={world}>
          <h3>World {world}</h3>
          <ul>
            {entries
              .filter((e) => e.world === world)
              .map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={`${styles.levelItem} ${entry.id === selectedId ? styles.levelItemActive : ''}`}
                    aria-current={entry.id === selectedId ? 'true' : undefined}
                    onClick={() => onSelect(entry)}
                  >
                    <span>
                      {entry.world}-{entry.index}
                    </span>
                    <DifficultyBadge difficulty={entry.difficulty} compact />
                    <span className={`${styles.status} ${STATUS_CLASS[entry.status]}`}>{entry.status}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function LevelEditor() {
  const { reload: reloadGameLevels, setPlaytestLevel } = useLevels();
  const [dbLevels, setDbLevels] = useState([]);
  const [draft, setDraft] = useState(() => ({ ...seedLevels[0] }));
  const [tool, setTool] = useState('cycle');
  const [color, setColor] = useState('sun');
  const [dir, setDir] = useState('right');
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const refreshList = useCallback(async () => {
    try {
      setDbLevels(await fetchAllLevels());
    } catch {
      setMessage('Could not load levels from the database. Did you run supabase/schema.sql?');
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const entries = useMemo(() => {
    const inDb = new Set(dbLevels.map((l) => l.id));
    return [
      ...dbLevels.map((l) => ({ ...l, status: l.isPublished ? 'published' : 'draft' })),
      ...seedLevels.filter((l) => !inDb.has(l.id)).map((l) => ({ ...l, status: 'built-in' })),
    ].sort((a, b) => a.world - b.world || a.index - b.index);
  }, [dbLevels]);

  const dbEntry = dbLevels.find((l) => l.id === draft.id);
  const problems = useMemo(() => validateLevel(draft), [draft]);
  const trace = useMemo(() => traceBeams(draft), [draft]);
  const analysis = useMemo(() => (problems.length ? null : analyzeLevel(draft)), [draft, problems]);
  const orients = draft.tiles.map((t) => t.orient ?? 0);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const onActivate = (cell) => {
    const x = cell % draft.width;
    const y = Math.floor(cell / draft.width);
    setDraft((level) => {
      if (tool === 'cycle') return cycleTileAt(level, x, y);
      if (tool === 'lock') return toggleLockAt(level, x, y);
      if (tool === 'erase') return removeTileAt(level, x, y);
      return placeTile(level, makeTile(tool, x, y, { color, dir }));
    });
  };

  const run = async (action, successMessage) => {
    setIsBusy(true);
    setMessage('');
    try {
      await action();
      setMessage(successMessage);
      await refreshList();
      await reloadGameLevels();
    } catch (error) {
      setMessage(`Something went wrong: ${error.message ?? error}`);
    } finally {
      setIsBusy(false);
    }
  };

  const canSave = !problems.length && analysis?.isSolvable && !trace.isSolved;
  const saveAs = (isPublished) =>
    run(
      () => saveLevel({ ...draft, par: analysis.par }, { isPublished }),
      isPublished ? `Published ${draft.id}. Players see it right away.` : `Saved ${draft.id} as a draft.`,
    );

  const generate = () => {
    const level = generateLevel(generatorPresetFor(draft.world, draft.index), createRandom(`${Date.now()}`));
    if (level) {
      setDraft((d) => ({ ...d, width: level.width, height: level.height, tiles: level.tiles, par: level.par }));
      setMessage(`Generated a new puzzle (par ${level.par}). Tweak it, then save.`);
    } else {
      setMessage('Generator could not find a puzzle for these settings. Try again.');
    }
  };

  const scramble = () => {
    const target = draft.difficulty === DIFFICULTY.EXTRA ? 6 : draft.difficulty === DIFFICULTY.HARD ? 4 : 2;
    const result = scrambleLevel(draft, createRandom(`${Date.now()}`), target);
    if (result) {
      setDraft(result);
      setMessage(`Scrambled. Par is now ${result.par}.`);
    } else {
      setMessage('Make the level solvable first, then scramble.');
    }
  };

  const newLevel = () => {
    const world = draft.world;
    const index = Math.max(0, ...entries.filter((e) => e.world === world).map((e) => e.index)) + 1;
    setDraft(createBlankLevel({ id: levelId(world, index), world, index }));
    setMessage('New empty level. Add a light source and a gem, or press Generate.');
  };

  return (
    <div className={styles.editor}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarActions}>
          <Button size="sm" onClick={newLevel}>
            New level
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={isBusy}
            onClick={() => run(() => importLevels(seedLevels, { isPublished: true }), 'Imported the built-in levels.')}
          >
            Import built-in
          </Button>
        </div>
        <LevelList entries={entries} selectedId={draft.id} onSelect={(entry) => setDraft({ ...entry })} />
      </aside>

      <div className={styles.workspace}>
        <div className={styles.properties}>
          <label>
            ID
            <input value={draft.id} onChange={(e) => update({ id: e.target.value.trim() })} />
          </label>
          <label>
            World
            <input type="number" min="1" value={draft.world} onChange={(e) => update({ world: Math.max(1, Number(e.target.value)) })} />
          </label>
          <label>
            Number
            <input type="number" min="1" value={draft.index} onChange={(e) => update({ index: Math.max(1, Number(e.target.value)) })} />
          </label>
          <label>
            Difficulty
            <select value={draft.difficulty} onChange={(e) => update({ difficulty: e.target.value })}>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
              <option value="extra">Extra hard</option>
            </select>
          </label>
          <label>
            Name (optional)
            <input value={draft.name ?? ''} onChange={(e) => update({ name: e.target.value })} />
          </label>
          <label>
            Width
            <input type="number" min="3" max="10" value={draft.width} onChange={(e) => setDraft((d) => resizeLevel(d, clampSize(e.target.value), d.height))} />
          </label>
          <label>
            Height
            <input type="number" min="3" max="10" value={draft.height} onChange={(e) => setDraft((d) => resizeLevel(d, d.width, clampSize(e.target.value)))} />
          </label>
        </div>

        <div className={styles.canvas}>
          <Board level={draft} orients={orients} turns={orients} trace={trace} onActivate={onActivate} isEditing label="Level editor board" />
        </div>

        <div className={styles.analysis} aria-live="polite">
          {problems.length > 0 ? (
            <ul className={styles.problems}>
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : analysis?.tooComplex ? (
            <p>Too many rotatable pieces to analyze (max 16). Lock some mirrors.</p>
          ) : analysis?.isSolvable ? (
            <p>
              ✅ Solvable · <strong>par {analysis.par}</strong> · {analysis.solutionCount} solution{analysis.solutionCount === 1 ? '' : 's'}
              {trace.isSolved && <strong className={styles.warn}> · Starts solved: press Scramble</strong>}
            </p>
          ) : (
            <p className={styles.warn}>❌ Not solvable yet. Every gem must be reachable without lighting a shadow crystal.</p>
          )}
        </div>

        <div className={styles.actionsRow}>
          <Button size="sm" variant="secondary" onClick={generate}>
            Generate
          </Button>
          <Button size="sm" variant="secondary" onClick={scramble}>
            Scramble
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setDraft(applyNearestSolution(draft))} disabled={!analysis?.isSolvable}>
            Show solution
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon="play"
            disabled={!canSave}
            onClick={() => {
              setPlaytestLevel({ ...draft, par: analysis.par });
              navigate('#/test');
            }}
          >
            Test play
          </Button>
        </div>
        <div className={styles.actionsRow}>
          <Button size="sm" variant="secondary" disabled={!canSave || isBusy} onClick={() => saveAs(false)}>
            Save draft
          </Button>
          <Button size="sm" disabled={!canSave || isBusy} onClick={() => saveAs(true)}>
            Publish
          </Button>
          {dbEntry?.isPublished && (
            <Button size="sm" variant="secondary" disabled={isBusy} onClick={() => saveAs(false)}>
              Unpublish
            </Button>
          )}
          {dbEntry && (
            <Button size="sm" variant="ghost" disabled={isBusy} onClick={() => setIsConfirmingDelete(true)}>
              Delete
            </Button>
          )}
        </div>
        <p className={styles.message} role="status">
          {message}
        </p>
      </div>

      <aside className={styles.toolsPanel}>
        <ToolPalette tool={tool} onToolChange={setTool} color={color} onColorChange={setColor} dir={dir} onDirChange={setDir} />
        <p className={styles.hint}>
          Tip: build the solved puzzle first, then press <strong>Scramble</strong>. The solver sets par automatically. Shadow
          crystals ({TILE.SHADE}) make great traps next to mirrors.
        </p>
      </aside>

      {isConfirmingDelete && (
        <Dialog title={`Delete ${draft.id}?`} onClose={() => setIsConfirmingDelete(false)}>
          <p className={styles.dialogText}>This removes it from the database. Built-in levels with the same ID will show again.</p>
          <div className={styles.actionsRow}>
            <Button variant="secondary" onClick={() => setIsConfirmingDelete(false)} data-autofocus>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsConfirmingDelete(false);
                run(() => deleteLevel(draft.id), `Deleted ${draft.id}.`);
              }}
            >
              Delete
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
