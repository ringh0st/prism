/*
 * The lamp (design guide: "Lamp — light source"): a chunky coral-orange glossy block with a cream cap and a little
 * button on top, a butter-yellow star on each side, and a big gold-rimmed lens on the front that glows white-hot
 * in its beam's color. The lens faces the way the light leaves; a turning lamp sits on a sage turntable.
 * The glow breathes slowly (the scene drives `lampGlow`).
 */
import * as THREE from 'three';
import { BEAM_HEIGHT, BEAM_HEX, DIRECTION_ANGLE, addShadowed, glowSprite } from './shared.js';
import { PALETTE, emissive, glass, glossy, goldTrim, roundedBox, softMatte, starGeometry } from './style.js';

const BODY = 0.62;

export function makeLamp(tile, { theme, environment }) {
  const group = new THREE.Group();
  if (tile.turnable) {
    const plate = addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.47, 0.05, 48), softMatte(new THREE.Color(theme.pivot))));
    plate.position.y = 0.03;
  }
  // The head turns to face the way the light leaves (+x before turning).
  const head = new THREE.Group();
  head.rotation.y = DIRECTION_ANGLE[tile.dir] ?? 0;
  group.add(head);

  const body = addShadowed(head, new THREE.Mesh(roundedBox(BODY, BODY * 0.86, BODY), glossy(PALETTE.coral, environment)));
  body.position.set(-0.04, 0.3, 0);
  const cap = addShadowed(head, new THREE.Mesh(roundedBox(BODY * 0.78, 0.1, BODY * 0.78), glossy(PALETTE.cream, environment)));
  cap.position.set(-0.04, 0.6, 0);
  const button = addShadowed(head, new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.06, 32), glossy(PALETTE.coral, environment)));
  button.position.set(-0.04, 0.67, 0);

  // A butter-yellow star on each side: the lamp's emblem.
  for (const side of [-1, 1]) {
    const star = new THREE.Mesh(starGeometry(0.14, 0.02), glossy(PALETTE.butter, environment));
    star.position.set(-0.06, 0.3, side * (BODY / 2 + 0.012));
    star.rotation.y = side > 0 ? 0 : Math.PI;
    head.add(star);
  }

  // The lens: a gold bezel, glass, and a glowing white-hot centre in the beam's color.
  const beamColor = new THREE.Color(BEAM_HEX[tile.color] ?? BEAM_HEX.sun);
  const front = BODY / 2 - 0.04;
  const bezel = addShadowed(head, new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 16, 48), goldTrim(environment)));
  bezel.rotation.y = Math.PI / 2;
  bezel.position.set(front + 0.03, BEAM_HEIGHT, 0);
  const lensGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.05, 48),
    glass(beamColor.clone().lerp(new THREE.Color('#ffffff'), 0.55), environment),
  );
  lensGlass.rotation.z = Math.PI / 2;
  lensGlass.position.set(front + 0.02, BEAM_HEIGHT, 0);
  head.add(lensGlass);
  const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.15, 40), emissive(beamColor.clone().lerp(new THREE.Color('#ffffff'), 0.35)));
  glowDisc.rotation.y = Math.PI / 2;
  glowDisc.position.set(front + 0.048, BEAM_HEIGHT, 0);
  head.add(glowDisc);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.08, 32), emissive('#fffef4'));
  core.rotation.y = Math.PI / 2;
  core.position.set(front + 0.05, BEAM_HEIGHT, 0);
  head.add(core);
  const glow = glowSprite(beamColor.clone().lerp(new THREE.Color('#ffffff'), 0.4), 0.95, 0.85);
  glow.position.set(front + 0.12, BEAM_HEIGHT, 0);
  head.add(glow);

  return { group, lampHead: head, baseAngle: head.rotation.y, lampGlow: glow };
}
