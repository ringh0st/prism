import { RAINBOW } from '../book.js';

/** Paper confetti in the crayon colors, falling once over a finished page. */
export default function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 26 }, (_, i) => (
        <i
          key={i}
          style={{
            '--x': `${(i * 37) % 100}%`,
            '--delay': `${(i % 7) * 0.09}s`,
            '--spin': `${(i % 2 ? 1 : -1) * (200 + ((i * 53) % 300))}deg`,
            '--drift': `${((i * 29) % 60) - 30}px`,
            background: RAINBOW[i % RAINBOW.length],
            borderRadius: i % 3 === 0 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}
