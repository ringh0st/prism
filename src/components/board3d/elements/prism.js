/*
 * A prism crystal: light splits out to both sides (see makePrism).
 */
import * as THREE from 'three';
import { addShadowed } from './shared.js';

/** A prism crystal: a three-sided glass crystal in the warm colors it splits light into. */
export function makePrism(_tile, { environment }) {
  const group = new THREE.Group();
  const crystal = addShadowed(
    group,
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.5, 3),
      new THREE.MeshPhysicalMaterial({ color: '#f6e3c6', roughness: 0.15, transmission: 0.3, envMap: environment, flatShading: true }),
    ),
  );
  crystal.position.y = 0.27;
  return { group };
}
