/** The gold star sticker a finished page gets (also on the contents page). */
export default function Sticker({ isNew = false, small = false }) {
  return (
    <span className={`sticker ${isNew ? 'new' : ''} ${small ? 'small' : ''}`} role="img" aria-label="Finished">
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <path
          d="M30 4l7.6 15.4 17 2.5-12.3 12 2.9 16.9L30 42.8l-15.2 8 2.9-16.9-12.3-12 17-2.5z"
          fill="#fff"
          stroke="#fff"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <path
          d="M30 4l7.6 15.4 17 2.5-12.3 12 2.9 16.9L30 42.8l-15.2 8 2.9-16.9-12.3-12 17-2.5z"
          fill="#f4c443"
          stroke="#d99a1e"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M22 22c3-2 6-2.5 9-2" stroke="#fff6cf" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="25" cy="31" r="2" fill="#5a3a1c" />
        <circle cx="35" cy="31" r="2" fill="#5a3a1c" />
        <path d="M26.5 36c2 1.8 5 1.8 7 0" stroke="#5a3a1c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}
