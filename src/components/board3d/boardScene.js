/*
 * The 3D board: the same level drawn as a little tabletop in the flat board's own look (the world's board color
 * as the tray, rounded tiles in its two cell colors that warm to honey where light passes, pieces as chunky toys
 * from boardPieces.js with soft shadows; only the light glows). It only draws: the game logic is unchanged.
 * The camera turns all the way round, tilts and zooms (setView) and always fits the whole table on screen.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { cellsOnBeams, isRotatable } from '../../game/beam.js';
import { FRAGILE_TURNS } from '../../game/constants.js';
import { BEAM_HEIGHT, BEAM_HEX, addShadowed, darkenedColor, glowSprite, makeFog, makePiece, mat } from './boardPieces.js';
import { TILE } from '../../game/constants.js';

/** The flat board's colors (Board3D reads the world's own from its CSS; these are World 1's). */
export const DEFAULT_THEME = { board: '#c6d9b4', cell: '#f3f6ea', cellAlt: '#e2ecd8', honey: '#f0c14e', piece: '#3f8a64', pivot: '#9fcf9a' };

/** Cell (x, y) to the table's coordinates: x to the right, z towards the player. */
/** Pieces that turn the light: a beam that ends on one flashes there. */
const TURNING_TILES = new Set([TILE.MIRROR, TILE.SPLITTER, TILE.PRISM, TILE.PORTAL]);

const place = (level, x, y) => new THREE.Vector3(x - level.width / 2 + 0.5, 0, y - level.height / 2 + 0.5);

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
      plate.userData.cell = y * level.width + x;
      group.add(plate);
      plates.push({ mesh: plate, color, lit: color.clone().lerp(new THREE.Color(theme.honey), 0.32) });
    }
  }
  return { group, plates };
}

/**
 * A beam between two cell centres: a bright white core inside golden light, with a pool of its light on the
 * tiles and little sparks travelling the way the light goes (the scene moves them). Returns { group, sparks }.
 */
function makeBeam(level, segment) {
  const from = place(level, segment.x1, segment.y1).setY(BEAM_HEIGHT);
  const to = place(level, segment.x2, segment.y2).setY(BEAM_HEIGHT);
  const length = from.distanceTo(to) + 0.06;
  const group = new THREE.Group();
  const color = new THREE.Color(BEAM_HEX[segment.color] ?? BEAM_HEX.sun);
  const tube = new THREE.Group();
  const layers = [
    { radius: 0.15, color, opacity: 0.2 },
    { radius: 0.075, color, opacity: 0.9 },
    { radius: 0.032, color: new THREE.Color('#ffffff'), opacity: 1 },
  ];
  for (const layer of layers) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(layer.radius, layer.radius, length, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: layer.opacity, depthWrite: false }),
    );
    mesh.rotation.z = Math.PI / 2;
    tube.add(mesh);
  }
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(length, 0.5),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.03 - BEAM_HEIGHT;
  tube.add(pool);
  tube.position.copy(from).lerp(to, 0.5);
  tube.rotation.y = -Math.atan2(to.z - from.z, to.x - from.x);
  group.add(tube);
  // Sparks: about two per cell, spaced evenly, moving from the lamp's side to the far end.
  const sparks = [];
  const count = Math.max(1, Math.round(length * 1.6));
  for (let n = 0; n < count; n++) {
    const sprite = glowSprite(color.clone().lerp(new THREE.Color('#ffffff'), 0.6), 0.16, 0.95);
    group.add(sprite);
    sparks.push({ sprite, phase: n / count });
  }
  return { group, sparks, from, to, length };
}

/** A creeping shadow's trail to its gem: dark footprints that fade further along. */
function makeTrail(level, cells) {
  const group = new THREE.Group();
  cells.forEach((cell, step) => {
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.09 + 0.02 * Math.max(0, 3 - step), 20),
      new THREE.MeshBasicMaterial({ color: '#4a3a30', transparent: true, opacity: Math.max(0.12, 0.55 - step * 0.06), depthWrite: false }),
    );
    dot.rotation.x = -Math.PI / 2;
    dot.position.copy(place(level, cell % level.width, Math.floor(cell / level.width))).setY(0.08);
    group.add(dot);
  });
  return group;
}

