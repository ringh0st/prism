import { createContext, useContext, useEffect, useMemo } from 'react';
import { usePlayer } from '../state/PlayerContext.jsx';
import { detectLanguage, directionOf, pickLine, translate } from './translate.js';

const I18nContext = createContext(null);

/**
 * The player's language (Settings, else the device's): gives `t(key, params, fallback)`, `line(key, lines)`
 * for Lumi's quips, and sets the page's lang and reading direction (Hebrew reads right to left).
 */
export function I18nProvider({ children }) {
  const { settings } = usePlayer();
  const lang = settings.language ?? detectLanguage();
  const dir = directionOf(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const value = useMemo(
    () => ({
      lang,
      dir,
      t: (key, params, fallback) => translate(lang, key, params, fallback),
      line: (key, fallbackLines) => pickLine(lang, key, fallbackLines),
    }),
    [lang, dir],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>');
  return context;
}
