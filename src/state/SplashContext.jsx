import { createContext, useContext } from 'react';

/** True while the opening splash covers the game, so pop-ups can wait for it. */
export const SplashContext = createContext(false);

export const useIsSplashShowing = () => useContext(SplashContext);
