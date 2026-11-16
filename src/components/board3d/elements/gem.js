/*
 * A gem: a cut jewel in its color's own shape that fills with light (see makeGem).
 */
import * as THREE from 'three';
import { BEAM_COLORS } from '../../../game/constants.js';
import { starSprite } from '../lightMaterials.js';
import { BEAM_HEX, addShadowed, glowSprite, mat } from './shared.js';

/**
 * A color's gem as a cut jewel: a pointed pavilion below the girdle and a crown with a flat table on top, with
 * as many sides as its shape (BEAM_COLORS[color].shape), so each color keeps its own outline seen from above:
 * diamond 8 (a brilliant), circle 12 (a round brilliant), triangle 3 (a trillion), square 4 (a princess cut).
 */
const GEM_SIDES = { diamond: 8, circle: 12, triangle: 3, square: 4 };

function gemGeometry(color) {
  const shape = BEAM_COLORS[color]?.shape ?? 'diamond';
  const sides = GEM_SIDES[shape] ?? 8;
  // Fewer sides look smaller at the same radius, so they get a little more.
  const r = sides <= 4 ? 0.36 : 0.31;
  const outline = [
    [0.001, -0.3],
    [r, 0.0],
    [r, 0.05],
    [r * 0.62, 0.19],
    [0.001, 0.19],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const geometry = new THREE.LatheGeometry(outline, sides, shape === 'square' ? Math.PI / 4 : 0);
  return geometry;
}

/**
 * A gem: a glassy cut crystal in its color's own shape on a little gold-rimmed pedestal. Frosted and quiet until
 * light reaches it; then it fills with light from inside, glows, and twinkles with star glints (the scene plays
 * the sparkle burst).
 */
export function makeGem(tile, { environment }) {
  const group = new THREE.Group();
  const color = new THREE.Color(BEAM_HEX[tile.color] ?? BEAM_HEX.sun);
  addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.12, 24), mat('#efe3cf', { roughness: 0.6 }))).position.y = 0.06;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.02, 8, 32),
    new THREE.MeshPhysicalMaterial({ color: '#d4a85a', metalness: 0.85, roughness: 0.3, envMap: environment }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.12;
  group.add(rim);
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.04,
    metalness: 0,
    transmission: 0.35,
    thickness: 0.5,
    ior: 2.1,
    iridescence: 0.6,
    iridescenceIOR: 1.6,
    clearcoat: 1,
    flatShading: true,
    envMap: environment,
    envMapIntensity: 1.6,
    emissive: color,
    emissiveIntensity: 0,
  });
  const gem = addShadowed(group, new THREE.Mesh(gemGeometry(tile.color), material));
  gem.position.y = 0.45;
  const inner = glowSprite(color.clone().lerp(new THREE.Color('#ffffff'), 0.45), 1.0, 0);
  inner.position.y = 0.45;
  group.add(inner);
  const twinkles = [
    [0.16, 0.6, 0.06],
    [-0.14, 0.38, 0.12],
    [0.05, 0.3, -0.16],
  ].map(([x, y, z]) => {
    const star = starSprite('#ffffff', 0, 1);
    star.position.set(x, y, z);
    group.add(star);
    return star;
  });
  return { group, gem, material, color, gemGlow: inner, twinkles };
}
