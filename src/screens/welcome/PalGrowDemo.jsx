import { useEffect, useState } from 'react';
import PalArt from '../../components/pals/PalArt.jsx';
import { palStage } from '../../game/pals.js';
import styles from './WelcomeTour.module.css';

/** A Pal growing through its five forms, over and over. */
export default function PalGrowDemo({ palId = 'ember' }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStage((current) => (current + 1) % 5), 1100);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className={styles.palDemo} aria-hidden="true">
      <PalArt palId={palId} stage={stage} size={150} alive key={stage} className={styles.palPop} />
      <span className={`game-title ${styles.stageName}`}>{palStage(stage).name}</span>
    </div>
  );
}
