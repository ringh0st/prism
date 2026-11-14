import { memo } from 'react';
import { beamColorVar } from '../GemShape.jsx';
import styles from './Board.module.css';

/** Glowing light beams drawn under the tiles. Coordinates are in cell units. */
function BeamLayer({ width, height, segments }) {
  return (
    <svg className={styles.beams} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="beam-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.12" />
        </filter>
      </defs>
      {segments.map((segment, i) => {
        const points = {
          x1: segment.x1 + 0.5,
          y1: segment.y1 + 0.5,
          x2: segment.x2 + 0.5,
          y2: segment.y2 + 0.5,
        };
        const color = beamColorVar(segment.color);
        return (
          <g key={i}>
            {/* A thin warm-dark edge keeps pale beams visible on light cells */}
            <line {...points} stroke="var(--beam-edge)" strokeWidth="0.21" strokeLinecap="round" />
            <line {...points} stroke={color} strokeWidth="0.32" strokeLinecap="round" filter="url(#beam-glow)" opacity="0.6" />
            <line {...points} stroke={color} strokeWidth="0.15" strokeLinecap="round" />
            <line {...points} className={styles.beamCore} strokeWidth="0.05" strokeLinecap="round" />
            {/* Motes of light drifting along the beam */}
            <circle className={styles.sparkle} r="0.07" fill="#fff">
              <animateMotion
                dur={`${0.5 + Math.hypot(points.x2 - points.x1, points.y2 - points.y1) * 0.35}s`}
                begin={`${(i * 0.23) % 1}s`}
                repeatCount="indefinite"
                path={`M${points.x1} ${points.y1}L${points.x2} ${points.y2}`}
              />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

export default memo(BeamLayer);
