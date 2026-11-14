/* global __BUILD_ID__ */
const CHECK_EVERY_MS = 5 * 60 * 1000;
const isMidLevel = () => /^#\/(play|daily|test)/.test(window.location.hash);

/**
 * Keeps installed and long-open copies of the game up to date. Phones often pause a home-screen app
 * instead of closing it, so the game checks for a newer version whenever it comes back on screen and
 * reloads by itself, waiting until the player isn't in the middle of a level.
 */
const RELOADED_KEY = 'prism.reloadedFor';

export function startAutoUpdate() {
  let isUpdateReady = false;
  let newBuild = null;

  const reloadWhenSafe = () => {
    if (!isUpdateReady || isMidLevel()) return;
    try {
      // Never loop: reload at most once for each published version.
      if (sessionStorage.getItem(RELOADED_KEY) === newBuild) return;
      sessionStorage.setItem(RELOADED_KEY, newBuild);
    } catch {
      // Storage blocked: still fine to reload once.
    }
    window.location.reload();
  };

  const check = async () => {
    if (isUpdateReady) return reloadWhenSafe();
    try {
      const response = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
      const { build } = await response.json();
      if (build && build !== __BUILD_ID__) {
        isUpdateReady = true;
        newBuild = build;
        reloadWhenSafe();
      }
    } catch {
      // Offline: try again next time.
    }
  };

  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
  window.addEventListener('hashchange', reloadWhenSafe);
  setInterval(check, CHECK_EVERY_MS);
  check();
}
