/*
 * Paired pieces: portals, light gates and their switches, in their pair's color and symbol.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { COLORS, addShadowed, addSticker, mat, pairLook, sticker } from './shared.js';

/** A portal: a ring in its pair's color around a swirl, with the pair's symbol in the middle. */
export function makePortal(tile) {
  const group = new THREE.Group();
  const look = pairLook(tile.pair);
  const ring = addShadowed(group, new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.06, 16, 48), mat(look.color, { roughness: 0.45 })));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.1;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.31, 40), mat(look.color, { transparent: true, opacity: 0.35 }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.075;
  group.add(pool);
  const swirl = addSticker(group, sticker({ background: COLORS.cream, path: look.symbol, ink: look.ink }), 0.15, 0.09);
  return { group, swirl };
}

/** A light gate: a barred block in its pair's color while closed; it sinks into the board when its switch is lit. */
export function makeGate(tile) {
  const group = new THREE.Group();
  const look = pairLook(tile.pair);
  const door = new THREE.Group();
  addShadowed(door, new THREE.Mesh(new RoundedBoxGeometry(0.82, 0.5, 0.82, 3, 0.1), mat(COLORS.wall))).position.y = 0.25;
  for (const x of [-0.2, 0, 0.2]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.84), mat(COLORS.wallDeep));
    bar.position.set(x, 0.25, 0);
    door.add(bar);
  }
  addSticker(door, sticker({ background: COLORS.cream, ring: look.color, path: look.symbol, ink: look.ink }), 0.15, 0.511);
  group.add(door);
  // Its frame stays when it opens, so the cell still reads as a gate.
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 8, 4), mat(look.color));
  frame.rotation.set(Math.PI / 2, 0, Math.PI / 4);
  frame.position.y = 0.06;
  group.add(frame);
  return { group, door };
}

/** A light switch: a round button in its pair's color that glows when light hits it. */
export function makeSwitch(tile) {
  const group = new THREE.Group();
  const look = pairLook(tile.pair);
  addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.1, 40), mat(COLORS.cream))).position.y = 0.05;
  const material = mat(look.color, { emissive: new THREE.Color(look.color), emissiveIntensity: 0, roughness: 0.5 });
  const button = addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.12, 40), material));
  button.position.y = 0.14;
  addSticker(group, sticker({ background: look.color, path: look.symbol, ink: look.ink }), 0.16, 0.205);
  return { group, switchMaterial: material };
}
