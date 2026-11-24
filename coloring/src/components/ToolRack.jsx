import { SIZES } from '../sketches.js';
import { PAL_STAMPS, PICTURE_STAMPS, SHAPE_STAMPS, shapeOf, stickerUrl } from '../stamps.js';

const SIZE_NAMES = ['thin', 'medium', 'thick'];
const OTHER_TOOLS = {
  fill: ['Fill: tap a part', <PaintPot key="fill" />],
  shape: ['Shapes: drag to make one big or small', <ShapesPicture key="shape" />],
  pal: ['Pal stickers: put one down and move it', <img key="pal" src={stickerUrl('waffles')} alt="" />],
  bucket: ['Bucket: fill a shape or the background', <Bucket key="bucket" />],
};

/**
 * The tools beside the crayon box, as pictures: three crayon thicknesses (a dot each), and the other tools of
 * this sheet (`others`): the fill (a paint pot: tap a part to fill it, on big-book pages), or on the blank sheet the
 * shapes (a little house: they stay where they're put), the Pal stickers (a Pal's face: they can be moved) and the
 * bucket (fills a closed shape, or the background).
 */
export function ToolRack({ tool, others, onTool }) {
  return (
    <div className="tool-rack" role="radiogroup" aria-label="Tools">
      <div className="tool-column">
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
      <div className="tool-column">
        {others.map((kind) => (
          <button
            key={kind}
            className={`tool big ${tool.kind === kind ? 'on' : ''}`}
            role="radio"
            aria-checked={tool.kind === kind}
            onClick={() => onTool({ ...tool, kind })}
            aria-label={OTHER_TOOLS[kind][0]}
          >
            {OTHER_TOOLS[kind][1]}
          </button>
        ))}
      </div>
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

function Bucket() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M8 14h26l-3 26a4 4 0 0 1-4 3.5H15a4 4 0 0 1-4-3.5z"
        fill="#5bb7ea"
        stroke="#4a3426"
        strokeWidth="2.5"
        strokeLinejoin="round"
        transform="rotate(-24 21 28)"
      />
      <path d="M30 26c6 2 10 8 10 14a5 5 0 0 1-10 0c0-4 2-6 2-8" fill="#5bb7ea" stroke="#4a3426" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M6 12c4-8 16-10 22-4" fill="none" stroke="#4a3426" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ShapesPicture() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M8 22 24 8l16 14z" fill="#e8524f" stroke="#4a3426" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="11" y="22" width="26" height="20" fill="#f7c39c" stroke="#4a3426" strokeWidth="2.5" />
      <rect x="21" y="29" width="7" height="13" fill="#9a6440" />
    </svg>
  );
}

/**
 * The row above the crayons for the chosen list: the shapes (in the crayon's color) and pictures, or the Pals.
 * `kind` is 'shape' or 'pal'; the chosen one is kept in the tool under that name.
 */
export function StampRow({ tool, kind, color, onTool }) {
  const groups = kind === 'pal' ? [PAL_STAMPS] : [SHAPE_STAMPS, PICTURE_STAMPS];
  return (
    <div className="stamp-row" role="radiogroup" aria-label={kind === 'pal' ? 'Pal stickers' : 'Shapes'}>
      {groups.map((group, g) => (
        <span key={g} className="stamp-group">
          {group.map((name) => (
            <button
              key={name}
              className={`stamp ${tool[kind] === name ? 'on' : ''}`}
              role="radio"
              aria-checked={tool[kind] === name}
              aria-label={name}
              onClick={() => onTool({ ...tool, kind, [kind]: name })}
            >
              {shapeOf(name) ? (
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <path d={shapeOf(name)} fill={color} stroke="rgba(74,52,38,.35)" strokeWidth="3" />
                </svg>
              ) : (
                <img src={stickerUrl(name)} alt="" />
              )}
            </button>
          ))}
        </span>
      ))}
    </div>
  );
}
