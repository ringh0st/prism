/** The pictures on the walls' signs (and on the way back to them): a crayon scribble for drawings, a Pal for colored pictures. */
export function DrawingsSign() {
  return (
    <svg viewBox="0 0 48 48" className="sign-icon" aria-hidden="true">
      <rect x="6" y="6" width="36" height="36" rx="4" fill="#fffdf7" stroke="#c4704c" strokeWidth="3" />
      <path d="M12 31c5-10 9 4 13-4s7 3 11-3" fill="none" stroke="#5bb7ea" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="31" cy="16" r="4.5" fill="#f4c443" />
    </svg>
  );
}

export function PalsSign() {
  return (
    <svg viewBox="0 0 48 48" className="sign-icon" aria-hidden="true">
      <rect x="6" y="6" width="36" height="36" rx="4" fill="#fffdf7" stroke="#c4704c" strokeWidth="3" />
      <ellipse cx="15" cy="21" rx="5" ry="7" fill="#9a6440" />
      <ellipse cx="33" cy="21" rx="5" ry="7" fill="#9a6440" />
      <circle cx="24" cy="25" r="10" fill="#f5923e" />
      <circle cx="20.5" cy="24" r="1.8" fill="#4a3426" />
      <circle cx="27.5" cy="24" r="1.8" fill="#4a3426" />
      <ellipse cx="24" cy="29" rx="3.2" ry="2.2" fill="#fff3c4" />
    </svg>
  );
}
