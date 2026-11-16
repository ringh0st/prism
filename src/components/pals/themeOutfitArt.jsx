/*
 * The weekly theme collections' outfit pieces, drawn on a Pal (like Accessory in PalArt.jsx):
 * hats sit at `hat` (the top of the head), neck pieces at `neck`, gear in the right hand (x≈80).
 */
export function ThemeOutfit({ id, hat, neck }) {
  const [hx, hy] = hat;
  switch (id) {
    // ---------- Elven Woods ----------
    case 'leafCrown':
      return (
        <g>
          {[-18, -9, 0, 9, 18].map((dx) => (
            <path
              key={dx}
              d="M0 0c-4-5-3-11 0-14 3 3 4 9 0 14z"
              transform={`translate(${hx + dx} ${hy + 4 + Math.abs(dx) * 0.2}) rotate(${dx * 2.2})`}
              fill={dx % 18 === 0 ? '#58ac82' : '#7fc49b'}
            />
          ))}
          <path d={`M${hx - 20} ${hy + 6}q20 6 40 0`} stroke="#a8734a" strokeWidth="2.5" fill="none" />
        </g>
      );
    case 'moonCirclet':
      return (
        <g>
          <path d={`M${hx - 19} ${hy + 8}q19-8 38 0`} stroke="#d8dde0" strokeWidth="3" fill="none" />
          <path d={`M${hx} ${hy - 2}a6 6 0 1 0 4 10 5 5 0 1 1-4-10z`} fill="#fff1c2" />
          <circle cx={hx} cy={hy + 6} r="2" fill="#4fbfad" />
        </g>
      );
    case 'woodStaff':
      return (
        <g transform={`translate(80 ${neck + 2}) rotate(10)`}>
          <circle cx="0" cy="-38" r="9" fill="#bdeee4" opacity=".55" />
          <path d="M0 18V-30" stroke="#8a5a36" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M0-30c-5-2-6-7-3-10M0-30c5-2 6-7 3-10" stroke="#8a5a36" strokeWidth="2.5" fill="none" />
          <path d="M0-46l5 7-5 7-5-7z" fill="#4fbfad" />
        </g>
      );
    // ---------- Autumn Harvest ----------
    case 'pumpkinHat':
      return (
        <g transform={`translate(${hx} ${hy + 4})`}>
          <ellipse cx="0" cy="-6" rx="17" ry="12" fill="#e98a4e" />
          <path d="M-6-17c-2 6-2 16 0 22M6-17c2 6 2 16 0 22" stroke="#c96f38" strokeWidth="2" fill="none" />
          <path d="M0-17v-6" stroke="#6b8a3a" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M1-21c5-4 9-2 10 1-4 2-7 1-10-1z" fill="#7dbb72" />
        </g>
      );
    case 'strawHat':
      return (
        <g transform={`translate(${hx} ${hy + 5})`}>
          <ellipse cx="0" cy="1" rx="26" ry="6" fill="#e9c97a" />
          <path d="M-13 1c0-12 5-17 13-17s13 5 13 17z" fill="#f0d68e" />
          <path d="M-13-3h26" stroke="#df7458" strokeWidth="3.5" />
          <path d="M8-6c3-4 7-4 9-1-3 2-6 2-9 1z" fill="#df7458" />
        </g>
      );
    case 'leafScarf':
      return (
        <g>
          <path d={`M30 ${neck - 4}q20 10 40 0l-2 9q-18 8-36 0z`} fill="#df9078" />
          <path d={`M60 ${neck + 2}l8 14-10-2z`} fill="#c97a52" />
          {[36, 50, 62].map((x) => (
            <path key={x} d={`M${x} ${neck + 1}c-2-3-1-6 1-7 2 1 3 4 1 7z`} fill="#f0c14e" />
          ))}
        </g>
      );
    case 'appleBasket':
      return (
        <g transform={`translate(80 ${neck + 8})`}>
          <path d="M-11-6c0-12 22-12 22 0" stroke="#a8734a" strokeWidth="2.5" fill="none" />
          <circle cx="-5" cy="-6" r="5" fill="#df7458" />
          <circle cx="5" cy="-7" r="5" fill="#e98a4e" />
          <path d="M-12-4h24l-3 13h-18z" fill="#c98b55" />
          <path d="M-11 1h22M-10 5h20" stroke="#a8734a" strokeWidth="1.5" />
        </g>
      );
    // ---------- Winter Wonderland ----------
    case 'earmuffs':
      return (
        <g>
          <path
            d={`M${hx - 24} ${hy + 22}Q${hx} ${hy - 10} ${hx + 24} ${hy + 22}`}
            stroke="#df7458"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={hx - 25} cy={hy + 24} r="8" fill="#fffaf2" />
          <circle cx={hx + 25} cy={hy + 24} r="8" fill="#fffaf2" />
          <circle cx={hx - 25} cy={hy + 24} r="4" fill="#f6c3b2" />
          <circle cx={hx + 25} cy={hy + 24} r="4" fill="#f6c3b2" />
        </g>
      );
    case 'iceCrown':
      return (
        <g transform={`translate(${hx} ${hy + 2})`}>
          <path d="M-16 4-14-10l6 6 4-12 4 12 4-12 4 12 6-6 2 14z" fill="#cfeef0" />
          <path d="M-16 4h32v4h-32z" fill="#9fd6d8" />
          <circle cx="0" cy="-2" r="2.5" fill="#fffaf2" />
        </g>
      );
    case 'snowScarf':
      return (
        <g>
          <path d={`M30 ${neck - 4}q20 10 40 0l-2 9q-18 8-36 0z`} fill="#7cc8b5" />
          <path d={`M60 ${neck + 2}l8 14-10-2z`} fill="#58ac82" />
          {[38, 50, 62].map((x) => (
            <path key={x} d={`M${x - 3} ${neck + 2}h6M${x} ${neck - 1}v6`} stroke="#fffaf2" strokeWidth="1.6" strokeLinecap="round" />
          ))}
        </g>
      );
    case 'snowGlobe':
      return (
        <g transform={`translate(80 ${neck + 4})`}>
          <circle cx="0" cy="-6" r="11" fill="#dff3f4" opacity=".9" />
          <path d="M-5-2c0-4 2-6 5-6s5 2 5 6z" fill="#fffaf2" />
          <circle cx="0" cy="-10" r="2.5" fill="#fffaf2" />
          {[
            [-6, -12],
            [5, -14],
            [3, -4],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1" fill="#fff" />
          ))}
          <rect x="-9" y="4" width="18" height="5" rx="2" fill="#a8734a" />
        </g>
      );
    // ---------- Pirate Cove ----------
    case 'bandana':
      return (
        <g transform={`translate(${hx} ${hy + 8})`}>
          <path d="M-20 4c0-14 9-20 20-20s20 6 20 20z" fill="#df7458" />
          {[
            [-10, -4],
            [2, -10],
            [10, 0],
            [-2, 2],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.8" fill="#fffaf2" />
          ))}
          <path d="M18 2l9 4-7 4z" fill="#c4583f" />
        </g>
      );
    case 'captainHat':
      return (
        <g transform={`translate(${hx} ${hy + 4})`}>
          <path d="M-26 2c6-14 16-18 26-18s20 4 26 18c-8-4-16-5-26-5s-18 1-26 5z" fill="#4a3e36" />
          <path d="M-22-1c8-3 14-4 22-4s14 1 22 4" stroke="#f0c14e" strokeWidth="2" fill="none" />
          <circle cx="0" cy="-8" r="3.5" fill="#fffaf2" />
          <path d="M-3-4l6 3M3-4l-6 3" stroke="#fffaf2" strokeWidth="1.5" />
        </g>
      );
    case 'captainCoat':
      return (
        <g>
          <path d={`M30 ${neck - 3}l20 10 20-10-2 12-18 8-18-8z`} fill="#c4583f" />
          <path d={`M50 ${neck + 7}v14`} stroke="#f0c14e" strokeWidth="2" />
          <circle cx="50" cy={neck + 11} r="2" fill="#f0c14e" />
          <circle cx="50" cy={neck + 17} r="2" fill="#f0c14e" />
          <path d={`M30 ${neck - 3}l20 10 20-10`} stroke="#f0c14e" strokeWidth="2.5" fill="none" />
        </g>
      );
    case 'spyglass':
      return (
        <g transform={`translate(80 ${neck}) rotate(-35)`}>
          <rect x="-4" y="-4" width="10" height="8" rx="2" fill="#a8734a" />
          <rect x="5" y="-5" width="10" height="10" rx="2" fill="#c99a2e" />
          <rect x="14" y="-6" width="9" height="12" rx="2" fill="#a8734a" />
          <ellipse cx="23" cy="0" rx="2" ry="5" fill="#bdeee4" />
        </g>
      );
    default:
      return null;
  }
}
