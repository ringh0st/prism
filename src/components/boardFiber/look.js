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
