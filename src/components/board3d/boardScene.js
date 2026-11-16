/*
 * A 3D board (prototype): the same level drawn as a little tabletop diorama. A warm paper table, pieces as
 * chunky toys that cast soft shadows, real silver mirrors, gems that light up, and beams as the only glowing
 * things (bloom picks up just them). The game logic is unchanged: this only draws `orients` and `trace`.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TILE } from '../../game/constants.js';

const BEAM_COLORS = { sun: '#ffd23f', coral: '#ff5a4e', lime: '#7ccf3c', sky: '#45b4ea' };
const PALETTE = {
  table: '#c99a6b',
  tableEdge: '#a8794f',
  cellA: '#efe4cf',
  cellB: '#e7dac2',
  wood: '#c99a6b',
  sage: '#58ac82',
  honey: '#f0c14e',
  stone: '#cdb9a0',
  ink: '#2b2118',
};
const BEAM_HEIGHT = 0.3;
const DIRECTION_ANGLE = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 };

const mat = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...options });

/** Cell (x, y) to the table's coordinates: x to the right, z towards the player. */
const place = (level, x, y) => new THREE.Vector3(x - level.width / 2 + 0.5, 0, y - level.height / 2 + 0.5);

function addShadowed(group, mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function makeTable(level) {
  const group = new THREE.Group();
  const top = addShadowed(group, new THREE.Mesh(new RoundedBoxGeometry(level.width + 0.5, 0.4, level.height + 0.5, 4, 0.18), mat(PALETTE.table)));
  top.position.y = -0.2;
  const ledge = new THREE.Mesh(new RoundedBoxGeometry(level.width + 0.6, 0.3, level.height + 0.6, 4, 0.16), mat(PALETTE.tableEdge));
  ledge.position.y = -0.38;
  group.add(ledge);
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const cell = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.04, 0.92, 2, 0.02), mat((x + y) % 2 ? PALETTE.cellA : PALETTE.cellB));
      cell.position.copy(place(level, x, y)).setY(0.0);
      cell.receiveShadow = true;
      group.add(cell);
    }
  }
  return group;
}

/** A mirror on its pivot: a wooden puck (or a square plate when fixed) with an upright silver panel. */
function makeMirror(tile, environment) {
  const group = new THREE.Group();
  const isFixed = tile.locked;
  const base = addShadowed(
    group,
    new THREE.Mesh(
      isFixed ? new RoundedBoxGeometry(0.8, 0.08, 0.8, 2, 0.03) : new THREE.CylinderGeometry(0.36, 0.38, 0.08, 32),
      mat(isFixed ? PALETTE.stone : '#f2a67e'),
    ),
  );
  base.position.y = 0.06;
  const rotor = new THREE.Group();
  rotor.position.y = 0.1;
  const isSplitter = tile.type === TILE.SPLITTER;
  const frame = addShadowed(rotor, new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.44, 0.12, 3, 0.04), mat(isSplitter ? '#17988c' : '#3f8f68')));
  frame.position.y = 0.22;
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.34, 0.13),
    isSplitter
      ? new THREE.MeshPhysicalMaterial({ color: '#9fe3d6', roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.7, envMap: environment })
      : new THREE.MeshStandardMaterial({ color: '#f4f1ea', metalness: 1, roughness: 0.08, envMap: environment, envMapIntensity: 1.2 }),
  );
  glass.position.y = 0.22;
  rotor.add(glass);
  group.add(rotor);
  return { group, rotor };
}

function makeLamp(tile) {
  const group = new THREE.Group();
  addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.16, 32), mat(PALETTE.wood))).position.y = 0.08;
  const head = new THREE.Group();
  head.position.y = BEAM_HEIGHT;
  head.rotation.y = DIRECTION_ANGLE[tile.dir] ?? 0;
  const body = addShadowed(head, new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 16), mat(PALETTE.honey, { roughness: 0.5 })));
  body.scale.set(1, 0.9, 1);
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.08, 24),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun).multiplyScalar(3), toneMapped: false }),
  );
  lens.rotation.z = Math.PI / 2;
  lens.position.x = 0.22;
  head.add(lens);
  group.add(head);
  return { group };
}

