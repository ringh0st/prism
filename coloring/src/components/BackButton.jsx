/**
 * The one way back, always at the top left: a picture of where it goes (the book, or the room with the wall),
 * because a 3-year-old knows a picture before a word or an arrow. It glows and bounces when a page is finished,
 * as if saying "pick another one".
 */
export default function BackButton({ to, isBeckoning = false, onClick }) {
  return (
    <button className={`back-btn ${isBeckoning ? 'beckon' : ''}`} onClick={onClick} aria-label={to === 'book' ? 'Back to the book' : 'Back to my wall'}>
      {to === 'book' ? <BookPicture /> : <WallPicture />}
    </button>
  );
}

export function BookPicture() {
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <rect x="14" y="7" width="38" height="47" rx="5" fill="#f2a67e" stroke="#c4704c" strokeWidth="3" />
      <rect x="21" y="14" width="25" height="15" rx="3" fill="#fffaf0" />
      <circle cx="33.5" cy="40" r="7" fill="#f6d5a8" />
      <circle cx="31" cy="39" r="1.4" fill="#4a3426" />
      <circle cx="36" cy="39" r="1.4" fill="#4a3426" />
      {[12, 20, 28, 36, 44].map((y) => (
        <rect key={y} x="8" y={y} width="11" height="4" rx="2" fill="#d9d6cf" stroke="#8d8a83" strokeWidth="1.2" />
      ))}
    </svg>
  );
}

function WallPicture() {
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M8 27 30 9l22 18" fill="none" stroke="#c4704c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="13" y="25" width="34" height="27" rx="3" fill="#fff4df" stroke="#c4704c" strokeWidth="3" />
      <rect x="18" y="30" width="11" height="13" rx="1.5" fill="#fff" stroke="#9a6440" strokeWidth="1.5" transform="rotate(-6 23 36)" />
      <rect x="32" y="31" width="10" height="12" rx="1.5" fill="#fff" stroke="#9a6440" strokeWidth="1.5" transform="rotate(5 37 37)" />
      <circle cx="23" cy="37" r="2.6" fill="#f284b5" />
      <circle cx="37" cy="37" r="2.6" fill="#5bb7ea" />
    </svg>
  );
}
