import { useState } from 'react';
import Button from '../Button.jsx';
import InstallDialog from './InstallDialog.jsx';
import { useInstallApp } from '../../hooks/useInstallApp.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './Install.module.css';

/** Settings: the always-available way to add Lumipals to the Home Screen (hidden once installed). */
export default function InstallSettingsCard({ className }) {
  const app = useInstallApp();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  if (app.isInstalled) return null;
  return (
    <section className={`${className} ${styles.card}`} aria-labelledby="install-title">
      <h2 id="install-title">{t('ui.install.cardTitle')}</h2>
      <Button variant="secondary" icon="phone" onClick={() => setIsOpen(true)}>
        {t('ui.install.cardButton')}
      </Button>
      {isOpen && <InstallDialog method={app.method} onInstall={app.install} onClose={() => setIsOpen(false)} />}
    </section>
  );
}
