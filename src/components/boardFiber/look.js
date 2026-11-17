/*
 * The shared look of the R3F board (design guide "Next-Gen puzzle elements"): one palette, one bevel, a few
 * materials and the glow rule. Glowing parts use colors brighter than white (toneMapped off) so the bloom pass
 * picks up only them; everything else stays below the bloom threshold.
 */
import * as THREE from 'three';

export const LOOK = {
  coral: '#f39a55',
  coralDeep: '#e07b3c',
  cream: '#fff6e6',
  butter: '#ffe066',
  gold: '#e8b54a',
  sage: '#6fbf8e',
  sageDeep: '#4f9f72',
  mint: '#bfe6d2',
  glass: '#bfe3ef',
  stone: '#d8c3a5',
  stoneDeep: '#b89c7a',
  shade: '#4a3a32',
};

/**
 * The warm faceted palette (owner: "warmer, like the example, but not orange"): golden honey and butter, cream, and a
 * warm rose-red for the pieces, lit by a low golden sun.
 */
export const WARM = {
  tray: '#e3b456',
  trayDeep: '#c9933f',
  tile: '#fbefd6',
  tileAlt: '#f5dc9c',
  litTile: '#ffe7a3',
  piece: '#d9675f',
  pieceDeep: '#b94f4f',
  stand: '#f8ecd6',
  standRotating: '#efd28a',
  sun: '#ffe2b0',
  sky: '#fff6e4',
  ground: '#a8744a',
};

/** Floor options for the trial (the floor contrasts with the warm pieces and the golden light). */
export const FLOORS = {
  sage: { board: '#5f9f78', cell: '#d3e9d3', cellAlt: '#bcdcc1' },
  stone: { board: '#b39a80', cell: '#f3eee6', cellAlt: '#e2d9cc' },
  cocoa: { board: '#3f2d29', cell: '#6e5248', cellAlt: '#5d443b' },
};

export const BEAM_COLORS = { sun: '#ffd23f', coral: '#ff6a4e', lime: '#8ad64a', sky: '#5cc4f0' };
export const BEAM_HEIGHT = 0.36;

/** A color pushed past white so bloom catches it. */
export const glowing = (color, strength = 2.5) => new THREE.Color(color).multiplyScalar(strength);

/** Cell (x, y) → table coordinates: x right, z towards the player. */
export const cellPosition = (level, x, y) => [x - level.width / 2 + 0.5, 0, y - level.height / 2 + 0.5];

/** A rounded rectangle outline (for frames and pillowy tiles). */
export function roundedRect(width, height, radius) {
  const shape = new THREE.Shape();
  const [w, h, r] = [width / 2, height / 2, Math.min(radius, width / 2, height / 2)];
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
}

/** A soft, deeply bevelled slab from a rounded rectangle (tiles, frames): extruded upwards. */
export function pillow(width, depth, height, radius, bevel = height * 0.45) {
  const geometry = new THREE.ExtrudeGeometry(roundedRect(width - bevel * 2, depth - bevel * 2, Math.max(0.01, radius - bevel)), {
    depth: Math.max(0.001, height - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 10,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, bevel, 0);
  return geometry;
}

/** A five-point star shape (the lamp's emblem). */
export function starShape(radius) {
  const shape = new THREE.Shape();
  for (let point = 0; point < 10; point++) {
    const r = point % 2 ? radius * 0.47 : radius;
    const angle = (point / 10) * Math.PI * 2 + Math.PI / 2;
    if (point === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  return shape;
}

/** A rectangle with its corners cut off (an octagon-ish outline): the faceted style's basic shape. */
export function chamferedRect(width, height, cut) {
  const [w, h, c] = [width / 2, height / 2, Math.min(cut, width / 2, height / 2)];
  const shape = new THREE.Shape();
  shape.moveTo(-w + c, -h);
  shape.lineTo(w - c, -h);
  shape.lineTo(w, -h + c);
  shape.lineTo(w, h - c);
  shape.lineTo(w - c, h);
  shape.lineTo(-w + c, h);
  shape.lineTo(-w, h - c);
  shape.lineTo(-w, -h + c);
  shape.closePath();
  return shape;
}

/** A crisp faceted block: a chamfered outline extruded upwards with one flat bevel all round (low-poly look). */
export function facetedBlock(width, depth, height, cut, bevel = Math.min(height * 0.2, 0.05)) {
  const geometry = new THREE.ExtrudeGeometry(chamferedRect(width - bevel * 2, depth - bevel * 2, Math.max(0.005, cut - bevel)), {
    depth: Math.max(0.001, height - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, bevel, 0);
  return geometry;
}
