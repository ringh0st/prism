import { isNativeApp } from './platform.js';

/*
 * Installing the website as an app on the Home Screen. Chrome and Edge (Android, desktop) offer a
 * real install prompt, which we catch early and keep for when the player taps Install; Safari on iPhone
 * and iPad has no prompt, so we show the Share → Add to Home Screen steps instead.
 */
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

/** Call once at startup, before the browser fires its install event. */
export function listenForInstallPrompt() {
  if (typeof window === 'undefined' || isNativeApp) return;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export const onInstallChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const canPromptInstall = () => deferredPrompt !== null;

/** Shows the browser's own install prompt. Resolves to true if the player installed. */
export async function promptInstall() {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  notify();
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome === 'accepted';
}

/** Already running from the Home Screen (or inside the app)? */
export function isInstalled() {
  if (isNativeApp) return true;
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

/** How this device adds apps: 'ios' (Share → Add to Home Screen), or 'menu' (the browser menu). */
export function installMethod(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent, maxTouchPoints = 0) {
  const isIPad = /Macintosh/.test(userAgent) && maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(userAgent) || isIPad ? 'ios' : 'menu';
}
