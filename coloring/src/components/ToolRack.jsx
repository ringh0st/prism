import { SIZES } from '../sketches.js';
import { STAMPS, palStampUrl, shapeOf } from '../stamps.js';

/**
 * The tools beside the crayon box on the blank sheet: the crayon (tap again for thin, medium or fat; the dot
 * shows which) and the stamps. With stamps chosen, a row of stamps opens above the crayons: shapes take the
 * crayon's color, the Pals come in their own.
 */
export function ToolRack({ tool, onTool }) {
  const isStamp = tool.kind === 'stamp';
  return (
    <div className="tool-rack">
      <button
        className={`tool ${isStamp ? '' : 'on'}`}
        onClick={() => onTool(isStamp ? { ...tool, kind: 'draw' } : { ...tool, size: (tool.size + 1) % SIZES.length })}
        aria-label={`Crayon, ${['thin', 'medium', 'fat'][tool.size]}`}
      >
        <span className="size-dot" style={{ '--dot': `${8 + tool.size * 7}px` }} />
      </button>
      <button className={`tool ${isStamp ? 'on' : ''}`} onClick={() => onTool({ ...tool, kind: 'stamp' })} aria-label="Stamps">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d={shapeOf('star')} fill="#f4c443" stroke="#d99a1e" strokeWidth="5" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
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
