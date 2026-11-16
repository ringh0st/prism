/*
 * A mirror or splitter: reflective glass in a metal frame on its turntable (see makeMirror).
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TILE } from '../../../game/constants.js';
import { COLORS, addShadowed, addSticker, mat, pairLook, sticker } from './shared.js';

/** Reflective glass: pale silver-blue with a clear coat that catches the room's light. */
const mirrorGlass = (environment) =>
  new THREE.MeshPhysicalMaterial({
    color: '#a9c8dc',
    metalness: 0.78,
    roughness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMap: environment,
    envMapIntensity: 2.2,
  });

const metalFrame = (environment) =>
  new THREE.MeshPhysicalMaterial({ color: '#c9ccd1', metalness: 1, roughness: 0.28, envMap: environment, envMapIntensity: 1.4 });

/**
 * A mirror: a real looking-glass, silver-blue reflective glass in a thin metal frame, standing on its turntable,
 * with a curved arrow on the turntable that says "I turn" (a fixed one stands on a stone plate with studs instead).
 * A splitter is half-silvered sea-green glass. Twins wear their pair's mark; cracking mirrors show dots.
 */
export function makeMirror(tile, { environment, theme, isRotatable }) {
  const group = new THREE.Group();
  const base = addShadowed(
    group,
    new THREE.Mesh(
      isRotatable ? new THREE.CylinderGeometry(0.37, 0.39, 0.08, 40) : new RoundedBoxGeometry(0.78, 0.08, 0.78, 3, 0.03),
      mat(isRotatable ? new THREE.Color(theme.pivot).lerp(new THREE.Color(theme.cell), 0.45) : COLORS.stone),
    ),
  );
  base.position.y = 0.06;
  if (isRotatable) {
    // The turn handle: a curved arrow around the turntable, in the world's piece color.
    const arrowColor = mat(theme.piece, { roughness: 0.5 });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.022, 8, 40, Math.PI * 0.55), arrowColor);
    arc.rotation.x = -Math.PI / 2;
    arc.rotation.z = Math.PI * 0.95;
    arc.position.y = 0.105;
    group.add(arc);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.11, 12), arrowColor);
    const end = Math.PI * 0.95 + Math.PI * 0.55;
    tip.position.set(Math.cos(end) * 0.33, 0.105, -Math.sin(end) * 0.33);
    tip.rotation.set(Math.PI / 2, 0, 0);
    tip.rotateZ(-end);
    group.add(tip);
  } else {
    for (const [x, z] of [
      [-0.28, -0.28],
      [0.28, -0.28],
      [-0.28, 0.28],
      [0.28, 0.28],
    ]) {
      const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), mat('#9c8873'));
      stud.position.set(x, 0.115, z);
      group.add(stud);
    }
  }
  const rotor = new THREE.Group();
  rotor.position.y = 0.1;
  const isSplitter = tile.type === TILE.SPLITTER;
  // A thin metal frame around the glass, on a small foot.
  const frame = addShadowed(rotor, new THREE.Mesh(new RoundedBoxGeometry(0.88, 0.46, 0.08, 3, 0.03), metalFrame(environment)));
  frame.position.y = 0.25;
  const foot = addShadowed(rotor, new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.05, 0.16, 2, 0.02), metalFrame(environment)));
  foot.position.y = 0.025;
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.38, 0.09),
    isSplitter
      ? new THREE.MeshPhysicalMaterial({
          color: '#a8e6da',
          metalness: 0.3,
          roughness: 0.05,
          transmission: 0.55,
          clearcoat: 1,
          transparent: true,
          opacity: 0.8,
          envMap: environment,
        })
      : mirrorGlass(environment),
  );
  glass.position.y = 0.25;
  rotor.add(glass);
  // A bright streak across the glass, so it reads as a reflecting surface from any side.
  for (const side of [1, -1]) {
    const streak = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.42),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }),
    );
    streak.position.set(-0.18, 0.25, side * 0.047);
    streak.rotation.set(0, side > 0 ? 0 : Math.PI, 0.5);
    rotor.add(streak);
  }
  if (tile.oneSided !== undefined) {
    // The dark back of a one-sided mirror covers the side that isn't silvered.
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.4, 0.04), mat('#5e4a3f'));
    back.position.set(0, 0.25, tile.oneSided === 0 ? 0.05 : -0.05);
    rotor.add(back);
  }
  group.add(rotor);
  // A twin's pair mark rides on top of the frame, so the matching ones are easy to spot.
  if (tile.link) {
    const look = pairLook(tile.link);
    addSticker(rotor, sticker({ background: look.color, ring: '#ffffff', path: look.symbol, ink: look.ink }), 0.13, 0.49);
  }
  // A cracking mirror: three peach dots that go out one by one.
  let crackDots = null;
  if (tile.fragile) {
    crackDots = [0, 1, 2].map((i) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 8), mat('#F2A67E'));
      dot.position.set(-0.12 + i * 0.12, 0.12, 0.4);
      group.add(dot);
      return dot;
    });
  }
  return { group, rotor, crackDots };
}
