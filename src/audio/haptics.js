// Vibration by importance. Android uses the Vibration API; iPhone Safari has none, but iOS 18+
// gives a light haptic tick when a native switch toggles, so we toggle a hidden one instead.

const PATTERNS = {
  light: { android: 8, ticks: 1 },
  medium: { android: 18, ticks: 1 },
  soft: { android: 35, ticks: 1 },
  double: { android: [10, 60, 10], ticks: 2 },
  success: { android: [12, 40, 12, 40, 24], ticks: 3 },
  celebrate: { android: [15, 30, 15, 30, 15, 30, 60], ticks: 5 },
};

const TICK_GAP_MS = 80;

let iosSwitchLabel = null;

const isIos = () =>
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** One iOS haptic tick: clicking the label of a hidden `<input switch>` makes the system tap. */
function iosTick() {
  if (!iosSwitchLabel) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.id = 'lumipals-haptic-switch';
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    input.style.display = 'none';
    iosSwitchLabel = document.createElement('label');
    iosSwitchLabel.htmlFor = input.id;
    iosSwitchLabel.setAttribute('aria-hidden', 'true');
    iosSwitchLabel.style.display = 'none';
    document.body.append(input, iosSwitchLabel);
  }
  iosSwitchLabel.click();
}

/** strength: light | medium | soft | double | success | celebrate */
export function haptic(strength) {
  const pattern = PATTERNS[strength];
  if (!pattern || typeof navigator === 'undefined') return;
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern.android);
    } else if (isIos()) {
      for (let i = 0; i < pattern.ticks; i++) setTimeout(iosTick, i * TICK_GAP_MS);
    }
  } catch {
    // Haptics are a nice extra; never let them break the game.
  }
}
