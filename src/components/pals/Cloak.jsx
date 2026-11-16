/*
 * Capes and cloaks, worn in two parts so they read on every Pal and form: the cloth hangs behind the Pal and
 * flares out past its sides to the floor (`part="back"`), and a collar with two lapels and a clasp sits over
 * the shoulders in front (`part="front"`). Drawn on the shared stage (neck y≈70, floor y≈94).
 */
const CLOAKS = {
  cape: { cloth: '#df7458', lining: '#f2a67e', edge: '#b05a40', clasp: 'round' },
  elvenCloak: { cloth: '#4f9a72', lining: '#7fc49b', edge: '#3a7a57', clasp: 'leaf' },
};

export const isCloak = (id) => id in CLOAKS;

export default function Cloak({ id, part, neck }) {
  const { cloth, lining, edge, clasp } = CLOAKS[id];
  if (part === 'back') {
    return (
      <g>
        <path
          d={`M32 ${neck - 10}C18 ${neck - 4} 12 ${neck + 12} 9 93q10.5 4 21 0 10.5 4 20.5 0 10.5 4 20.5 0 10.5 4 21 0C88 ${neck + 12} 82 ${neck - 4} 68 ${neck - 10}z`}
          fill={cloth}
          stroke={edge}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d={`M22 ${neck + 2}C16 ${neck + 10} 13 ${neck + 18} 12 89M78 ${neck + 2}C84 ${neck + 10} 87 ${neck + 18} 88 89`}
          stroke={lining}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity=".8"
        />
      </g>
    );
  }
  return (
    <g strokeLinejoin="round">
      <path d={`M29 ${neck - 6}q21 9 42 0l-2 7q-4 8-9 13l-4-9q-6 3-12 0l-4 9q-5-5-9-13z`} fill={cloth} stroke={edge} strokeWidth="1.5" />
      <path d={`M33 ${neck - 3}q17 7 34 0`} stroke={lining} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {clasp === 'leaf' ? (
        <path d={`M50 ${neck + 5}c-4-3-4-8 0-11 4 3 4 8 0 11z`} fill="#f0c14e" stroke="#c99a2e" strokeWidth="1" />
      ) : (
        <circle cx="50" cy={neck + 1} r="3.4" fill="#f0c14e" stroke="#c99a2e" strokeWidth="1" />
      )}
    </g>
  );
}
