import Dialog from '../Dialog.jsx';
import Button from '../Button.jsx';
import Icon from '../Icon.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PictureGuide.module.css';

/** A small "then" arrow between pictures (the play icon flips in Hebrew, and so does the row). */
export const Then = () => <Icon name="play" size={14} className={styles.then} />;

/** A plain icon inside a guide picture. */
export const GuideIcon = ({ name, size = 24 }) => <Icon name={name} size={size} className={styles.icon} />;

/** A short label (like "10 ★") inside a guide picture. */
export const GuideLabel = ({ children }) => <span className={`game-title ${styles.label}`}>{children}</span>;

/**
 * "How it works" as a short picture loop: one row per step, the picture first and a few words beside it, then
 * "Got it!". Used for the Pals and the Glowbugs, so each idea reads at a glance.
 * @param steps [{ key, picture, text }]
 */
export default function PictureGuide({ title, steps, onClose }) {
  const { t } = useI18n();
  return (
    <Dialog title={title} onClose={onClose}>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.key} className={styles.step}>
            <span className={styles.picture} aria-hidden="true">
              {step.picture}
            </span>
            <span className={styles.words}>{step.text}</span>
          </li>
        ))}
      </ol>
      <Button size="lg" onClick={onClose} data-autofocus>
        {t('guide.done')}
      </Button>
    </Dialog>
  );
}
