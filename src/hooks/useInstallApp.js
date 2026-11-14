import { useEffect, useState } from 'react';
import { canPromptInstall, installMethod, isInstalled, onInstallChange, promptInstall } from '../lib/installApp.js';
import { shouldSuggestInstall } from '../game/installNudge.js';

const STORAGE_KEY = 'prism.installNudge.v1';

const readNudge = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
};

/**
 * Everything the Home Screen helper needs: whether to show it, how this device installs, and
 * actions to install or say "Not now".
 */
export function useInstallApp(solvedCount = 0) {
  const [canPrompt, setCanPrompt] = useState(canPromptInstall);
  const [nudge, setNudge] = useState(readNudge);
  const installed = isInstalled();

  useEffect(() => onInstallChange(() => setCanPrompt(canPromptInstall())), []);

  const dismiss = () => {
    const next = { dismissedAt: Date.now(), timesDismissed: (nudge.timesDismissed ?? 0) + 1 };
    setNudge(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode: it may ask again next time.
    }
  };

  return {
    isInstalled: installed,
    shouldSuggest: !installed && shouldSuggestInstall({ solvedCount, ...nudge }),
    method: canPrompt ? 'prompt' : installMethod(navigator.userAgent, navigator.maxTouchPoints),
    install: promptInstall,
    dismiss,
  };
}
