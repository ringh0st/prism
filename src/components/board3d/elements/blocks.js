/*
 * Pieces that stop or tint light: walls, color glass, shadow crystals and voids.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { BEAM_COLORS } from '../../../game/constants.js';
import { BEAM_HEX, COLORS, addShadowed, addSticker, mat, sticker } from './shared.js';

export function makeWall() {
  const group = new THREE.Group();
  const block = addShadowed(group, new THREE.Mesh(new RoundedBoxGeometry(0.84, 0.5, 0.84, 4, 0.14), mat(COLORS.wall)));
  block.position.y = 0.25;
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.02, 0.86), mat(COLORS.wallDeep));
  seam.position.y = 0.25;
  group.add(seam);
  return { group };
}

/** Color glass: a tinted glass disc in its beam's color with the color's shape on it. */
export function makeFilter(tile) {
  const group = new THREE.Group();
  const color = BEAM_HEX[tile.color] ?? BEAM_HEX.sun;
  const glass = addShadowed(
    group,
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.42, 40, 1, true),
      mat(color, { transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
    ),
  );
  glass.position.y = 0.22;
  const rim = addShadowed(group, new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 12, 48), mat(color, { roughness: 0.4 })));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.43;
  const shapePath = {
    diamond: 'M0-38L36 0 0 38-36 0Z',
    circle: 'M0-36A36 36 0 1 1-.1-36Z',
    triangle: 'M0-38L38 32H-38Z',
    square: 'M-32-32H32V32H-32Z',
  };
  addSticker(
    group,
    sticker({ background: color, path: shapePath[BEAM_COLORS[tile.color]?.shape] ?? shapePath.diamond, ink: '#ffffff', scale: 0.9, offsetY: 0 }),
    0.3,
    0.06,
  );
  return { group };
}

/** A shadow crystal: a dark stone that must stay out of the light (it flares red when lit). */
export function makeShade() {
  const group = new THREE.Group();
  const material = mat(COLORS.shade, { roughness: 0.5, emissive: new THREE.Color('#ff3b30'), emissiveIntensity: 0 });
  const stone = addShadowed(group, new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), material));
  stone.position.y = 0.3;
  return { group, shadeMaterial: material, stone };
}

/** A void: a dark hole in the board with a soft dark halo where it swallows light. */
export function makeVoid() {
  const group = new THREE.Group();
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.12, 40), mat('#2f2620', { roughness: 1 }));
  hole.position.y = 0.03;
  group.add(hole);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), haloMaterial());
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.075;
  group.add(halo);
  return { group };
}

let haloTexture = null;

function haloMaterial() {
  if (!haloTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const draw = canvas.getContext('2d');
    const gradient = draw.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(47, 38, 32, 0.55)');
    gradient.addColorStop(1, 'rgba(47, 38, 32, 0)');
    draw.fillStyle = gradient;
    draw.fillRect(0, 0, 128, 128);
    haloTexture = new THREE.CanvasTexture(canvas);
  }
  return new THREE.MeshBasicMaterial({ map: haloTexture, transparent: true, depthWrite: false });
}
