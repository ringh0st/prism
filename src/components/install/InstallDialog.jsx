import Dialog from '../Dialog.jsx';
import Button from '../Button.jsx';
import Icon from '../Icon.jsx';
import LumiSays from '../game/LumiSays.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './Install.module.css';

const PERKS = [
  ['phone', 'Opens full screen, just like an app'],
  ['flame', 'One tap to keep your streak going'],
  ['check', 'Plays even without internet'],
];

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
  const install = async () => {
    const accepted = await onInstall();
    if (accepted) sfx.reward();
    onClose();
  };

  return (
    <Dialog title="Get Lumipals on your Home Screen" tone="celebrate" onClose={onClose}>
      <div className={styles.lumi}>
        <LumiSays mood="excited" size={76} line="Keep me on your Home Screen and I’m always one tap away!" />
      </div>
      <ul className={styles.perks}>
        {PERKS.map(([icon, text]) => (
          <li key={text}>
            <Icon name={icon} size={18} /> {text}
          </li>
        ))}
      </ul>

      {method === 'prompt' && (
        <Button size="lg" icon="phone" onClick={install} data-autofocus>
          Install Lumipals
        </Button>
      )}
      {method === 'ios' && (
        <ol className={styles.steps}>
          <Step number={1} icon="share">
            Tap <strong>Share</strong> in Safari’s toolbar
          </Step>
          <Step number={2} icon="addSquare">
            Choose <strong>Add to Home Screen</strong> (scroll down if you don’t see it)
          </Step>
          <Step number={3} icon="check">
            Tap <strong>Add</strong>. That’s it!
          </Step>
        </ol>
      )}
      {method === 'menu' && (
        <ol className={styles.steps}>
          <Step number={1} icon="dots">
            Open your browser’s <strong>menu</strong>
          </Step>
          <Step number={2} icon="addSquare">
            Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>
          </Step>
        </ol>
      )}

      <div className={styles.actions}>
        {method !== 'prompt' && (
          <Button onClick={onClose} data-autofocus>
            Got it
          </Button>
        )}
        {onLater && (
          <Button variant="secondary" onClick={onLater}>
            Not now
          </Button>
        )}
      </div>
    </Dialog>
  );
}
