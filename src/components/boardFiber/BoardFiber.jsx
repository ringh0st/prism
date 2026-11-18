import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';
import { cellsOnBeams } from '../../game/beam.js';
import { TILE } from '../../game/constants.js';
import { FLOORS, cellPosition } from './look.js';
import Tray from './Tray.jsx';
import LibraryScene from './library/LibraryScene.jsx';
import { ROOM_HEIGHT, ROOM_PAD } from './library/LibraryRoom.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import Piece from './Piece.jsx';
import Beam from './Beam.jsx';
import { Cloud } from './Detailed.jsx';
import styles from './BoardFiber.module.css';

const prefersCalm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/** A pointer that moved less than this (pixels) between press and release was a tap, not a drag. */
const TAP_SLOP = 8;
/** How far the camera starts tilted from straight above (radians). */
const START_TILT = 0.62;

/** Turn, tilt and zoom with the finger or mouse (three's OrbitControls), the whole table always in reach. */
function Controls({ level, resetKey, room = null }) {
  const { camera, gl, size: frame } = useThree();
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl]);
  useEffect(() => {
    Object.assign(controls, {
      enablePan: false,
      enableDamping: true,
      dampingFactor: 0.12,
      minPolarAngle: 0.05,
      maxPolarAngle: 1.15,
      rotateSpeed: 0.7,
    });
    const size = Math.max(level.width, level.height);
    controls.minDistance = size * 0.9;
    controls.maxDistance = size * 3.2;
    return () => controls.dispose();
  }, [controls, level]);
  useEffect(() => {
    // Start (and reset) looking down at the table, tilted towards the player, far enough to see all of it.
    const size = Math.max(level.width, level.height);
    let distance = size * 2.35;
    const place = () => {
      camera.position.set(0, Math.cos(START_TILT) * distance, Math.sin(START_TILT) * distance);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
    };
    place();
    // A themed room is a little model that must sit whole inside the frame: step back until every corner fits.
    if (room) {
      const corner = new THREE.Vector3();
      const fits = () =>
        [-1, 1].every((sx) =>
          [-1, 1].every((sz) =>
            [-room.depth, room.height].every((y) => {
              corner.set((sx * room.width) / 2, y, (sz * room.length) / 2).project(camera);
              return Math.abs(corner.x) < 0.97 && Math.abs(corner.y) < 0.97;
            }),
          ),
        );
      camera.updateProjectionMatrix();
      while (!fits() && distance < size * 6) {
        distance += 0.25;
        place();
      }
      controls.maxDistance = Math.max(controls.maxDistance, distance * 1.2);
    }
    controls.target.set(0, 0, 0);
    controls.update();
  }, [camera, controls, level, resetKey, room, frame.width, frame.height]);
  useFrame(() => controls.update());
  return null;
}

