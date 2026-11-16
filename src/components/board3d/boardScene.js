/*
 * A 3D board (prototype): the same level drawn as a little tabletop diorama in the flat board's own look: the
 * world's board color as the tray, soft rounded tiles in its two cell colors that warm to honey where light
 * passes, an orange lamp block, sage mirrors on pale sage turntables and honey gems. Pieces are chunky toys
 * with soft shadows; only the light glows. The game logic is unchanged: this only draws the turns and the trace.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TILE } from '../../game/constants.js';
import { cellsOnBeams } from '../../game/beam.js';

const BEAM_COLORS = { sun: '#ffc61a', coral: '#ff5a4e', lime: '#7ccf3c', sky: '#45b4ea' };
/** The flat board's colors (Board3D reads the world's own from its CSS; these are World 1's). */
export const DEFAULT_THEME = { board: '#c6d9b4', cell: '#f3f6ea', cellAlt: '#e2ecd8', honey: '#f0c14e', piece: '#3f8a64', pivot: '#9fcf9a' };
const PALETTE = {
  lamp: '#ef9c5a',
  lampDeep: '#e5864f',
  sage: '#58ac82',
  sageDeep: '#3f8f68',
  stone: '#cdb9a0',
  wall: '#b98d68',
};
const BEAM_HEIGHT = 0.28;
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

/** The tray in the world's board color, with a rounded tile on every cell (kept to warm them where light passes). */
function makeTable(level, theme) {
  const group = new THREE.Group();
  const board = new THREE.Color(theme.board);
  const top = addShadowed(group, new THREE.Mesh(new RoundedBoxGeometry(level.width + 0.4, 0.4, level.height + 0.4, 5, 0.2), mat(board)));
  top.position.y = -0.2;
  const ledge = new THREE.Mesh(new RoundedBoxGeometry(level.width + 0.48, 0.3, level.height + 0.48, 5, 0.2), mat(board.clone().multiplyScalar(0.82)));
  ledge.position.y = -0.34;
  group.add(ledge);
  const plates = [];
  const plateShape = new RoundedBoxGeometry(0.84, 0.1, 0.84, 4, 0.05);
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const color = new THREE.Color((x + y) % 2 ? theme.cellAlt : theme.cell);
      const plate = new THREE.Mesh(plateShape, mat(color, { roughness: 0.9 }));
      plate.position.copy(place(level, x, y)).setY(0.02);
      plate.receiveShadow = true;
      group.add(plate);
      plates.push({ mesh: plate, color, lit: color.clone().lerp(new THREE.Color(theme.honey), 0.32) });
    }
  }
  return { group, plates };
}

/** A mirror on its pivot: a wooden puck (or a square plate when fixed) with an upright silver panel. */
function makeMirror(tile, environment, theme) {
  const group = new THREE.Group();
  const isFixed = tile.locked;
  const base = addShadowed(
    group,
    new THREE.Mesh(
      isFixed ? new RoundedBoxGeometry(0.8, 0.08, 0.8, 2, 0.03) : new THREE.CylinderGeometry(0.36, 0.38, 0.08, 32),
      mat(isFixed ? PALETTE.stone : new THREE.Color(theme.pivot).lerp(new THREE.Color(theme.cell), 0.45)),
    ),
  );
  base.position.y = 0.06;
  const rotor = new THREE.Group();
  rotor.position.y = 0.1;
  const isSplitter = tile.type === TILE.SPLITTER;
  const frame = addShadowed(
    rotor,
    new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.44, 0.12, 3, 0.04), mat(isSplitter ? '#17988c' : theme.piece, { roughness: 0.55 })),
  );
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

/** The lamp: a chunky orange block like the flat lamp tile, with a glowing lens in the beam's color facing its way. */
function makeLamp(tile) {
  const group = new THREE.Group();
  const head = new THREE.Group();
  head.rotation.y = DIRECTION_ANGLE[tile.dir] ?? 0;
  const body = addShadowed(head, new THREE.Mesh(new RoundedBoxGeometry(0.74, 0.46, 0.74, 5, 0.17), mat(PALETTE.lamp, { roughness: 0.6 })));
  body.position.y = 0.25;
  const cap = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.06, 0.62, 3, 0.03), mat('#f6c08a', { roughness: 0.6 }));
  cap.position.y = 0.48;
  head.add(cap);
  // The lens on the side the light leaves from, ringed in white.
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 32), mat('#fffaf0', { roughness: 0.4 }));
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.06, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun).multiplyScalar(1.15), toneMapped: false }),
  );
  for (const [mesh, x] of [
    [ring, 0.37],
    [lens, 0.39],
  ]) {
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, BEAM_HEIGHT, 0);
    head.add(mesh);
  }
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
  const gem = addShadowed(group, new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), material));
  gem.scale.set(1, 1.3, 1);
  gem.position.y = 0.42;
  return { group, gem, material, color };
}

