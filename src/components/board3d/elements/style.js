/*
 * The 3D design system every puzzle element is built from, so the lamp, mirror, prism, gem and beam look like
 * one family: the same rounded forms and bevels, the same few materials, one lighting, one way of moving.
 *
 * Colors: the LumiPals palette only (sage, mint, cream, peach, coral-orange, butter yellow, teal).
 * Materials (from the design guide): soft matte, glossy plastic, glass, crystal, emissive glow. Slightly glossy and
 * magical, never realistic chrome or neon.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const PALETTE = {
  sage: '#58ac82',
  sageDeep: '#3f8f68',
  mint: '#4fbfad',
  teal: '#2e9f8f',
  cream: '#fff6e6',
  creamDeep: '#f3e3c8',
  peach: '#f2a67e',
  coral: '#ef8a4f',
  coralDeep: '#d9733d',
  butter: '#ffe066',
  honey: '#f0c14e',
  gold: '#e3b04b',
};

/** Bevels: every block-like part is rounded by the same share of its smallest side. */
const BEVEL = 0.28;

/** A rounded box with the family bevel. */
export const roundedBox = (width, height, depth) => new RoundedBoxGeometry(width, height, depth, 5, Math.min(width, height, depth) * BEVEL);

/** Soft matte: bases, stands and anything that shouldn't catch the eye. */
export const softMatte = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.82 });

/** Glossy plastic: the toy-like bodies (lamp housing, mirror frames). A soft clear coat gives a gentle highlight. */
export const glossy = (color, environment) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.38,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
    envMap: environment,
    envMapIntensity: 0.7,
  });

/** Gold trim: rims and bezels, warm and soft rather than chrome. */
export const goldTrim = (environment) =>
  new THREE.MeshPhysicalMaterial({
    color: PALETTE.gold,
    metalness: 0.65,
    roughness: 0.32,
    clearcoat: 0.5,
    envMap: environment,
    envMapIntensity: 1.1,
  });

/** Glass: mirror faces and lenses, pale and reflective with a clear coat. */
export const glass = (color, environment) =>
  new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.55,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMap: environment,
    envMapIntensity: 1.6,
  });

/** Crystal: prisms and gems, see-through with a rainbow sheen on the facets. */
export const crystal = (color, environment, { emissive = color } = {}) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.05,
    transmission: 0.45,
    thickness: 0.5,
    ior: 1.9,
    iridescence: 0.75,
    iridescenceIOR: 1.5,
    clearcoat: 1,
    flatShading: true,
    envMap: environment,
    envMapIntensity: 1.5,
    emissive: new THREE.Color(emissive),
    emissiveIntensity: 0,
  });

/** Emissive glow: the parts that are the light itself (lens centres, beam cores). */
export const emissive = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });

/**
 * One way of moving: everything eases towards its target with the same spring-like follow (fast start, soft
 * landing). `rate` is per second.
 */
export const EASE_RATE = 14;
export const follow = (current, target, dt, rate = EASE_RATE) => current + (target - current) * Math.min(1, dt * rate);

/** One rhythm for idle life (breathing glows, twinkles): a slow sine, so nothing on the board flickers. */
export const breathe = (time, offset = 0, speed = 2.4) => 0.5 + 0.5 * Math.sin(time * speed + offset);

/** A five-point star shape (the LumiPals emblem on the lamp), extruded with the family bevel. */
export function starGeometry(radius, depth) {
  const shape = new THREE.Shape();
  for (let point = 0; point < 10; point++) {
    const r = point % 2 ? radius * 0.48 : radius;
    const angle = (point / 10) * Math.PI * 2 - Math.PI / 2;
    const [x, y] = [Math.cos(angle) * r, -Math.sin(angle) * r];
    if (point === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.6,
    bevelSize: radius * 0.12,
    bevelSegments: 3,
  });
  geometry.center();
  return geometry;
}