/** A soft studio room for glass and gloss to reflect (no image files: three's own room, made once). */
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.3;
    return () => {
      scene.environment = null;
      environment.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Tell the board where each cell is on screen whenever the camera moves, so its buttons sit over the pieces. */
function Layout({ level, onLayout }) {
  const { camera, size } = useThree();
  const last = useRef('');
  useFrame(() => {
    const key = `${camera.matrixWorld.elements.map((n) => n.toFixed(4)).join()}|${size.width}x${size.height}`;
    if (key === last.current) return;
    last.current = key;
    const point = new THREE.Vector3();
    const rects = [];
    for (let cell = 0; cell < level.width * level.height; cell++) {
      const [x, , z] = cellPosition(level, cell % level.width, Math.floor(cell / level.width));
      point.set(x, 0.2, z).project(camera);
      const cx = ((point.x + 1) / 2) * size.width;
      const cy = ((1 - point.y) / 2) * size.height;
      const span = (size.height / level.height) * 0.55;
      rects.push({ left: cx - span / 2, top: cy - span / 2, width: span, height: span });
    }
    onLayout?.(rects);
  });
  return null;
}

/**
 * The board drawn with React Three Fiber (a trial on one level): the same level, taps and rules as the flat and
 * three.js boards, with the design guide's elements, GSAP animation and a bloom pass that only the light passes.
 * The board's buttons stay over the pieces for the keyboard and screen readers.
 * @param state { turns, trace, turnsLeft, revealedCells, darkenedTile, glooms } (as Board3D)
 */
export default function BoardFiber({ level, theme: boardTheme, state, onLayout, onTapCell }) {
  const { t } = useI18n();
  const wrapper = useRef(null);
  const [theme, setTheme] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const calm = useMemo(prefersCalm, []);
  // Trial: a floor that contrasts with the warm pieces and the light (?floor=sage|stone|cocoa, sage by default).
  useEffect(() => {
    let floor = 'sage';
    try {
      floor = localStorage.getItem('prism.trialFloor') || floor;
    } catch {
      // Storage blocked: the default floor.
    }
    setTheme(FLOORS[floor] ?? FLOORS.sage);
  }, []);

  // The themed room's box, so the camera can frame all of it.
  const room = useMemo(
    () =>
      boardTheme === 'library' ? { width: level.width + ROOM_PAD * 2, length: level.height + ROOM_PAD * 2, height: ROOM_HEIGHT, depth: 0.5 } : null,
    [boardTheme, level],
  );
  const { turns, trace, revealedCells, darkenedTile, lookHere } = state;
  const litCells = useMemo(() => cellsOnBeams(trace.segments, level.width, level.height), [trace, level]);
  const tap = (event, cell) => {
    event.stopPropagation();
    if (event.delta <= TAP_SLOP) onTapCell(cell);
  };

  return (
    <div ref={wrapper} className={styles.stage}>
      {/* A themed room shows through a rounded window, so zooming in never ends in a hard square edge. */}
      <div className={boardTheme ? styles.window : styles.open}>
        {theme && (
          <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ fov: 28, near: 0.1, far: 200 }}>
            <hemisphereLight args={boardTheme === 'library' ? ['#ffe6c4', '#3a2418', 0.65] : ['#fff6e4', '#a8744a', 0.75]} />
            <directionalLight
              position={[-6, 7, 4]}
              intensity={boardTheme === 'library' ? 1.1 : 1.7}
              color="#ffe2b0"
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0005}
            >
              <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 0.1, 30]} />
            </directionalLight>
            <Studio />
            <Controls level={level} resetKey={resetKey} room={room} />
            <Layout level={level} onLayout={onLayout} />
            {boardTheme === 'library' ? (
              <LibraryScene level={level} turns={turns} trace={trace} litCells={litCells} calm={calm} onTap={tap} />
            ) : (
              <>
                <Tray level={level} theme={theme} litCells={litCells} hintCells={lookHere} calm={calm} onTileClick={tap} />
                {level.tiles.map((tile, i) => {
                  const cell = tile.y * level.width + tile.x;
                  const isHidden = tile.fog && revealedCells !== null && !revealedCells.has(cell);
                  return (
                    <group key={i} position={cellPosition(level, tile.x, tile.y)} onClick={(event) => tap(event, cell)}>
                      {isHidden ? (
                        <Cloud calm={calm} />
                      ) : (
                        <Piece
                          tile={tile}
                          turn={turns[i] ?? 0}
                          isLit={trace.litGems.has(i) || trace.litShades.has(i)}
                          isDarkened={darkenedTile === i && tile.type === TILE.GEM}
                          calm={calm}
                        />
                      )}
                    </group>
                  );
                })}
                {trace.segments.map((segment, i) => (
                  <Beam
                    key={`${segment.x1},${segment.y1},${segment.x2},${segment.y2},${segment.color},${i}`}
                    level={level}
                    segment={segment}
                    calm={calm}
                  />
                ))}
              </>
            )}
            <EffectComposer multisampling={4}>
              <Bloom mipmapBlur luminanceThreshold={1.5} luminanceSmoothing={0.1} intensity={0.6} radius={0.7} />
            </EffectComposer>
          </Canvas>
        )}
      </div>
      <button type="button" className={styles.reset} onClick={() => setResetKey((n) => n + 1)} aria-label={t('board.view.reset')}>
        ⟲
      </button>
    </div>
  );
}
