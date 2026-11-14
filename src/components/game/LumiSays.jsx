import Lumi from './Lumi.jsx';
import SpeechBox from './SpeechBox.jsx';
import styles from './LumiSays.module.css';

/** Lumi with what he's saying in a box beside him. */
export default function LumiSays({ mood = 'happy', size = 80, line, className = '' }) {
  return (
    <div className={`${styles.row} ${className}`}>
      <Lumi mood={mood} size={size} />
      <SpeechBox line={line} tail="left" className={styles.box} />
    </div>
  );
}
