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
            <line {...points} stroke={color} strokeWidth="0.32" strokeLinecap="round" filter="url(#beam-glow)" opacity="0.75" />
            <line {...points} stroke={color} strokeWidth="0.15" strokeLinecap="round" />
            <line {...points} className={styles.beamCore} strokeWidth="0.05" strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}

export default memo(BeamLayer);
