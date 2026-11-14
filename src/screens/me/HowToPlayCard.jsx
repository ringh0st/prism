import { useState } from 'react';
import Button from '../../components/Button.jsx';
import WelcomeTour from '../welcome/WelcomeTour.jsx';
import styles from './HowToPlayCard.module.css';

/** "How to play" on the Me screen: opens the picture tour (tiny boards that play themselves). */
export default function HowToPlayCard({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <section className={`${className} ${styles.card}`} aria-labelledby="how-to-play-title">
      <h2 id="how-to-play-title">How to play</h2>
      <p className={styles.hint}>Four quick pictures: turn mirrors, light every gem, earn stars.</p>
      <Button variant="secondary" icon="play" onClick={() => setIsOpen(true)}>
        Show me
      </Button>
      {isOpen && <WelcomeTour onDone={() => setIsOpen(false)} />}
    </section>
  );
}
