import { PAL_FORM_SIZES } from './palFormSizes.js';

const FORM_FILES = import.meta.glob('../../assets/pals/forms/*.webp', { eager: true, import: 'default' });
const SINGLE_FILES = import.meta.glob('../../assets/pals/*.webp', { eager: true, import: 'default' });
// A Pal whose other forms aren't drawn yet uses its one picture for every form.
const srcOf = (palId, form) => FORM_FILES[`../../assets/pals/forms/${palId}-${form}.webp`] ?? SINGLE_FILES[`../../assets/pals/${palId}.webp`];

/*
 * One canvas and one baseline for every Pal and form (the usual rule for character collections): each picture
 * stands on the floor, centered on its head, and is sized by its filled area, not its outline, so wings, tails
 * and long necks don't shrink the Pal. Each form grows a little; a Pal too wide or tall for the stage is fitted.
 */
const FLOOR = 94;
const MAX_WIDTH = 98;
const MAX_HEIGHT = 90;
// Every Pal gets the same visual weight: its filled area on the stage, growing a little with each form.
const MASTER_AREA = 3400;
const FORM_GROWTH = [0.78, 0.85, 0.91, 0.96, 1];
// Outfit pieces are drawn for a reference head: centered at x=50, topped at y=25, half as wide as 27, with the
// neck at y=70 (capes hang 27 below it, held things 14) and things held at x=80.
const REF = { x: 50, top: 25, half: 27, neck: 70, hand: 80, capeDrop: 27, handDrop: 14 };
// From the eye spacing to the chin, and the least room between the top of the head and the eyes.
const CHIN_PER_EYE_GAP = 0.82;
const EYES_BELOW_TOP = 1.0;

/** Does this Pal have its five forms drawn as pictures? */
export const hasFormPictures = (palId) => Boolean(PAL_FORM_SIZES[palId]);

/**
 * Where form `index` (0 = Baby … 4 = Master) of a picture Pal goes on the 100×100 stage. `head` is its head on the
 * stage (for portraits); `outfit` holds the transforms that carry the reference head onto this form's head, neck and paw.
 */
export function formPlacement(palId, index) {
  const [w, h, headX, top, eyes, gap, half, area] = PAL_FORM_SIZES[palId][index];
  const wanted = (Math.sqrt(MASTER_AREA) * FORM_GROWTH[index]) / Math.sqrt(area);
  const scale = Math.min(wanted, MAX_WIDTH / w, MAX_HEIGHT / h);
  const width = w * scale;
  const height = h * scale;
  // centered on the head, but kept on the stage
  const x = Math.min(Math.max(50 - headX * scale, 50 - MAX_WIDTH / 2), 50 + MAX_WIDTH / 2 - width);
  const y = FLOOR - height;
  // a hat's brim always clears the eyes, even on Pals whose eyes sit at the very top of the head (a frog's)
  const hatTop = Math.min(top, eyes - EYES_BELOW_TOP * gap);
  const head = { x: x + headX * scale, top: y + hatTop * scale, half: half * scale };
  const neck = y + (eyes + CHIN_PER_EYE_GAP * gap) * scale;
  const fit = head.half / REF.half;
  // Neck pieces hang down from the neck (a cape the furthest), and held things a little: keep them off the floor,
  // shrinking them by a quarter at most.
  const offFloor = (drop) => Math.min(fit, Math.max((FLOOR + 3 - neck) / drop, 0.75 * fit));
  const around = (toX, toY, fromX, fromY, k = fit) => `translate(${toX} ${toY}) scale(${k}) translate(${-fromX} ${-fromY})`;
  return {
    src: srcOf(palId, index + 1),
    x,
    y,
    width,
    height,
    head,
    outfit: {
      head: around(head.x, head.top, REF.x, REF.top),
      neck: around(head.x, neck, REF.x, REF.neck, offFloor(REF.capeDrop)),
      hand: around(head.x + (REF.hand - REF.x) * fit, neck, REF.hand, REF.neck, offFloor(REF.handDrop)),
      hat: [REF.x, REF.top + 1],
      neckY: REF.neck,
    },
  };
}

/** A square around the face, for round portraits: every Pal's face fills its avatar the same way. */
export function formPortraitBox({ head }) {
  const side = head.half * 4.6;
  return `${head.x - side / 2} ${head.top - head.half * 0.55} ${side} ${side}`;
}
