import Lumi from '../../components/game/Lumi.jsx';
import styles from './Stall.module.css';

const STRIPES = 8;

/** The striped awning and the counter where Lumi keeps shop. Decorative except for Lumi's line. */
export default function StallFront({ lumiMood, lumiLine }) {
  const width = 100 / STRIPES;
  return (
    <div className={styles.front}>
      <svg className={styles.awning} viewBox="0 0 100 18" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {Array.from({ length: STRIPES }, (_, i) => (
          <path
            key={i}
            className={i % 2 ? styles.stripeLight : styles.stripeDark}
            d={`M${i * width} 0h${width}v12a${width / 2} 5 0 0 1-${width} 0z`}
          />
        ))}
      </svg>
      <div className={styles.counter}>
        <Lumi mood={lumiMood} size={100} line={lumiLine} />
      </div>
    </div>
  );
}
