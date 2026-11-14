// Inline SVG icon set. Decorative by default; pass `label` to make an icon meaningful to screen readers.
const PATHS = {
  back: <path d="M15 5 8 12l7 7" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2" />
      <circle cx="12" cy="12" r="7" />
    </>
  ),
  restart: (
    <>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v4.5h4.5" />
    </>
  ),
  hint: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  sound: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  lens: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
      <path d="M7.5 9a3.5 3.5 0 0 1 3-2.5" />
    </>
  ),
  wand: (
    <>
      <path d="m4 20 11-11" />
      <path d="m13 7 4 4" />
      <path d="M17 3v3M15.5 4.5h3M20 8v2M19 9h2" />
    </>
  ),
  skip: (
    <>
      <path d="M5 5.5v13l9-6.5z" />
      <path d="M18 5v14" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 12.5H6z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  map: (
    <>
      <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  pause: (
    <>
      <path d="M9 5v14M15 5v14" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  share: (
    <>
      <path d="M12 3v12" />
      <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
      <path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  addSquare: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  dots: (
    <>
      <circle cx="12" cy="5.5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="18.5" r="1" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.6c0 5.4-7.5 10-7.5 10Z" />,
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11.5" rx="2" />
      <path d="M2.5 9h19v-1.5A1.5 1.5 0 0 0 20 6H4a1.5 1.5 0 0 0-1.5 1.5zM12 6v14.5" />
      <path d="M12 6c-1.5-3.5-6-3.5-5.5-.5.3 1.5 3 1 5.5.5zM12 6c1.5-3.5 6-3.5 5.5-.5-.3 1.5-3 1-5.5.5z" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  shirt: <path d="M8 3.5 3 6.5l2 4 2-1V20.5h10V9.5l2 1 2-4-5-3c-.5 1.6-2 2.7-4 2.7S8.5 5.1 8 3.5z" />,
  shield: <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.8 3.9M17 6h2.5a2.5 2.5 0 0 1-2.8 3.9" />
      <path d="M12 14v3.5M8.5 21h7M9.5 17.5h5V21h-5z" />
    </>
  ),
};

const FILLED = {
  paw: (
    <>
      <ellipse cx="12" cy="16" rx="5" ry="4.2" />
      <circle cx="5.5" cy="10.5" r="2.3" />
      <circle cx="9.2" cy="6.4" r="2.3" />
      <circle cx="14.8" cy="6.4" r="2.3" />
      <circle cx="18.5" cy="10.5" r="2.3" />
    </>
  ),
  star: <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4l-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z" />,
  bolt: <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z" />,
  spark: <path d="M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z" />,
  flame: <path d="M12.5 2c.6 3.2-1.4 5-3 6.8C8 10.5 7 12.2 7 14.5a5 5 0 0 0 10 0c0-1.8-.8-3.2-1.6-4.2-.2 1.3-.9 2.2-1.9 2.6.6-3.6-.2-7.6-1-10.9z" />,
  crown: <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />,
  chest: (
    <>
      <path d="M3 10.5C3 6.4 6.4 4 12 4s9 2.4 9 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19z" />
      <path d="M3 10.5h18" stroke="rgba(0,0,0,.35)" strokeWidth="1.6" fill="none" />
      <rect x="10" y="9" width="4" height="5" rx="1" fill="#fff6c9" />
    </>
  ),
  diamond: (
    <>
      <path d="M6.5 3.5h11l4 5.5L12 21 2.5 9z" />
      <path d="M2.5 9h19M9 3.5 7.5 9 12 21l4.5-12L15 3.5" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.2" />
    </>
  ),
};

export default function Icon({ name, size = 20, label, className, strokeWidth = 2.2 }) {
  const isFilled = name in FILLED;
  const shape = isFilled ? FILLED[name] : PATHS[name];
  return (
    <svg
      className={className}
      data-icon={name}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke={isFilled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {shape}
    </svg>
  );
}
