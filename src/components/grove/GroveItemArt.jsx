import GroveItemShape from './GroveItemShape.jsx';

/** A piece of Grove decor on its own, for shelves and lists. Decorative. */
export default function GroveItemArt({ id, size = 72, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <GroveItemShape id={id} />
    </svg>
  );
}
