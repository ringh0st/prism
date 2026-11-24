import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { applyTheme, currentTheme } from './theme.js';

applyTheme(currentTheme());
import { startAutoUpdate } from '../../src/lib/autoUpdate.js';

// A copy opened from the Home Screen updates itself when it comes back on screen (every color is saved).
if (import.meta.env.PROD) startAutoUpdate({ isBusy: () => false, reloadedKey: 'coloring.reloadedFor' });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
