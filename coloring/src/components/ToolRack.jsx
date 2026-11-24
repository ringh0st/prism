import { SIZES } from '../sketches.js';
import { STAMPS, palStampUrl, shapeOf } from '../stamps.js';

const SIZE_NAMES = ['thin', 'medium', 'thick'];

/**
 * The tools beside the crayon box, as pictures: three crayon thicknesses (a dot each) and one more tool, either
 * the fill (a paint pot: tap a part to fill it, on big-book pages) or the stamps (on the blank sheet).
 */
export function ToolRack({ tool, other, onTool }) {
  return (
    <div className="tool-rack" role="radiogroup" aria-label="Tools">
      <button
        className={`tool ${tool.kind === other ? 'on' : ''}`}
        role="radio"
        aria-checked={tool.kind === other}
        onClick={() => onTool({ ...tool, kind: other })}
        aria-label={other === 'fill' ? 'Fill: tap a part' : 'Stamps'}
      >
        {other === 'fill' ? <PaintPot /> : <StarPicture />}
      </button>
      {SIZES.map((_, size) => (
        <button
          key={size}
          className={`tool size ${tool.kind === 'draw' && tool.size === size ? 'on' : ''}`}
          role="radio"
          aria-checked={tool.kind === 'draw' && tool.size === size}
          onClick={() => onTool({ ...tool, kind: 'draw', size })}
          aria-label={`Crayon, ${SIZE_NAMES[size]}`}
        >
          <span className="size-dot" style={{ '--dot': `${6 + size * 6}px` }} />
        </button>
      ))}
    </div>
  );
}

function PaintPot() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 18h28l-3 22a4 4 0 0 1-4 3.5H17a4 4 0 0 1-4-3.5z" fill="#f5923e" stroke="#4a3426" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="24" cy="18" rx="14" ry="4.5" fill="#f7cf3d" stroke="#4a3426" strokeWidth="2.5" />
      <path d="M33 19c2 4 0 7-1 10" stroke="#f7cf3d" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M16 6c3 2 3 6 0 8" stroke="#4a3426" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function StarPicture() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d={shapeOf('star')} fill="#f4c443" stroke="#d99a1e" strokeWidth="5" strokeLinejoin="round" />
    </svg>
  );
}

export function StampRow({ tool, color, onTool }) {
  return (
    <div className="stamp-row" role="radiogroup" aria-label="Stamps">
      {STAMPS.map((name) => (
        <button
          key={name}
          className={`stamp ${tool.stamp === name ? 'on' : ''}`}
          role="radio"
          aria-checked={tool.stamp === name}
          aria-label={name}
          onClick={() => onTool({ ...tool, kind: 'stamp', stamp: name })}
        >
          {shapeOf(name) ? (
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d={shapeOf(name)} fill={color} stroke="rgba(74,52,38,.35)" strokeWidth="3" />
            </svg>
          ) : (
            <img src={palStampUrl(name)} alt="" />
          )}
        </button>
      ))}
    </div>
  );
}
