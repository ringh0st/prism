import { usePlayer } from '../state/PlayerContext.jsx';
import { supportsWebGL } from '../lib/webgl.js';

/**
 * Is the board drawn as a themed 3D room? Yes unless the player picked the flat board in Settings, or the device
 * can't draw 3D. The themed board also swaps gems for Lumi's family (words and icons), so screens ask this too.
 */
export function useThemedBoard() {
  const { settings } = usePlayer();
  return settings.board3d !== false && supportsWebGL();
}
