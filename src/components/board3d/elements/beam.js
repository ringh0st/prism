/*
 * The light beam: a white-hot core in golden light, soft glows with light flowing along them, a pool of light on
 * the tiles and sparks travelling the way the light goes (the scene moves the sparks and flows the glow).
 */
import * as THREE from 'three';
import { glowMaterial } from '../lightMaterials.js';
import { BEAM_HEIGHT, BEAM_HEX, glowSprite } from './shared.js';

/** Cell (x, y) to the table's coordinates: x to the right, z towards the player. */
export const place = (level, x, y) => new THREE.Vector3(x - level.width / 2 + 0.5, 0, y - level.height / 2 + 0.5);

/**
 * A beam between two cell centres: a bright white core inside golden light, with a pool of its light on the
 * tiles and little sparks travelling the way the light goes (the scene moves them). Returns { group, sparks }.
 */
export function makeBeam(level, segment) {
  const from = place(level, segment.x1, segment.y1).setY(BEAM_HEIGHT);
  const to = place(level, segment.x2, segment.y2).setY(BEAM_HEIGHT);
  const length = from.distanceTo(to) + 0.06;
  const group = new THREE.Group();
  const color = new THREE.Color(BEAM_HEX[segment.color] ?? BEAM_HEX.sun);
  const tube = new THREE.Group();
  // A wide soft glow and a nearer one (light flowing along both), a solid golden body and a white-hot core.
  const glows = [
    glowMaterial(color, { opacity: 0.42, sharpness: 2.2, flow: 0.45, length, additive: false }),
    glowMaterial(color, { opacity: 0.75, sharpness: 1.1, flow: 0.3, length, additive: false }),
  ];
  const layers = [
    { radius: 0.2, material: glows[0] },
    { radius: 0.1, material: glows[1] },
    { radius: 0.055, material: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false }) },
    { radius: 0.026, material: new THREE.MeshBasicMaterial({ color: '#ffffff', depthWrite: false, transparent: true }) },
  ];
  for (const layer of layers) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(layer.radius, layer.radius, length, 20, 1, true), layer.material);
    mesh.rotation.z = Math.PI / 2;
    tube.add(mesh);
  }
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(length, 0.5),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.03 - BEAM_HEIGHT;
  tube.add(pool);
  tube.position.copy(from).lerp(to, 0.5);
  tube.rotation.y = -Math.atan2(to.z - from.z, to.x - from.x);
  group.add(tube);
  // Sparks: about two per cell, spaced evenly, moving from the lamp's side to the far end.
  const sparks = [];
  // Pulses of light: about one per cell, bright dots travelling the light's way (the design guide's "pulsing").
  const count = Math.max(1, Math.round(length * 0.9));
  for (let n = 0; n < count; n++) {
    const sprite = glowSprite(color.clone().lerp(new THREE.Color('#ffffff'), 0.7), 0.26, 1);
    group.add(sprite);
    sparks.push({ sprite, phase: n / count });
  }
  return { group, sparks, from, to, length, glows, color };
}
