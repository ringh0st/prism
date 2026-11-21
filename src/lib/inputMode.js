/*
 * Who is steering: a keyboard or a finger/mouse? The focus ring is for keyboard players. A phone also draws it when
 * a screen puts the focus on its main button by itself (the "Let's go!" card), where it looks like a red frame
 * around the button (owner's screenshot). So the page remembers the last kind of input, and the ring shows only
 * after a key was pressed (global.css).
 */
export function watchInputMode(root = document.documentElement) {
  const set = (mode) => {
    if (root.dataset.input !== mode) root.dataset.input = mode;
  };
  set('pointer');
  window.addEventListener('keydown', (event) => !event.metaKey && !event.ctrlKey && !event.altKey && set('keyboard'), true);
  window.addEventListener('pointerdown', () => set('pointer'), true);
}
