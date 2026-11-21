import { useState } from 'react';
import Icon from '../Icon.jsx';
import InstallDialog from './InstallDialog.jsx';
import { useInstallApp } from '../../hooks/useInstallApp.js';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { solvedLevelCount } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './Install.module.css';

/**
 * On the map's top bar after a few levels: a little phone that suggests adding Lumipals to the Home
 * Screen. "Not now" hides it for a week; it stops asking after three times.
 */
export default function InstallButton() {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const app = useInstallApp(solvedLevelCount(progress.levels));
  const [isOpen, setIsOpen] = useState(false);
  if (!app.shouldSuggest && !isOpen) return null;

  const later = () => {
    app.dismiss();
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          sfx.tap();
          setIsOpen(true);
        }}
        aria-label={t('ui.install.open')}
      >
        <Icon name="phone" size={24} strokeWidth={2.4} />
        <span className={styles.plus} aria-hidden="true">
          <Icon name="plus" size={12} strokeWidth={3.4} />
        </span>
        <span className={styles.caption} aria-hidden="true">
          {t('map.extra.install')}
        </span>
      </button>
      {isOpen && <InstallDialog method={app.method} onInstall={app.install} onLater={later} onClose={() => setIsOpen(false)} />}
    </>
  );
}
