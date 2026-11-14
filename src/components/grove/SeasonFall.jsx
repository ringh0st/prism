import styles from './GroveScene.module.css';

/** Where each falling flake, petal or leaf starts (x in the 400-wide scene) and how it falls. */
const DRIFTERS = [
  [24, 0, 9],
  [70, -3, 11],
  [118, -6, 10],
  [160, -1.5, 12],
  [206, -8, 9.5],
  [250, -4.5, 11.5],
  [296, -2, 10.5],
  [338, -7, 12.5],
  [380, -5, 9],
];

const SHAPES = {
  winter: <circle r="2.6" fill="#FFFDF6" />,
  spring: <ellipse rx="3.4" ry="2" fill="#F6C9BC" />,
  autumn: <path d="M0-5c4 2 5 6 0 10-5-4-4-8 0-10z" fill="#E59A62" />,
};

/** Snow in winter, blossom petals in spring and leaves in autumn, drifting down through the Grove. */
export default function SeasonFall({ season }) {
  const shape = SHAPES[season];
  if (!shape) return null;
  return (
    <g className={styles.fall} aria-hidden="true">
      {DRIFTERS.map(([x, delay, seconds], i) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <g className={styles.drifter} style={{ animationDelay: `${delay}s`, animationDuration: `${seconds}s` }}>
            {season === 'autumn' && i % 3 === 1 ? <path d="M0-5c4 2 5 6 0 10-5-4-4-8 0-10z" fill="#F0C14E" /> : shape}
          </g>
        </g>
      ))}
    </g>
  );
}
