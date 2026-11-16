import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import PalPowerBadge from '../../components/pals/PalPowerBadge.jsx';
import { palPower } from '../../game/palPowers.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PalGuide.module.css';

/** A small "then" arrow between pictures (the play icon flips in Hebrew, and so does the row). */
const then = <Icon name="play" size={14} className={styles.then} />;

/**
 * How Pals work, as one picture loop with a few words per step (playtesters loved the Pals but didn't know what
 * they were for): win levels → your Pal grows; the bigger it grows, the stronger its power; every 10 ★ it brings a
 * present; more Pals join as you play, and you pick who plays with you. Drawn with your own partner.
 */
export default function PalGuide({ pal, onClose }) {
  const { t } = useI18n();
  const steps = [
    {
      key: 'grow',
      picture: (
        <>
          <Icon name="play" size={22} className={styles.icon} />
          {then}
          {[0, 2, 4].map((stage) => (
            <PalArt key={stage} palId={pal.id} stage={stage} size={26 + stage * 3} portrait />
          ))}
        </>
      ),
    },
    {
      key: 'power',
      picture: (
        <>
          <PalPowerBadge power={palPower(pal, 0)} size="sm" />
          {then}
          <PalPowerBadge power={palPower(pal, 4)} />
        </>
      ),
    },
    {
      key: 'gift',
      picture: (
        <>
          <span className={`game-title ${styles.stars}`}>10 ★</span>
          {then}
          <Icon name="gift" size={30} className={styles.icon} />
        </>
      ),
    },
    {
      key: 'more',
      picture: (
        <>
          <Icon name="lock" size={20} className={styles.icon} />
          {then}
          <Icon name="paw" size={26} className={styles.icon} />
        </>
      ),
    },
  ];
  return (
    <Dialog title={t('palGuide.title')} onClose={onClose}>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.key} className={styles.step}>
            <span className={styles.picture} aria-hidden="true">
              {step.picture}
            </span>
            <span className={styles.words}>{t(`palGuide.${step.key}`)}</span>
          </li>
        ))}
      </ol>
      <Button size="lg" onClick={onClose} data-autofocus>
        {t('palGuide.done')}
      </Button>
    </Dialog>
  );
}
