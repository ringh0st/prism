import { useState } from 'react';
import Button from '../../components/Button.jsx';
import WelcomeTour from '../welcome/WelcomeTour.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './HowToPlayCard.module.css';

/** "How to play" on the Me screen: opens the picture tour (tiny boards that play themselves). */
export default function HowToPlayCard({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();
  return (
    <section className={`${className} ${styles.card}`} aria-labelledby="how-to-play-title">
      <h2 id="how-to-play-title">{t('howTo.title')}</h2>
      <p className={styles.hint}>{t('howTo.text')}</p>
      <Button variant="secondary" icon="play" onClick={() => setIsOpen(true)}>
        {t('howTo.show')}
      </Button>
      {isOpen && <WelcomeTour onDone={() => setIsOpen(false)} />}
    </section>
  );
}
