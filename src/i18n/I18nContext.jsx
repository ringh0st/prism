import { createContext, useContext, useEffect, useMemo } from 'react';
import { usePlayer } from '../state/PlayerContext.jsx';
import { detectLanguage, directionOf, pickLine, translate } from './translate.js';
import { rescueWording } from './rescueWording.js';

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

/**
 * Inside a themed world (Lumi's family as targets): every line below says Lumis instead of gems, and
 * `useIsRescue()` is true so icons show Lumis too.
 */
const RescueContext = createContext(false);

export function RescueWording({ isOn, children }) {
  const parent = useContext(I18nContext);
  const value = useMemo(
    () =>
      isOn
        ? {
            ...parent,
            t: (key, params, fallback) => rescueWording(parent.t(key, params, fallback), parent.lang),
            line: (key, fallbackLines) => rescueWording(parent.line(key, fallbackLines), parent.lang),
          }
        : parent,
    [isOn, parent],
  );
  return (
    <RescueContext.Provider value={isOn}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </RescueContext.Provider>
  );
}

export const useIsRescue = () => useContext(RescueContext);