function makeWall() {
  const group = new THREE.Group();
  const block = addShadowed(group, new THREE.Mesh(new RoundedBoxGeometry(0.84, 0.5, 0.84, 4, 0.14), mat(PALETTE.wall)));
  block.position.y = 0.25;
  return { group };
}

/** Anything not drawn yet in the prototype: a plain marker so the board still reads. */
function makePlaceholder() {
  const group = new THREE.Group();
  addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 6), mat('#bfae96'))).position.y = 0.1;
  return { group };
}

function makePiece(tile, environment, theme) {
  switch (tile.type) {
    case TILE.MIRROR:
    case TILE.SPLITTER:
      return makeMirror(tile, environment, theme);
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

/** A beam between two cell centres: a bright core inside two soft halos (added light, so it glows without bloom). */
function makeBeam(level, segment) {
  const from = place(level, segment.x1, segment.y1).setY(BEAM_HEIGHT);
  const to = place(level, segment.x2, segment.y2).setY(BEAM_HEIGHT);
  const length = from.distanceTo(to) + 0.06;
  const group = new THREE.Group();
  const color = new THREE.Color(BEAM_COLORS[segment.color] ?? BEAM_COLORS.sun);
  const layers = [
    { radius: 0.13, color, opacity: 0.22 },
    { radius: 0.065, color, opacity: 0.85 },
    { radius: 0.028, color: new THREE.Color('#fffdf2'), opacity: 1 },
  ];
  for (const layer of layers) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(layer.radius, layer.radius, length, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    mesh.rotation.z = Math.PI / 2;
    group.add(mesh);
  }
  // A small pool of light on the table under the beam.
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(length, 0.5),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.03 - BEAM_HEIGHT;
  group.add(pool);
  group.position.copy(from).lerp(to, 0.5);
  group.rotation.y = -Math.atan2(to.z - from.z, to.x - from.x);
  return group;
}

/**
 * Build the scene on a canvas.
 * @returns { update(orients, trace), resize(width, height), render(), dispose() }
 */
export function createBoardScene(canvas, level, { tilt = 0.62, theme = DEFAULT_THEME } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // No filmic tone mapping: it washes out the game's soft colors; the lights are set so colors read true.
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.15;

  scene.add(new THREE.HemisphereLight('#fffaf0', '#c9b597', 1.55));
  const sun = new THREE.DirectionalLight('#fff4e0', 1.25);
  const size = Math.max(level.width, level.height);
  sun.position.set(-size * 0.6, size * 1.4, -size * 0.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -size;
  sun.shadow.camera.right = sun.shadow.camera.top = size;
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const table = makeTable(level, theme);
  scene.add(table.group);
  const pieces = level.tiles.map((tile) => {
    const piece = makePiece(tile, environment, theme);
    piece.group.position.copy(place(level, tile.x, tile.y));
    scene.add(piece.group);
    return piece;
  });
  const beams = new THREE.Group();
  scene.add(beams);

  // Looking down at the table: `tilt` from straight down (0) towards the player, `yaw` turns around the table,
  // `zoom` above 1 comes closer. The player can turn and zoom (setView); reset brings back the start view.
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const START_VIEW = { yaw: 0, tilt, zoom: 1 };
  const view = { ...START_VIEW };
  let aspect = 1;
  const fitCamera = () => {
    camera.aspect = aspect;
    const span = (Math.max(level.width / aspect, level.height) + 1.3) / 2;
    const distance = span / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / view.zoom;
    const ground = Math.sin(view.tilt) * distance;
    camera.position.set(Math.sin(view.yaw) * ground, Math.cos(view.tilt) * distance, Math.cos(view.yaw) * ground);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };
  /** Change the view (any of yaw, tilt, zoom), kept within comfortable limits. Returns the view now. */
  const setView = (change) => {
    if (change.yaw !== undefined) view.yaw = change.yaw;
    if (change.tilt !== undefined) view.tilt = THREE.MathUtils.clamp(change.tilt, 0.12, 1.05);
    if (change.zoom !== undefined) view.zoom = THREE.MathUtils.clamp(change.zoom, 0.7, 2.2);
    fitCamera();
    return { ...view };
  };
  const resetView = () => setView(START_VIEW);

  // Mirrors swing smoothly to their new angle; lit gems turn slowly and bob.
  const rotorTargets = level.tiles.map(() => 0);
  const litGems = new Set();
  const update = (turns, trace) => {
    level.tiles.forEach((tile, i) => {
      const piece = pieces[i];
      if (piece.rotor) rotorTargets[i] = -THREE.MathUtils.degToRad(-45 + (turns[i] ?? 0) * 90);
      if (piece.gem) {
        const isLit = trace.litGems.has(i);
        if (isLit) litGems.add(i);
        else litGems.delete(i);
        piece.material.emissiveIntensity = isLit ? 0.6 : 0;
        piece.material.color.copy(isLit ? piece.color : piece.color.clone().lerp(new THREE.Color('#b9ab98'), 0.35));
      }
    });
    beams.clear();
    for (const segment of trace.segments) beams.add(makeBeam(level, segment));
    // Tiles the light passes over warm to honey, as on the flat board.
    const litCells = cellsOnBeams(trace.segments, level.width, level.height);
    table.plates.forEach((plate, cell) => plate.mesh.material.color.copy(litCells.has(cell) ? plate.lit : plate.color));
  };
  let isFirstUpdate = true;
  /** Advance the animations by `dt` seconds (0 jumps straight to the end). Returns true while anything still moves. */
  const tick = (dt, time = 0, calm = false) => {
    let isMoving = false;
    pieces.forEach((piece, i) => {
      if (piece.rotor) {
        const gap = rotorTargets[i] - piece.rotor.rotation.y;
        if (Math.abs(gap) > 0.001 && !isFirstUpdate && dt > 0) {
          piece.rotor.rotation.y += gap * Math.min(1, dt * 14);
          isMoving = true;
        } else piece.rotor.rotation.y = rotorTargets[i];
      }
      if (piece.gem && !calm) {
        const isLit = litGems.has(i);
        piece.gem.rotation.y += dt * (isLit ? 1.6 : 0.3);
        piece.gem.position.y = 0.42 + (isLit ? Math.sin(time * 2.4 + i) * 0.04 : 0);
      }
    });
    isFirstUpdate = false;
    return isMoving;
  };

  /** Each cell's box on screen (pixels from the canvas's top left), for placing the tap targets over the pieces. */
  const cellRects = (width, height) => {
    const rects = [];
    const corner = new THREE.Vector3();
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const centre = place(level, x, y);
        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bottom = -Infinity;
        for (const [dx, dz] of [
          [-0.5, -0.5],
          [0.5, -0.5],
          [-0.5, 0.5],
          [0.5, 0.5],
        ]) {
          corner.set(centre.x + dx, 0.15, centre.z + dz).project(camera);
          const px = ((corner.x + 1) / 2) * width;
          const py = ((1 - corner.y) / 2) * height;
          left = Math.min(left, px);
          right = Math.max(right, px);
          top = Math.min(top, py);
          bottom = Math.max(bottom, py);
        }
        // Turned boards make the boxes overlap: keep a smaller box around the cell's centre.
        const shrink = 0.72;
        const w = (right - left) * shrink;
        const h = (bottom - top) * shrink;
        rects.push({ left: (left + right) / 2 - w / 2, top: (top + bottom) / 2 - h / 2, width: w, height: h });
      }
    }
    return rects;
  };

  /** The cell under a point on the canvas (pixels), or -1: a ray from the camera to the table. */
  const raycaster = new THREE.Raycaster();
  const tableTop = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.05);
  const cellAt = (px, py, width, height) => {
    raycaster.setFromCamera(new THREE.Vector2((px / width) * 2 - 1, 1 - (py / height) * 2), camera);
    const hit = raycaster.ray.intersectPlane(tableTop, new THREE.Vector3());
    if (!hit) return -1;
    const x = Math.floor(hit.x + level.width / 2);
    const y = Math.floor(hit.z + level.height / 2);
    return x >= 0 && y >= 0 && x < level.width && y < level.height ? y * level.width + x : -1;
  };

  const resize = (width, height) => {
    renderer.setSize(width, height, false);
    aspect = width / height;
    fitCamera();
  };

  return {
    update,
    tick,
    cellRects,
    cellAt,
    setView,
    resetView,
    getView: () => ({ ...view }),
    resize,
    render: () => renderer.render(scene, camera),
    dispose: () => {
      renderer.dispose();
      pmrem.dispose();
    },
  };
}