function makeGem(tile) {
  const group = new THREE.Group();
  const color = new THREE.Color(BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun);
  const stand = addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.1, 6), mat(PALETTE.stone)));
  stand.position.y = 0.05;
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.25,
    metalness: 0.1,
    flatShading: true,
    emissive: color,
    emissiveIntensity: 0,
  });
  const gem = addShadowed(group, new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), material));
  gem.scale.set(1, 1.3, 1);
  gem.position.y = 0.42;
  return { group, gem, material, color };
}

function makeWall() {
  const group = new THREE.Group();
  const block = addShadowed(group, new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.5, 0.9, 3, 0.1), mat(PALETTE.stone)));
  block.position.y = 0.25;
  return { group };
}

/** Anything not drawn yet in the prototype: a plain marker so the board still reads. */
function makePlaceholder() {
  const group = new THREE.Group();
  addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 6), mat('#bfae96'))).position.y = 0.1;
  return { group };
}

function makePiece(tile, environment) {
  switch (tile.type) {
    case TILE.MIRROR:
    case TILE.SPLITTER:
      return makeMirror(tile, environment);
    case TILE.EMITTER:
      return makeLamp(tile);
    case TILE.GEM:
      return makeGem(tile);
    case TILE.WALL:
      return makeWall();
    default:
      return makePlaceholder();
  }
}

/** A beam between two cell centres: a glowing tube with a white-hot core (the only things bright enough to bloom). */
function makeBeam(level, segment) {
  const from = place(level, segment.x1, segment.y1).setY(BEAM_HEIGHT);
  const to = place(level, segment.x2, segment.y2).setY(BEAM_HEIGHT);
  const length = from.distanceTo(to);
  const group = new THREE.Group();
  const color = new THREE.Color(BEAM_COLORS[segment.color] ?? BEAM_COLORS.sun);
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, length, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(3), toneMapped: false }),
  );
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, length, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 2.6), toneMapped: false }),
  );
  for (const mesh of [glow, core]) {
    mesh.rotation.z = Math.PI / 2;
    group.add(mesh);
  }
  group.position.copy(from).lerp(to, 0.5);
  group.rotation.y = -Math.atan2(to.z - from.z, to.x - from.x);
  return group;
}

/**
 * Build the scene on a canvas.
 * @returns { update(orients, trace), resize(width, height), render(), dispose() }
 */
export function createBoardScene(canvas, level, { tilt = 0.62 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#faf6ee');
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.35;

  scene.add(new THREE.HemisphereLight('#fff6e6', '#b59c78', 0.9));
  const sun = new THREE.DirectionalLight('#fff1d6', 1.9);
  const size = Math.max(level.width, level.height);
  sun.position.set(-size * 0.6, size * 1.4, -size * 0.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -size;
  sun.shadow.camera.right = sun.shadow.camera.top = size;
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  scene.add(makeTable(level));
  const pieces = level.tiles.map((tile) => {
    const piece = makePiece(tile, environment);
    piece.group.position.copy(place(level, tile.x, tile.y));
    scene.add(piece.group);
    return piece;
  });
  const beams = new THREE.Group();
  scene.add(beams);

  // Looking down at the table, tilted towards the player (tilt 0 = straight down).
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const fitCamera = (aspect) => {
    camera.aspect = aspect;
    const span = (Math.max(level.width / aspect, level.height) + 1.2) / 2;
    const distance = span / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + 1;
    camera.position.set(0, Math.cos(tilt) * distance, Math.sin(tilt) * distance);
    camera.lookAt(0, 0, 0.1);
    camera.updateProjectionMatrix();
  };

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.35, 1.6);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const update = (orients, trace) => {
    level.tiles.forEach((tile, i) => {
      const piece = pieces[i];
      if (piece.rotor) piece.rotor.rotation.y = -THREE.MathUtils.degToRad(-45 + (orients[i] ?? 0) * 90);
      if (piece.gem) {
        const isLit = trace.litGems.has(i);
        piece.material.emissiveIntensity = isLit ? 2.2 : 0;
        piece.material.color.copy(isLit ? piece.color : piece.color.clone().lerp(new THREE.Color('#b9ab98'), 0.55));
      }
    });
    beams.clear();
    for (const segment of trace.segments) beams.add(makeBeam(level, segment));
  };

  const resize = (width, height) => {
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    fitCamera(width / height);
  };

  return {
    update,
    resize,
    render: () => composer.render(),
    dispose: () => {
      renderer.dispose();
      pmrem.dispose();
    },
  };
}
