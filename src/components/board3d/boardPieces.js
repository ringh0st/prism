/*
 * The 3D pieces, each drawn like its flat tile (TileArt.jsx): same colors, same symbols, same shapes per color
 * (so color is never the only clue), as chunky toys standing on the board. Each builder returns
 * { group, …parts the scene animates }.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { BEAM_COLORS, TILE } from '../../game/constants.js';
import { glowMaterial, starSprite } from './lightMaterials.js';

export const BEAM_HEX = { sun: '#ffc61a', coral: '#ff5a4e', lime: '#7ccf3c', sky: '#45b4ea' };
export const BEAM_HEIGHT = 0.28;

/** Portal, twin-mirror, gate and switch pairs: their own color and symbol, as on the flat board. */
const PAIR_LOOKS = {
  a: { color: '#F0C14E', ink: '#8a6410', symbol: 'M0-7l2 5 5 .5-4 3.5 1.3 5L0 8.3-4.3 11l1.3-5-4-3.5 5-.5z' },
  b: { color: '#F2A67E', ink: '#9c4f2c', symbol: 'M0 7C-8 2-8-5-4-6-2-6.5 0-5 0-3c0-2 2-3.5 4-3 4 1 4 8-4 13z' },
};
const pairLook = (pair) => PAIR_LOOKS[pair] ?? PAIR_LOOKS.a;

const COLORS = {
  lamp: '#ef9c5a',
  lampDeep: '#d9773f',
  lampCap: '#f6c08a',
  stone: '#cdb9a0',
  wall: '#b98d68',
  wallDeep: '#9c7350',
  shade: '#4a3a32',
  cream: '#fffaf2',
  gemDark: '#8c8378',
};
const DIRECTION_ANGLE = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 };

export const mat = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...options });

export function addShadowed(group, mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/** A round sticker (a pair's symbol, or a color's shape) drawn with the flat board's own SVG paths. */
const stickerCache = new Map();
function sticker({ background, ring, path, ink, scale = 4.6, offsetY = -1 }) {
  const key = [background, ring, path, ink, scale].join('|');
  if (!stickerCache.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const draw = canvas.getContext('2d');
    draw.beginPath();
    draw.arc(64, 64, 60, 0, Math.PI * 2);
    draw.fillStyle = background;
    draw.fill();
    if (ring) {
      draw.lineWidth = 10;
      draw.strokeStyle = ring;
      draw.stroke();
    }
    draw.translate(64, 64 + offsetY);
    draw.scale(scale, scale);
    draw.fillStyle = ink;
    draw.fill(new Path2D(path));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    stickerCache.set(key, texture);
  }
  return stickerCache.get(key);
}

/** A flat round sticker lying on top of a piece at height y. */
function addSticker(group, texture, radius, y) {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 40),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6, transparent: true }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = y;
  group.add(disc);
  return disc;
}

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
 * A soft round glow (light without a full-screen bloom pass, so it stays cheap on phones): a sprite with a
 * radial fade, added on top of what's behind it.
 */
let glowTexture = null;
export function glowSprite(color, size, opacity = 1) {
  if (!glowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const draw = canvas.getContext('2d');
    const gradient = draw.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.75)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.18)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    draw.fillStyle = gradient;
    draw.fillRect(0, 0, 128, 128);
    glowTexture = new THREE.CanvasTexture(canvas);
  }
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  sprite.scale.setScalar(size);
  return sprite;
}

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
function makeMirror(tile, { environment, theme, isRotatable }) {
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

/**
 * The lamp: a little stage spotlight on a brass stand. A cream housing with a honey band and a brass bezel points
 * the way the light leaves; its lens glows white-hot in the beam's color and throws a soft cone of light, and
 * the glow breathes (a turning lamp sits on a turntable).
 */
function makeLamp(tile, { theme, environment }) {
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

/**
 * A gem: a glassy cut crystal in its color's own shape on a little gold-rimmed pedestal. Frosted and quiet until
 * light reaches it; then it fills with light from inside, glows, and twinkles with star glints (the scene plays
 * the sparkle burst).
 */
function makeGem(tile, { environment }) {
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

function makeWall() {
  const group = new THREE.Group();
  const block = addShadowed(group, new THREE.Mesh(new RoundedBoxGeometry(0.84, 0.5, 0.84, 4, 0.14), mat(COLORS.wall)));
  block.position.y = 0.25;
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.02, 0.86), mat(COLORS.wallDeep));
  seam.position.y = 0.25;
  group.add(seam);
  return { group };
}

/** Color glass: a tinted glass disc in its beam's color with the color's shape on it. */
function makeFilter(tile) {
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
function makeShade() {
  const group = new THREE.Group();
  const material = mat(COLORS.shade, { roughness: 0.5, emissive: new THREE.Color('#ff3b30'), emissiveIntensity: 0 });
  const stone = addShadowed(group, new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), material));
  stone.position.y = 0.3;
  return { group, shadeMaterial: material, stone };
}

/** A portal: a ring in its pair's color around a swirl, with the pair's symbol in the middle. */
function makePortal(tile) {
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

/** A prism crystal: a three-sided glass crystal in the warm colors it splits light into. */
function makePrism(_tile, { environment }) {
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

/** A light gate: a barred block in its pair's color while closed; it sinks into the board when its switch is lit. */
function makeGate(tile) {
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
function makeSwitch(tile) {
  const group = new THREE.Group();
  const look = pairLook(tile.pair);
  addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.1, 40), mat(COLORS.cream))).position.y = 0.05;
  const material = mat(look.color, { emissive: new THREE.Color(look.color), emissiveIntensity: 0, roughness: 0.5 });
  const button = addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.12, 40), material));
  button.position.y = 0.14;
  addSticker(group, sticker({ background: look.color, path: look.symbol, ink: look.ink }), 0.16, 0.205);
  return { group, switchMaterial: material };
}

/** A void: a dark hole in the board with a soft dark halo where it swallows light. */
function makeVoid() {
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

/** Each piece type's builder. Unknown types get a plain marker so the board still reads. */
export function makePiece(tile, context) {
  switch (tile.type) {
    case TILE.MIRROR:
    case TILE.SPLITTER:
      return makeMirror(tile, context);
    case TILE.EMITTER:
      return makeLamp(tile, context);
    case TILE.GEM:
      return makeGem(tile, context);
    case TILE.WALL:
      return makeWall();
    case TILE.FILTER:
      return makeFilter(tile);
    case TILE.SHADE:
      return makeShade();
    case TILE.PORTAL:
      return makePortal(tile);
    case TILE.PRISM:
      return makePrism(tile, context);
    case TILE.GATE:
      return makeGate(tile);
    case TILE.SWITCH:
      return makeSwitch(tile);
    case TILE.VOID:
      return makeVoid();
    default: {
      const group = new THREE.Group();
      addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 6), mat('#bfae96'))).position.y = 0.1;
      return { group };
    }
  }
}

export const darkenedColor = new THREE.Color(COLORS.gemDark);
