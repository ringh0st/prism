import ember from '../../assets/pals/ember.webp';
import coral from '../../assets/pals/coral.webp';
import mossy from '../../assets/pals/mossy.webp';
import aurora from '../../assets/pals/aurora.webp';

/*
 * Pals shown as finished illustrations (the new kawaii style) instead of drawn shapes. Each picture sits on the
 * stage's floor line (y≈94), as tall as fits. `ratio` is width/height and `neck` the neck's height as a share of
 * the picture's height from the top. `head` is measured on the 100×100 stage: the head's center line `x`, the top
 * of the head between the ears `top`, and half its width `half` (where ear items sit). `chest` is the center line
 * of the body, for scarves and capes. The drawn outfit pieces were made for a head about 52 wide, topped at its center.
 */
export const PAL_PICTURES = {
  ember: { src: ember, ratio: 0.801, neck: 0.64, head: { x: 54, top: 23, half: 25 }, chest: 55 },
  coral: { src: coral, ratio: 1.086, neck: 0.61, head: { x: 50, top: 12, half: 28 }, chest: 50 },
  mossy: { src: mossy, ratio: 0.644, neck: 0.61, head: { x: 48.5, top: 21, half: 26 }, chest: 48.5 },
  aurora: { src: aurora, ratio: 0.815, neck: 0.63, head: { x: 52, top: 21, half: 29 }, chest: 48 },
};

const FLOOR = 94;
const MAX_HEIGHT = 88;
const MAX_WIDTH = 92;
// Ear items (headphones, earmuffs) arc over the head from this far above the hat point, cups at half-width 26.
const EAR_ARC_LIFT = 11;
const EAR_HALF = 26;

/**
 * Where a picture goes on the 100×100 stage, and where its outfit sits: `hat` (just under the top of the head),
 * `ears` (the anchor and sideways stretch for headphones and earmuffs), `neck` and `chest`.
 */
export function picturePlacement({ ratio, neck, head, chest }) {
  const height = Math.min(MAX_HEIGHT, MAX_WIDTH / ratio);
  const width = height * ratio;
  const y = FLOOR - height;
  return {
    x: 50 - width / 2,
    y,
    width,
    height,
    hat: [head.x, head.top + 1],
    ears: { at: [head.x, head.top + 1 - EAR_ARC_LIFT], stretch: head.half / EAR_HALF },
    neck: y + neck * height,
    chest,
  };
}
