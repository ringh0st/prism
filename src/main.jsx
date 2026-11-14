import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App.jsx';
import { startAutoUpdate } from './lib/autoUpdate.js';
import { isNativeApp } from './lib/platform.js';
import { listenForInstallPrompt } from './lib/installApp.js';

// Catch the browser's install offer early, for the Home Screen helper.
listenForInstallPrompt();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The app ships its own copy of the game (updated through the App Store), so only the website
// checks for new versions and caches itself for offline play.
if (import.meta.env.PROD && !isNativeApp) startAutoUpdate();

if (import.meta.env.PROD && !isNativeApp && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
