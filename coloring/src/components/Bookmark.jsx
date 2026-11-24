/**
 * A ribbon bookmark hanging over the top of the book. On a Pal's page it hangs long, with a picture of many
 * little pictures, and a tap riffles back to "My friends", so nobody has to turn back page by page to see every
 * friend (owner's ask). On "My friends" itself it is only a short tail, like a real ribbon tucked in.
 */
export default function Bookmark({ isOut, onClick }) {
  if (!isOut)
    return <span className="bookmark tucked" aria-hidden="true" />;
  return (
    <button className="bookmark" onClick={onClick} aria-label="All my friends" title="All my friends">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {[3, 13].flatMap((x) => [3, 13].map((y) => <rect key={`${x}${y}`} x={x} y={y} width="8" height="8" rx="2" fill="currentColor" />))}
      </svg>
    </button>
  );
}
