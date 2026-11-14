import { useEffect, useState } from 'react';
import Stars from '../../components/Stars.jsx';
import styles from './WelcomeTour.module.css';

/** Taps counting up (1, 2, 3), then three stars popping in: fewer taps, more stars. */
export default function StarsDemo() {
  const [taps, setTaps] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTaps((current) => (current + 1) % 5), 800);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className={styles.starsDemo} aria-hidden="true">
      <div className={styles.taps}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={`${styles.tap} ${taps >= n ? styles.tapOn : ''}`}>
            {n}
          </span>
        ))}
      </div>
      <div className={styles.starsRow}>{taps >= 4 && <Stars count={3} size={52} animate />}</div>
    </div>
  );
}
