import { usePlayer } from '../state/PlayerContext.jsx';
import { supportsWebGL } from '../lib/webgl.js';

/**
 * Is the board drawn as a themed 3D room? Only when the player switched it on in Settings (the flat board is the
 * default) and the device can draw 3D. The themed board also swaps gems for Lumi's family (words and icons), so screens ask this too.
 */
export function useThemedBoard() {
  const { settings } = usePlayer();
  return settings.themedBoard === true && supportsWebGL();
}
