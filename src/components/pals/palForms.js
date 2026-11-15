import { PAL_FORM_SIZES } from './palFormSizes.js';

const FILES = import.meta.glob('../../assets/pals/forms/*.webp', { eager: true, import: 'default' });
const srcOf = (palId, form) => FILES[`../../assets/pals/forms/${palId}-${form}.webp`];

const FLOOR = 94;
const MAX_HEIGHT = 88;
const MAX_WIDTH = 100;
// Outfit pieces are drawn for a reference head: centered at x=50, topped at y=25, half as wide as 27,
// with the neck at y=70 (capes hang 27 below it, held things 14) and things held at x=80. Each form maps that head onto its own.
const REF = { x: 50, top: 25, half: 27, neck: 70, hand: 80, capeDrop: 27, handDrop: 14 };
// From the eye spacing to the chin, as measured on the drawn Pals.
const CHIN_PER_EYE_GAP = 0.82;

/** Does this Pal have its five forms drawn as pictures? */
export const hasFormPictures = (palId) => Boolean(PAL_FORM_SIZES[palId]);

/**
 * Where form `index` (0 = Baby … 4 = Master) of a picture Pal goes on the 100×100 stage, standing on the floor.
 * All forms of a Pal share one scale, so each form keeps its drawn size (the Master fills the stage). `outfit`
 * holds the transforms that carry the reference head onto this form's head, neck and paw.
 */
export function formPlacement(palId, index) {
  const forms = PAL_FORM_SIZES[palId];
  const scale = Math.min(...forms.map(([w, h]) => Math.min(MAX_HEIGHT / h, MAX_WIDTH / w)));
  const [w, h, headX, top, eyes, gap, half] = forms[index];
  const width = w * scale;
  const height = h * scale;
  const x = 50 - width / 2;
  const y = FLOOR - height;
  const head = { x: x + headX * scale, top: y + top * scale, half: half * scale };
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
    outfit: {
      head: around(head.x, head.top, REF.x, REF.top),
      neck: around(head.x, neck, REF.x, REF.neck, offFloor(REF.capeDrop)),
      hand: around(head.x + (REF.hand - REF.x) * fit, neck, REF.hand, REF.neck, offFloor(REF.handDrop)),
      hat: [REF.x, REF.top + 1],
      neckY: REF.neck,
    },
  };
}

/** A square around the form, sitting on the floor, for round portraits. */
export function formPortraitBox({ x, width, height }) {
  const side = Math.min(100, Math.max(width, height) + 10);
  const cx = x + width / 2;
  return `${cx - side / 2} ${FLOOR + 3 - side} ${side} ${side}`;
}
