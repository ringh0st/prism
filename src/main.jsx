import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
// Hebrew: Rubik is clearer than Fredoka's Hebrew (its ך and ג were misread). Only the Hebrew letters load.
import '@fontsource/rubik/hebrew-400.css';
import '@fontsource/rubik/hebrew-500.css';
import '@fontsource/rubik/hebrew-700.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App.jsx';
import { startAutoUpdate } from './lib/autoUpdate.js';
import { isNativeApp } from './lib/platform.js';
import { listenForInstallPrompt } from './lib/installApp.js';
import { applyCheckoutReturn } from './lib/checkoutReturn.js';
import { setPreviewTheme } from './game/boardThemes.js';

// Catch the browser's install offer early, for the Home Screen helper.
listenForInstallPrompt();
// Back from a payment page: open the store's thank-you screen.
// The owner's switch to see one place on every level: add ?theme=forest (or pond, castle…) to the address.
setPreviewTheme(new URLSearchParams(window.location.search).get('theme'));
applyCheckoutReturn();

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
