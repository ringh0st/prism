/*
 * The lamp: a stage spotlight on a brass stand (see makeLamp).
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { glowMaterial } from '../lightMaterials.js';
import { BEAM_HEIGHT, BEAM_HEX, DIRECTION_ANGLE, addShadowed, glowSprite, mat } from './shared.js';

/**
 * The lamp: a little stage spotlight on a brass stand. A cream housing with a honey band and a brass bezel points
 * the way the light leaves; its lens glows white-hot in the beam's color and throws a soft cone of light, and
 * the glow breathes (a turning lamp sits on a turntable).
 */
export function makeLamp(tile, { theme, environment }) {
  const group = new THREE.Group();
  const brass = new THREE.MeshPhysicalMaterial({ color: '#d4a85a', metalness: 0.85, roughness: 0.3, envMap: environment, envMapIntensity: 1.3 });
  if (tile.turnable) {
    const plate = addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.47, 0.05, 40), mat(new THREE.Color(theme.pivot))));
    plate.position.y = 0.03;
  }
  const head = new THREE.Group();
  head.rotation.y = DIRECTION_ANGLE[tile.dir] ?? 0;
  // The stand: a round foot and a fork that holds the light.
  addShadowed(head, new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.07, 40), brass)).position.y = 0.06;
  addShadowed(head, new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.12, 16), brass)).position.y = 0.14;
  for (const side of [-1, 1]) {
    const arm = addShadowed(head, new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.2, 0.035, 2, 0.015), brass));
    arm.position.set(-0.04, 0.24, side * 0.215);
  }
  // The housing, lying along the way the light leaves.
  const housing = new THREE.Group();
  housing.position.set(-0.04, BEAM_HEIGHT, 0);
  const shell = addShadowed(housing, new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.42, 40), mat('#fff4e2', { roughness: 0.45 })));
  shell.rotation.z = -Math.PI / 2;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.09, 40), mat('#f0c14e', { roughness: 0.4 }));
  band.rotation.z = -Math.PI / 2;
  band.position.x = -0.06;
  housing.add(band);
  const back = addShadowed(
    housing,
    new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#fff4e2', { roughness: 0.45 })),
  );
  back.rotation.z = Math.PI / 2;
  back.position.x = -0.21;
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 12, 40), brass);
  bezel.rotation.y = Math.PI / 2;
  bezel.position.x = 0.21;
  housing.add(bezel);
  head.add(housing);
  // The lens: the beam's color with a white-hot centre, a breathing glow and a soft cone of light ahead of it.
  const beamColor = new THREE.Color(BEAM_HEX[tile.color] ?? BEAM_HEX.sun);
  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.18, 40),
    new THREE.MeshBasicMaterial({ color: beamColor.clone().lerp(new THREE.Color('#ffffff'), 0.25) }),
  );
  lens.rotation.y = Math.PI / 2;
  lens.position.set(0.215, BEAM_HEIGHT, 0);
  head.add(lens);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.09, 32), new THREE.MeshBasicMaterial({ color: '#fffdf0' }));
  core.rotation.y = Math.PI / 2;
  core.position.set(0.22, BEAM_HEIGHT, 0);
  head.add(core);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.6, 40, 1, true), glowMaterial(beamColor, { opacity: 0.45, sharpness: 1.2 }));
  cone.rotation.z = Math.PI / 2;
  cone.position.set(0.52, BEAM_HEIGHT, 0);
  head.add(cone);
  const glow = glowSprite(beamColor.clone().lerp(new THREE.Color('#ffffff'), 0.35), 0.9, 0.85);
  glow.position.set(0.26, BEAM_HEIGHT, 0);
  head.add(glow);
  group.add(head);
  return { group, lampHead: head, baseAngle: head.rotation.y, lampGlow: glow };
}
