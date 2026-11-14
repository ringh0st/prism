import { memo } from 'react';
import { beamColorVar } from '../GemShape.jsx';
import styles from './Board.module.css';

/**
 * The Lens helper's preview of the solved light path, drawn over the tiles so it shows on every cell:
 * a dark-edged, beam-colored dashed trail that marches the way the light travels. Coordinates are in cell units.
 */
function LensPath({ width, height, segments }) {
  const lines = segments.map((segment) => ({ x1: segment.x1 + 0.5, y1: segment.y1 + 0.5, x2: segment.x2 + 0.5, y2: segment.y2 + 0.5 }));
  return (
    <svg className={styles.lens} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {lines.map((points, i) => (
        <line key={`edge-${i}`} className={styles.lensEdge} {...points} />
      ))}
      {lines.map((points, i) => (
        <line key={`core-${i}`} className={styles.lensCore} {...points} style={{ stroke: beamColorVar(segments[i].color) }} />
      ))}
    </svg>
  );
}

export default memo(LensPath);
