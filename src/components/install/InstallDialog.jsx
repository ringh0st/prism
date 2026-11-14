import Dialog from '../Dialog.jsx';
import Button from '../Button.jsx';
import Icon from '../Icon.jsx';
import LumiSays from '../game/LumiSays.jsx';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './Install.module.css';

const PERKS = [
  ['phone', 'ui.install.perkApp'],
  ['flame', 'ui.install.perkStreak'],
  ['check', 'ui.install.perkOffline'],
];

/** "Tap *Share* in…" with the *starred* button names in bold. */
const withBold = (text) => text.split('*').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));

/** One step of the Safari or browser-menu instructions, with the icon to look for. */
function Step({ number, icon, children }) {
  return (
    <li className={styles.step}>
      <span className={`game-title ${styles.number}`}>{number}</span>
      <span className={styles.stepText}>{children}</span>
      <span className={styles.stepIcon}>
        <Icon name={icon} size={22} />
      </span>
    </li>
  );
}

/**
 * How to put Lumipals on the Home Screen: a real Install button where the browser offers one,
 * otherwise the Share → Add to Home Screen steps (iPhone, iPad) or the browser-menu steps.
 */
export default function InstallDialog({ method, onInstall, onLater, onClose }) {
  const { t } = useI18n();
  const install = async () => {
    const accepted = await onInstall();
    if (accepted) sfx.reward();
    onClose();
  };

  return (
    <Dialog title={t('ui.install.title')} tone="celebrate" onClose={onClose}>
      <div className={styles.lumi}>
        <LumiSays mood="excited" size={76} line={t('ui.install.lumi')} />
      </div>
      <ul className={styles.perks}>
        {PERKS.map(([icon, key]) => (
          <li key={key}>
            <span className={styles.perkIcon} aria-hidden="true">
              <Icon name={icon} size={22} />
            </span>
            {t(key)}
          </li>
        ))}
      </ul>

      {method === 'prompt' && (
        <Button size="lg" icon="phone" onClick={install} data-autofocus>
          {t('ui.install.button')}
        </Button>
      )}
      {method === 'ios' && (
        <ol className={styles.steps}>
          <Step number={1} icon="share">
            {withBold(t('ui.install.ios1'))}
          </Step>
          <Step number={2} icon="addSquare">
            {withBold(t('ui.install.ios2'))}
          </Step>
          <Step number={3} icon="check">
            {withBold(t('ui.install.ios3'))}
          </Step>
        </ol>
      )}
      {method === 'menu' && (
        <ol className={styles.steps}>
          <Step number={1} icon="dots">
            {withBold(t('ui.install.menu1'))}
          </Step>
          <Step number={2} icon="addSquare">
            {withBold(t('ui.install.menu2'))}
          </Step>
        </ol>
      )}

      <div className={styles.actions}>
        {method !== 'prompt' && (
          <Button onClick={onClose} data-autofocus>
            {t('ui.install.gotIt')}
          </Button>
        )}
        {onLater && (
          <Button variant="secondary" onClick={onLater}>
            {t('ui.notNow')}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
