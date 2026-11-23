/** The wire coils down the book's left edge; the cover and every page turn around them. */
export default function Spiral() {
  return (
    <div className="spiral" aria-hidden="true">
      {Array.from({ length: 13 }, (_, i) => (
        <span key={i} className="coil" />
      ))}
    </div>
  );
}