/**
 * Build the scene on a canvas.
 * @returns { update, tick, cellRects, cellAt, setView, resetView, getView, resize, render, dispose }
 */
export function createBoardScene(canvas, level, { tilt = 0.62, theme = DEFAULT_THEME } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
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
  const pieces = level.tiles.map((tile, i) => {
    const piece = makePiece(tile, { environment, theme, isRotatable: isRotatable(tile) });
    piece.group.position.copy(place(level, tile.x, tile.y));
    piece.group.userData.cell = tile.y * level.width + tile.x;
    piece.index = i;
    scene.add(piece.group);
    // Fog hides a piece until light reaches its cell.
    if (tile.fog) {
      piece.fog = makeFog();
      piece.fog.position.copy(piece.group.position);
      piece.fog.userData.cell = piece.group.userData.cell;
      scene.add(piece.fog);
    }
    return piece;
  });
  const beams = new THREE.Group();
  const trails = new THREE.Group();
  scene.add(beams, trails);

  // The camera: `tilt` from straight down (0) towards the player, `yaw` all the way round the table, `zoom` above 1
  // comes closer. At zoom 1 the whole table always fits, at any angle.
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
  const START_VIEW = { yaw: 0, tilt, zoom: 1 };
  const view = { ...START_VIEW };
  let aspect = 1;
  const halfW = level.width / 2 + 0.25;
  const halfH = level.height / 2 + 0.25;
  const tableCorners = [-1, 1].flatMap((sx) => [-1, 1].flatMap((sz) => [0.55, -0.5].map((y) => new THREE.Vector3(sx * halfW, y, sz * halfH))));
  const aim = (distance) => {
    const ground = Math.sin(view.tilt) * distance;
    camera.position.set(Math.sin(view.yaw) * ground, Math.cos(view.tilt) * distance, Math.cos(view.yaw) * ground);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  };
  const fitCamera = () => {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    // Move back until every corner of the table is on screen with a little room, then apply the zoom.
    let distance = Math.max(level.width, level.height) * 2.5;
    const point = new THREE.Vector3();
    for (let pass = 0; pass < 4; pass++) {
      aim(distance);
      let reach = 0;
      for (const corner of tableCorners) {
        point.copy(corner).project(camera);
        reach = Math.max(reach, Math.abs(point.x), Math.abs(point.y));
      }
      distance *= reach / 0.94;
    }
    aim(distance / view.zoom);
    camera.updateProjectionMatrix();
  };
  /** Change the view (any of yaw, tilt, zoom), kept within comfortable limits. Returns the view now. */
  const setView = (change) => {
    if (change.yaw !== undefined) view.yaw = change.yaw;
    if (change.tilt !== undefined) view.tilt = THREE.MathUtils.clamp(change.tilt, 0.05, 1.1);
    if (change.zoom !== undefined) view.zoom = THREE.MathUtils.clamp(change.zoom, 1, 2.6);
    fitCamera();
    return { ...view };
  };
  const resetView = () => setView(START_VIEW);

  // Mirrors and turning lamps swing smoothly to their new angle; lit gems turn slowly and bob.
  const rotorTargets = level.tiles.map(() => 0);
  const litGems = new Set();
  /**
   * Show the board now.
   * @param state { turns, trace, turnsLeft, revealedCells, darkenedTile, glooms }
   */
  const tileIndexAt = new Map(level.tiles.map((tile, i) => [tile.y * level.width + tile.x, i]));
  const tileAt = (x, y) => (x >= 0 && y >= 0 && x < level.width && y < level.height ? level.tiles[tileIndexAt.get(y * level.width + x)] : null);
  let beamParts = [];
  const bursts = [];
  /** A gem that just lit: a ring of little sparkles flying out of it. */
  const burstAt = (piece) => {
    for (let n = 0; n < 10; n++) {
      const sprite = glowSprite(piece.color.clone().lerp(new THREE.Color('#ffffff'), 0.5), 0.14, 1);
      const angle = (n / 10) * Math.PI * 2;
      sprite.position.copy(piece.group.position).setY(0.45);
      scene.add(sprite);
      bursts.push({ sprite, velocity: new THREE.Vector3(Math.cos(angle), 0.6 + (n % 3) * 0.3, Math.sin(angle)).multiplyScalar(0.9), age: 0 });
    }
  };
  const update = ({ turns, trace, turnsLeft = null, revealedCells = null, darkenedTile = null, glooms = [] }) => {
    level.tiles.forEach((tile, i) => {
      const piece = pieces[i];
      const turn = turns[i] ?? 0;
      if (piece.rotor) rotorTargets[i] = -THREE.MathUtils.degToRad(-45 + turn * 90);
      if (piece.lampHead && tile.turnable) rotorTargets[i] = piece.baseAngle - (turn % 2) * (Math.PI / 2);
      if (piece.gem) {
        const isLit = trace.litGems.has(i);
        if (isLit && !litGems.has(i) && !isFirstTick) {
          burstAt(piece);
          piece.litAt = performance.now() / 1000;
        }
        if (isLit) litGems.add(i);
        else litGems.delete(i);
        const isDarkened = darkenedTile === i;
        piece.material.emissiveIntensity = isLit ? 0.55 : 0;
        piece.gemGlow.material.opacity = isLit ? 0.8 : 0;
        piece.material.color.copy(isDarkened ? darkenedColor : isLit ? piece.color : piece.color.clone().lerp(new THREE.Color('#b9ab98'), 0.35));
      }
      if (piece.shadeMaterial) piece.shadeMaterial.emissiveIntensity = trace.litShades.has(i) ? 0.9 : 0;
      if (piece.switchMaterial) piece.switchMaterial.emissiveIntensity = trace.litSwitches?.has(i) ? 0.7 : 0;
      if (piece.door) piece.door.userData.target = trace.openGates?.has(tile.pair) ? -0.48 : 0;
      if (piece.crackDots) {
        const left = turnsLeft?.[i] ?? FRAGILE_TURNS;
        piece.crackDots.forEach((dot, n) => dot.material.color.set(n < left ? '#F2A67E' : '#cbbfb2'));
      }
      if (piece.fog) {
        const isHidden = revealedCells !== null && !revealedCells.has(piece.group.userData.cell);
        piece.fog.visible = isHidden;
        piece.group.visible = !isHidden;
      }
    });
    beams.clear();
    beamParts = trace.segments.map((segment) => {
      const beam = makeBeam(level, segment);
      beams.add(beam.group);
      // Where the light turns (a mirror, splitter, prism or portal) it flashes; where something stops it, it fades out.
      const endTile = tileAt(segment.x2, segment.y2);
      const turns = endTile && TURNING_TILES.has(endTile.type);
      const flash = glowSprite(beam.group.children[0].children[1].material.color, turns ? 0.55 : 0.3, turns ? 0.9 : 0.35);
      flash.position.copy(beam.to);
      beams.add(flash);
      return { ...beam, flash, turns };
    });
    trails.clear();
    for (const gloom of glooms) if (!gloom.isBurned) trails.add(makeTrail(level, gloom.trail.slice(1)));
    // Tiles the light passes over warm to honey, as on the flat board.
    const litCells = cellsOnBeams(trace.segments, level.width, level.height);
    table.plates.forEach((plate, cell) => plate.mesh.material.color.copy(litCells.has(cell) ? plate.lit : plate.color));
  };

  let isFirstTick = true;
  /** Advance the animations by `dt` seconds. Returns true while anything still moves. */
  const tick = (dt, time = 0, calm = false) => {
    let isMoving = false;
    const ease = (current, target) => {
      const gap = target - current;
      if (isFirstTick || Math.abs(gap) < 0.001) return target;
      isMoving = true;
      return current + gap * Math.min(1, dt * 14);
    };
    pieces.forEach((piece, i) => {
      if (piece.rotor) piece.rotor.rotation.y = ease(piece.rotor.rotation.y, rotorTargets[i]);
      if (piece.lampHead && level.tiles[i].turnable) piece.lampHead.rotation.y = ease(piece.lampHead.rotation.y, rotorTargets[i]);
      if (piece.door) piece.door.position.y = ease(piece.door.position.y, piece.door.userData.target ?? 0);
      if (calm) return;
      if (piece.gem) {
        const isLit = litGems.has(i);
        piece.gem.rotation.y += dt * (isLit ? 1.6 : 0.3);
        piece.gem.position.y = 0.42 + (isLit ? Math.sin(time * 2.4 + i) * 0.04 : 0);
      }
      if (piece.swirl) piece.swirl.rotation.z += dt * 0.8;
      if (piece.stone) piece.stone.rotation.y += dt * 0.4;
    });
    // Sparks run along each beam in the light's direction; flashes at mirrors and the lamp's glow breathe.
    for (const beam of beamParts) {
      beam.sparks.forEach((spark) => {
        const along = calm ? spark.phase : (spark.phase + time * (1.4 / beam.length)) % 1;
        spark.sprite.position.copy(beam.from).lerp(beam.to, along);
        spark.sprite.material.opacity = calm ? 0.7 : Math.sin(along * Math.PI) * 0.95;
      });
      if (beam.turns && !calm) beam.flash.scale.setScalar(0.55 + Math.sin(time * 6) * 0.08);
    }
    pieces.forEach((piece, i) => {
      if (piece.lampGlow && !calm) piece.lampGlow.material.opacity = 0.7 + Math.sin(time * 3 + i) * 0.2;
      if (piece.gemGlow && litGems.has(i) && !calm) {
        // A brief swell as the gem fills with light, then a gentle shimmer.
        const since = time - (piece.litAt ?? -10);
        const swell = since < 0.6 ? 1 + Math.sin((since / 0.6) * Math.PI) * 0.7 : 1;
        piece.gemGlow.scale.setScalar(0.9 * swell + Math.sin(time * 3 + i) * 0.04);
      }
    });
    for (let n = bursts.length - 1; n >= 0; n--) {
      const burst = bursts[n];
      burst.age += dt;
      burst.sprite.position.addScaledVector(burst.velocity, dt);
      burst.velocity.y -= dt * 1.5;
      burst.sprite.material.opacity = Math.max(0, 1 - burst.age / 0.7);
      if (burst.age > 0.7 || calm) {
        scene.remove(burst.sprite);
        burst.sprite.material.dispose();
        bursts.splice(n, 1);
      } else isMoving = true;
    }
    isFirstTick = false;
    return isMoving;
  };

  /** Each cell's box on screen (pixels from the canvas's top left), for placing the buttons over the pieces. */
  const cellRects = (width, height) => {
    const rects = [];
    const point = new THREE.Vector3();
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
          point.set(centre.x + dx, 0.15, centre.z + dz).project(camera);
          const px = ((point.x + 1) / 2) * width;
          const py = ((1 - point.y) / 2) * height;
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

  /** The cell under a point on the canvas (pixels), or -1: the first piece or tile the ray from the camera meets. */
  const raycaster = new THREE.Raycaster();
  const targets = [table.group, ...pieces.map((piece) => piece.group), ...pieces.filter((piece) => piece.fog).map((piece) => piece.fog)];
  const cellAt = (px, py, width, height) => {
    raycaster.setFromCamera(new THREE.Vector2((px / width) * 2 - 1, 1 - (py / height) * 2), camera);
    for (const hit of raycaster.intersectObjects(targets, true)) {
      let cell;
      let isShown = true;
      for (let node = hit.object; node; node = node.parent) {
        isShown &&= node.visible;
        cell ??= node.userData.cell;
      }
      if (isShown && cell !== undefined) return cell;
    }
    return -1;
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
