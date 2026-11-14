/*
 * Little animals that live in each world's landscape behind the level (inline SVG, flat "Sunlit Paper"
 * shapes). Each faces right with its feet on the bottom edge of its box; `move` says how it gets around.
 * Parts with a `data-part` (legs, wings, tails) get their own small motion in BackdropCreature.module.css.
 */
const EYE = '#2b2118';

export const CREATURES = {
  camel: {
    width: 46,
    height: 38,
    move: 'walk',
    art: (
      <>
        <g data-part="legBack" fill="#c98f58">
          <rect x="11" y="24" width="3" height="14" rx="1.5" />
          <rect x="29" y="24" width="3" height="14" rx="1.5" />
        </g>
        <g data-part="legFront" fill="#d9a066">
          <rect x="15" y="24" width="3" height="14" rx="1.5" />
          <rect x="33" y="24" width="3" height="14" rx="1.5" />
        </g>
        <path d="M8 26c0-7 4-11 8-11 3 0 4 3 6 3s3-6 7-6c5 0 8 6 8 12v3H8z" fill="#d9a066" />
        <path d="M35 22c2-3 3-9 5-11 2-1 5 0 6 2l-1 2h-3c-1 3-2 7-4 9z" fill="#d9a066" />
        <circle cx="42.5" cy="12" r="0.9" fill={EYE} />
        <path d="M8 22c-2 1-3 4-2 7" stroke="#c98f58" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M22 15c2-1 4-1 5 1" stroke="#f2a67e" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  lizard: {
    width: 34,
    height: 12,
    move: 'dart',
    art: (
      <>
        <path data-part="tail" d="M10 8C6 8 3 6 0 7c3 2 6 3 10 3z" fill="#a9b56c" />
        <g fill="#93a05a">
          <path d="M12 9l-3 3M14 9l2 3M22 9l-2 3M24 9l3 3" stroke="#93a05a" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <ellipse cx="18" cy="8" rx="9" ry="3.2" fill="#a9b56c" />
        <ellipse cx="28" cy="7.5" rx="5" ry="2.8" fill="#a9b56c" />
        <circle cx="30" cy="6.6" r="0.9" fill={EYE} />
        <path d="M14 7h2M18 6.4h2M22 7h2" stroke="#f0c14e" strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
  tumbleweed: {
    width: 22,
    height: 22,
    move: 'roll',
    art: (
      <g data-part="spin" fill="none" stroke="#bf935f" strokeWidth="1.4" strokeLinecap="round">
        <circle cx="11" cy="11" r="9.5" />
        <path d="M3 8c5 1 10 6 12 12M5 16c3-5 9-10 15-9M8 3c1 6 0 12-4 15M14 2c-2 5-1 12 4 16M2 12c6-2 13-1 18 3" />
      </g>
    ),
  },
  hawk: {
    width: 30,
    height: 12,
    move: 'soar',
    art: (
      <>
        <path data-part="wings" d="M0 5q8-6 15 1q7-7 15-1q-8 0-15 6q-7-6-15-6z" fill="#8a6748" />
        <ellipse cx="15" cy="6.5" rx="2" ry="3.4" fill="#6f5139" />
      </>
    ),
  },
  fennec: {
    width: 26,
    height: 24,
    move: 'peek',
    art: (
      <>
        <path d="M3 2l7 9-6 2zM23 2l-7 9 6 2z" fill="#e8b27a" />
        <path d="M5 5l4 6-3 1zM21 5l-4 6 3 1z" fill="#f6d9c0" />
        <ellipse cx="13" cy="17" rx="9" ry="8" fill="#e8b27a" />
        <ellipse cx="13" cy="20" rx="5" ry="4" fill="#fbecd9" />
        <circle cx="9.6" cy="15.5" r="1.2" fill={EYE} />
        <circle cx="16.4" cy="15.5" r="1.2" fill={EYE} />
        <circle cx="13" cy="18.6" r="1.1" fill={EYE} />
      </>
    ),
  },
  bunny: {
    width: 22,
    height: 22,
    move: 'hop',
    art: (
      <>
        <ellipse cx="14" cy="5" rx="2.2" ry="5" fill="#f4ece0" transform="rotate(12 14 5)" />
        <ellipse cx="17.5" cy="5.5" rx="2.2" ry="5" fill="#f4ece0" transform="rotate(28 17.5 5.5)" />
        <ellipse cx="10" cy="15.5" rx="8" ry="6.5" fill="#f4ece0" />
        <circle cx="16.5" cy="11.5" r="4.5" fill="#f4ece0" />
        <circle cx="2.8" cy="14" r="2.4" fill="#fffaf2" />
        <circle cx="18" cy="10.8" r="0.9" fill={EYE} />
        <circle cx="20.6" cy="12.6" r="0.8" fill="#e8a39a" />
      </>
    ),
  },
  bird: {
    width: 18,
    height: 12,
    move: 'fly',
    art: (
      <>
        <ellipse cx="9" cy="7" rx="5.5" ry="3.6" fill="#e59a62" />
        <circle cx="14" cy="5.4" r="2.8" fill="#e59a62" />
        <path d="M16.6 5.2l2 .8-2 .8z" fill="#f0c14e" />
        <circle cx="14.8" cy="4.8" r="0.7" fill={EYE} />
        <path data-part="wings" d="M6 6q2-7 7-5-2 3-4 6z" fill="#d48550" />
      </>
    ),
  },
  butterfly: {
    width: 14,
    height: 12,
    move: 'flutter',
    art: (
      <>
        <g data-part="flap">
          <ellipse cx="4" cy="4" rx="4" ry="3.6" fill="#f2a67e" />
          <ellipse cx="10" cy="4" rx="4" ry="3.6" fill="#f2a67e" />
          <ellipse cx="4.6" cy="8.6" rx="2.8" ry="2.4" fill="#f0c14e" />
          <ellipse cx="9.4" cy="8.6" rx="2.8" ry="2.4" fill="#f0c14e" />
        </g>
        <rect x="6.3" y="2" width="1.4" height="9" rx="0.7" fill="#5e5047" />
      </>
    ),
  },
  snail: {
    width: 22,
    height: 14,
    move: 'crawl',
    art: (
      <>
        <path d="M2 14c0-2 2-3 5-3h12c1-3 1-6 3-7-1 4 0 8-2 10z" fill="#e2cfa6" />
        <circle cx="10" cy="7.5" r="6" fill="#e3a574" />
        <path d="M10 7.5m-3 0a3 3 0 1 0 3-3" stroke="#c9814a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M20 5l1-4M21.6 5.4l2-3.4" stroke="#e2cfa6" strokeWidth="1" strokeLinecap="round" />
      </>
    ),
  },
  squirrel: {
    width: 24,
    height: 22,
    move: 'hop',
    art: (
      <>
        <path data-part="tail" d="M8 16C1 16 0 8 3 4s9-2 8 4c-1 4-4 4-4 8z" fill="#d38c55" />
        <ellipse cx="13" cy="16" rx="6" ry="5.5" fill="#c9814a" />
        <circle cx="18.5" cy="10.5" r="4.2" fill="#c9814a" />
        <path d="M17 6.5l1.5-3 1.5 3.4z" fill="#c9814a" />
        <ellipse cx="14" cy="17.5" rx="3" ry="3" fill="#f2d3b0" />
        <circle cx="20" cy="10" r="0.9" fill={EYE} />
      </>
    ),
  },
  hedgehog: {
    width: 24,
    height: 14,
    move: 'crawl',
    art: (
      <>
        <path d="M2 14c0-7 4-11 10-11 5 0 8 3 9 6l-2 5z" fill="#9a7552" />
        <path d="M4 7l-2-2 3 0M7 4l-1-3 3 2M11 3l1-3 1 3M15 4l2-2 0 3" fill="#9a7552" stroke="#9a7552" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M14 14c0-4 3-6 6-5s4 3 4 5z" fill="#ead2b0" />
        <circle cx="19.5" cy="10.6" r="0.8" fill={EYE} />
        <circle cx="23.6" cy="12.6" r="1" fill={EYE} />
      </>
    ),
  },
  frog: {
    width: 20,
    height: 15,
    move: 'hop',
    art: (
      <>
        <ellipse cx="10" cy="10" rx="8" ry="5" fill="#7dbb72" />
        <circle cx="7" cy="5" r="3" fill="#7dbb72" />
        <circle cx="13" cy="5" r="3" fill="#7dbb72" />
        <circle cx="7" cy="4.6" r="1.4" fill="#fffaf2" />
        <circle cx="13" cy="4.6" r="1.4" fill="#fffaf2" />
        <circle cx="7.3" cy="4.8" r="0.7" fill={EYE} />
        <circle cx="13.3" cy="4.8" r="0.7" fill={EYE} />
        <path d="M7 10.5q3 2 6 0" stroke="#4f8a4a" strokeWidth="1" fill="none" strokeLinecap="round" />
        <ellipse cx="3" cy="14" rx="3" ry="1.2" fill="#6aa862" />
        <ellipse cx="17" cy="14" rx="3" ry="1.2" fill="#6aa862" />
      </>
    ),
  },
  duck: {
    width: 22,
    height: 16,
    move: 'paddle',
    art: (
      <>
        <path d="M1 9c0 4 4 7 10 7s9-2 10-6c-3 1-6 1-8-1z" fill="#fffaf2" />
        <path d="M2 9c2-1 4-1 6 0" stroke="#ead9bd" strokeWidth="1.2" fill="none" />
        <circle cx="15" cy="5.5" r="4" fill="#fffaf2" />
        <path d="M18.6 5.4l3.4 1-3.4 1.4z" fill="#f2a67e" />
        <circle cx="16.2" cy="4.6" r="0.8" fill={EYE} />
      </>
    ),
  },
  dragonfly: {
    width: 22,
    height: 10,
    move: 'flutter',
    art: (
      <>
        <g data-part="flap" fill="#cfe8df" opacity="0.85">
          <ellipse cx="9" cy="2.6" rx="5" ry="1.8" transform="rotate(-12 9 2.6)" />
          <ellipse cx="13" cy="2.6" rx="5" ry="1.8" transform="rotate(12 13 2.6)" />
        </g>
        <rect x="1" y="4.4" width="15" height="1.8" rx="0.9" fill="#4fbfad" />
        <circle cx="17.5" cy="5.2" r="2.2" fill="#3a9d8e" />
      </>
    ),
  },
  cat: {
    width: 28,
    height: 20,
    move: 'walk',
    art: (
      <>
        <path data-part="tail" d="M4 11C1 9 1 4 3 2" stroke="#7a6556" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <g data-part="legBack" fill="#6a5647">
          <rect x="6" y="13" width="2.6" height="7" rx="1.3" />
          <rect x="17" y="13" width="2.6" height="7" rx="1.3" />
        </g>
        <g data-part="legFront" fill="#7a6556">
          <rect x="9" y="13" width="2.6" height="7" rx="1.3" />
          <rect x="20" y="13" width="2.6" height="7" rx="1.3" />
        </g>
        <ellipse cx="14" cy="12" rx="10" ry="4.6" fill="#7a6556" />
        <circle cx="23.5" cy="8" r="4.2" fill="#7a6556" />
        <path d="M20.5 5.5l.8-4 2.6 3zM24.5 4.5l2-3.4 1 4z" fill="#7a6556" />
        <circle cx="25" cy="7.6" r="0.8" fill="#f0c14e" />
      </>
    ),
  },
  chicken: {
    width: 18,
    height: 18,
    move: 'peck',
    art: (
      <>
        <path d="M2 9c0-4 3-6 6-6l2 6c3 0 6 0 6 3 0 4-4 6-8 6S2 15 2 9z" fill="#fffaf2" />
        <circle cx="12" cy="6" r="3.6" fill="#fffaf2" />
        <path d="M10.6 2.6c0-1.4 1-2.2 2-1.6 1-.6 2 .4 1.4 1.8z" fill="#df7458" />
        <path d="M15.4 6l2.4.8-2.4.9z" fill="#f0c14e" />
        <circle cx="13" cy="5.4" r="0.7" fill={EYE} />
        <path d="M7 15v3M10 15v3" stroke="#f0c14e" strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
  goat: {
    width: 26,
    height: 24,
    move: 'hop',
    art: (
      <>
        <g fill="#d8cbb8">
          <rect x="5" y="15" width="2.6" height="9" rx="1.3" />
          <rect x="16" y="15" width="2.6" height="9" rx="1.3" />
        </g>
        <ellipse cx="12" cy="14" rx="9" ry="5.5" fill="#f4ece0" />
        <path d="M18 12c0-4 2-6 5-6 2 0 3 2 2 4l-3 4z" fill="#f4ece0" />
        <path d="M21 6c-1-3 1-5 4-5-2 1-2 3-1 5z" fill="#a8734a" />
        <path d="M23 13l1 3-2-1z" fill="#d8cbb8" />
        <circle cx="23" cy="8.6" r="0.8" fill={EYE} />
      </>
    ),
  },
};

/** Which animals live in each kind of world (by world theme), matching its landscape. */
export const BIOME_CREATURES = {
  sunshine: ['bunny', 'bird', 'snail', 'butterfly'],
  tangerine: ['squirrel', 'hedgehog', 'bird'],
  coral: ['camel', 'lizard', 'tumbleweed', 'hawk', 'fennec'],
  mint: ['frog', 'duck', 'dragonfly'],
  ember: ['cat', 'chicken', 'butterfly'],
  lime: ['frog', 'snail', 'butterfly', 'bird'],
  peach: ['bunny', 'butterfly', 'bird'],
  gold: ['goat', 'hawk', 'bird'],
};
