import { CRAYONS } from '../book.js';

/**
 * The crayon box: two rows of crayons standing in a cardboard box, the one in hand lifted out. Big enough for
 * small fingers; the colors are the only labels (names are there for screen readers).
 */
export default function CrayonBox({ crayonId, onPick }) {
  const rows = [CRAYONS.slice(0, 8), CRAYONS.slice(8)];
  return (
    <div className="crayon-box" role="radiogroup" aria-label="Crayons">
      <div className="box-inside" aria-hidden="true" />
      {rows.map((row, r) => (
        <div key={r} className={`crayon-row ${r === 0 ? 'back' : 'front'}`}>
          {row.map((crayon) => (
            <Crayon key={crayon.id} crayon={crayon} isOn={crayon.id === crayonId} onPick={() => onPick(crayon.id)} />
          ))}
        </div>
      ))}
      <div className="box-front" aria-hidden="true">
        <svg viewBox="0 0 40 40">
          <path d="M20 6l4 8.2 9 1.3-6.5 6.4 1.5 9L20 26.7l-8 4.2 1.5-9L7 15.5l9-1.3z" fill="#fff6dc" opacity=".85" />
        </svg>
      </div>
    </div>
  );
}

function Crayon({ crayon, isOn, onPick }) {
  const isRainbow = crayon.id === 'rainbow';
  const isWhite = crayon.id === 'white';
  const fill = isRainbow ? `url(#rainbow-wrap)` : crayon.color;
  return (
    <button className={`crayon ${isOn ? 'on' : ''}`} role="radio" aria-checked={isOn} aria-label={crayon.name} onClick={onPick}>
      <svg viewBox="0 0 30 120" aria-hidden="true">
        {isRainbow && (
          <defs>
            <linearGradient id="rainbow-wrap" x1="0" y1="0" x2="0" y2="1">
              {['#e8524f', '#f5923e', '#f7cf3d', '#a5d046', '#2fb3a6', '#3f6fd8', '#9466d4'].map((c, i, all) => (
                <stop key={c} offset={i / (all.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
        )}
        <path d="M8 30 15 4 22 30Z" fill={isRainbow ? '#f284b5' : crayon.color} stroke={isWhite ? '#d8cbb4' : 'none'} />
        <path d="M13 9 15 4 17 9Z" fill={isWhite ? '#e8ddc8' : '#000'} opacity=".18" />
        <rect x="6" y="28" width="18" height="92" rx="3" fill={fill} stroke={isWhite ? '#d8cbb4' : 'none'} />
        <rect x="6" y="40" width="18" height="70" fill="#000" opacity={isWhite ? 0.05 : 0.14} />
        <path d="M6 46h18M6 104h18" stroke="#fff" strokeOpacity=".7" strokeWidth="2.5" />
        <path d="M9 30v88" stroke="#fff" strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
