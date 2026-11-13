import TileArt from '../../components/board/TileArt.jsx';
import GemShape from '../../components/GemShape.jsx';
import { BEAM_COLORS, BEAM_COLOR_NAMES, DIRECTION_NAMES, TILE } from '../../game/constants.js';
import styles from './Admin.module.css';

export const TOOLS = [
  { id: 'cycle', label: 'Rotate / change', hint: 'Turn mirrors, point sources, recolor gems' },
  { id: TILE.MIRROR, label: 'Mirror' },
  { id: TILE.SPLITTER, label: 'Splitter' },
  { id: TILE.EMITTER, label: 'Light source' },
  { id: TILE.GEM, label: 'Gem' },
  { id: TILE.FILTER, label: 'Color filter' },
  { id: TILE.WALL, label: 'Wall' },
  { id: TILE.SHADE, label: 'Shadow crystal' },
  { id: 'lock', label: 'Lock / unlock', hint: 'Locked mirrors can’t be rotated by players' },
  { id: 'erase', label: 'Eraser' },
];

const PREVIEW = {
  [TILE.MIRROR]: { type: TILE.MIRROR, orient: 0 },
  [TILE.SPLITTER]: { type: TILE.SPLITTER, orient: 0 },
  [TILE.EMITTER]: { type: TILE.EMITTER, dir: 'right', color: 'sun' },
  [TILE.GEM]: { type: TILE.GEM, color: 'sun' },
  [TILE.FILTER]: { type: TILE.FILTER, color: 'coral' },
  [TILE.WALL]: { type: TILE.WALL },
  [TILE.SHADE]: { type: TILE.SHADE },
};

const TEXT_ICON = { cycle: '↻', lock: '🔒', erase: '⌫' };

export default function ToolPalette({ tool, onToolChange, color, onColorChange, dir, onDirChange }) {
  const needsColor = [TILE.EMITTER, TILE.GEM, TILE.FILTER].includes(tool);
  const colorChoices = tool === TILE.FILTER ? BEAM_COLOR_NAMES.filter((c) => c !== 'sun') : BEAM_COLOR_NAMES;
  return (
    <div className={styles.palette}>
      <fieldset className={styles.fieldset}>
        <legend>Tool</legend>
        <div className={styles.toolGrid}>
          {TOOLS.map((t) => (
            <label key={t.id} className={`${styles.tool} ${tool === t.id ? styles.toolActive : ''}`} title={t.hint ?? t.label}>
              <input type="radio" name="tool" value={t.id} checked={tool === t.id} onChange={() => onToolChange(t.id)} className="visually-hidden" />
              <span className={styles.toolIcon} aria-hidden="true">
                {PREVIEW[t.id] ? <TileArt tile={PREVIEW[t.id]} isRotatable={t.id !== TILE.EMITTER} /> : TEXT_ICON[t.id]}
              </span>
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {needsColor && (
        <fieldset className={styles.fieldset}>
          <legend>Color</legend>
          <div className={styles.optionRow}>
            {colorChoices.map((c) => (
              <label key={c} className={`${styles.option} ${color === c ? styles.optionActive : ''}`}>
                <input type="radio" name="color" value={c} checked={color === c} onChange={() => onColorChange(c)} className="visually-hidden" />
                <GemShape color={c} size={20} />
                <span>{BEAM_COLORS[c].label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {tool === TILE.EMITTER && (
        <fieldset className={styles.fieldset}>
          <legend>Direction</legend>
          <div className={styles.optionRow}>
            {DIRECTION_NAMES.map((d) => (
              <label key={d} className={`${styles.option} ${dir === d ? styles.optionActive : ''}`}>
                <input type="radio" name="dir" value={d} checked={dir === d} onChange={() => onDirChange(d)} className="visually-hidden" />
                <span aria-hidden="true">{{ up: '↑', right: '→', down: '↓', left: '←' }[d]}</span>
                <span>{d}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
