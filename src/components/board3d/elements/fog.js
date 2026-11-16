/*
 * Fog over a cell until light reaches it.
 */
import * as THREE from 'three';
import { addShadowed, mat } from './shared.js';

/** Fog over a cell until light reaches it: a soft cloud that hides whatever is under it. */
export function makeFog() {
  const group = new THREE.Group();
  const puff = mat('#f8f3ea', { roughness: 1 });
  for (const [x, z, r] of [
    [0, 0, 0.3],
    [-0.2, 0.08, 0.2],
    [0.2, 0.06, 0.22],
    [0.05, -0.18, 0.18],
  ]) {
    const ball = addShadowed(group, new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), puff));
    ball.position.set(x, 0.18, z);
    ball.scale.y = 0.7;
  }
  return group;
}
