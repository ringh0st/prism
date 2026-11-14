import { useState } from 'react';
import Button from '../Button.jsx';
import InstallDialog from './InstallDialog.jsx';
import { useInstallApp } from '../../hooks/useInstallApp.js';

/** Settings: the always-available way to add Lumipals to the Home Screen (hidden once installed). */
export default function InstallSettingsCard({ className }) {
  const app = useInstallApp();
  const [isOpen, setIsOpen] = useState(false);
  if (app.isInstalled) return null;
  return (
    <section className={className} aria-labelledby="install-title">
      <h2 id="install-title">Play like an app</h2>
      <p>Add Lumipals to your Home Screen: full screen, one tap away, and it works offline.</p>
      <Button variant="secondary" icon="phone" onClick={() => setIsOpen(true)}>
        Add to Home Screen
      </Button>
      {isOpen && <InstallDialog method={app.method} onInstall={app.install} onClose={() => setIsOpen(false)} />}
    </section>
  );
}
