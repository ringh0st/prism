import ember from '../../assets/pals/ember.webp';
import coral from '../../assets/pals/coral.webp';
import mossy from '../../assets/pals/mossy.webp';
import aurora from '../../assets/pals/aurora.webp';

/*
 * Pals shown as finished illustrations (the new kawaii style) instead of drawn shapes. Each picture sits on the
 * stage's floor line (y≈94), as tall as fits. `ratio` is width/height; `head` and `neck` say, as a share of the
 * picture's height from the top, where the top of the head and the neck are, so hats and scarves sit right.
 */
export const PAL_PICTURES = {
  ember: { src: ember, ratio: 0.801, head: 0.11, neck: 0.64 },
  coral: { src: coral, ratio: 1.086, head: 0.06, neck: 0.61 },
  mossy: { src: mossy, ratio: 0.644, head: 0.17, neck: 0.61 },
  aurora: { src: aurora, ratio: 0.815, head: 0.18, neck: 0.63 },
};

const FLOOR = 94;
const MAX_HEIGHT = 88;
const MAX_WIDTH = 92;

/** Where a picture goes on the 100×100 stage, and where its hat and scarf sit. */
export function picturePlacement({ ratio, head, neck }) {
  const height = Math.min(MAX_HEIGHT, MAX_WIDTH / ratio);
  const width = height * ratio;
  const y = FLOOR - height;
  return { x: 50 - width / 2, y, width, height, hat: [50, y + head * height + 4], neck: y + neck * height };
}
