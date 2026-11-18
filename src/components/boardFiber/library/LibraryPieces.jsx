/*
 * The Library theme's pieces (owner's pick): a green banker's lamp for the light, brass mirrors on a gear wheel
 * (they turn) or bolted to a wooden plinth (they don't), and bookcases that join up as walls. Mirrors swing a quarter
 * turn with a springy GSAP ease and their gear turns with them; a turning lamp sits on its own gear.
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { TILE } from '../../../game/constants.js';
import { Gear, Streaks, brassM, glow, lath, mirrorM } from '../themes/shared.jsx';

export const DIRECTION_ANGLE = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 };
/** The game's mirror angle for a turn count (the pane faces along local z). */
export const mirrorAngle = (turn) => -THREE.MathUtils.degToRad(-45 + turn * 90);

/**
 * The round mirror itself: glass in a ring, on two posts with knobs. `frame` paints the ring and posts (brass here,
 * dark wood at the pond) and `glass` the pane (a mirror, or clear amber glass for a splitter).
 */
export function RoundMirror({ postsFrom = -0.16, knob = true, frame = brassM, glass = mirrorM, streaks = true }) {
  return (
    <group>
      <mesh>
        <torusGeometry args={[0.29, 0.02, 10, 40]} />
        {frame()}
      </mesh>
      <mesh>
        <circleGeometry args={[0.26, 40]} />
        {glass}
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, postsFrom, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.36, 8]} />
          {frame()}
        </mesh>
      ))}
      {knob &&
        [-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <sphereGeometry args={[0.03, 12, 10]} />
            {frame('#e8c06a')}
          </mesh>
        ))}
      {streaks && <Streaks w={0.45} h={0.38} />}
    </group>
  );
}

/** A mirror that turns: the brass mirror on a gear wheel; mirror and gear swing together. */
export function GearMirror({ turn }) {
  const rotor = useRef();
  const angle = mirrorAngle(turn);
  useEffect(() => {
    gsap.to(rotor.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.7)' });
  }, [angle]);
  return (
    <group ref={rotor} rotation={[0, angle, 0]}>
      <Gear r={0.32} teeth={14} h={0.05} />
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.13, 24]} />
        <meshBasicMaterial color="#5a3f22" />
      </mesh>
      <group position={[0, 0.38, 0]}>
        <RoundMirror />
      </group>
    </group>
  );
}

/** A fixed mirror's frame: dark iron, so it never reads as one of the brass mirrors that turn. */
const ironFrame = () => <meshStandardMaterial color="#3d3836" metalness={0.6} roughness={0.4} />;

/** A mirror that can't turn: the same brass mirror bolted to a heavy wooden plinth with brass corners (no gear). */
export function FixedMirror({ turn }) {
  return (
    <group rotation={[0, mirrorAngle(turn), 0]}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.12, 0.42]} />
        <meshStandardMaterial color="#5e3a26" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.135, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.03, 0.34]} />
        <meshStandardMaterial color="#6f4630" roughness={0.55} />
      </mesh>
      {[
        [-0.25, -0.18],
        [0.25, -0.18],
        [-0.25, 0.18],
        [0.25, 0.18],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.06, z]}>
          <boxGeometry args={[0.07, 0.13, 0.07]} />
          {brassM()}
        </mesh>
      ))}
      <group position={[0, 0.42, 0]}>
        <RoundMirror knob={false} postsFrom={-0.14} frame={ironFrame} />
        <mesh position={[0, 0.31, 0]}>
          <sphereGeometry args={[0.03, 12, 10]} />
          {ironFrame()}
        </mesh>
      </group>
    </group>
  );
}

function BankerLampBody() {
  return (
    <group>
      <mesh
        geometry={lath(
          [
            [0.001, 0],
            [0.2, 0],
            [0.21, 0.03],
            [0.16, 0.06],
            [0.001, 0.06],
          ],
          40,
        )}
        castShadow
      >
        {brassM()}
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.022, 0.03, 0.34, 12]} />
        {brassM()}
      </mesh>
      <mesh position={[0.04, 0.4, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.018, 0.018, 0.14, 10]} />
        {brassM()}
      </mesh>
      <group position={[0.12, 0.44, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh
          geometry={lath(
            [
              [0.06, -0.12],
              [0.16, -0.07],
              [0.19, 0.08],
              [0.17, 0.12],
              [0.05, 0.12],
            ],
            40,
          )}
          castShadow
        >
          <meshPhysicalMaterial color="#2f6e57" roughness={0.15} clearcoat={1} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.165, 32]} />
          <meshBasicMaterial color={glow('#fff0c8', 3)} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0.02, 0.18, 0.05]}>
        <cylinderGeometry args={[0.006, 0.006, 0.14, 6]} />
        {brassM()}
      </mesh>
      <mesh position={[0.02, 0.1, 0.05]}>
        <sphereGeometry args={[0.018, 10, 8]} />
        {brassM('#e8c06a')}
      </mesh>
      <pointLight position={[0.3, 0.44, 0]} color="#ffcf8a" intensity={2.4} distance={2.4} />
    </group>
  );
}

/** The light: a banker's lamp facing the way its light leaves; a turning lamp stands on a gear and swings round. */
export function BankerLamp({ tile, turn }) {
  const head = useRef();
  const angle = (DIRECTION_ANGLE[tile.dir] ?? 0) - (tile.turnable ? (turn % 2) * (Math.PI / 2) : 0);
  useEffect(() => {
    gsap.to(head.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.6)' });
  }, [angle]);
  return (
    <group ref={head} rotation={[0, angle, 0]}>
      {tile.turnable && <Gear r={0.34} teeth={16} h={0.05} color="#b98a3c" />}
      <group position={[0, tile.turnable ? 0.05 : 0, 0]}>
        <BankerLampBody />
      </group>
    </group>
  );
}

const spineTextures = new Map();

/** A bookcase front painted on a canvas: a dark wood frame and two shelves packed with colored book spines. */
function spinesTexture(seed) {
  if (spineTextures.has(seed)) return spineTextures.get(seed);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const d = canvas.getContext('2d');
  let r = seed * 9301 + 49297;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const colors = ['#7a3b33', '#2f5f73', '#3f6b4c', '#a36b2a', '#5a3b5c', '#c49a4a', '#8a4a3a', '#2e4a3a', '#b5503f', '#3d5a80'];
  d.fillStyle = '#5a3a26';
  d.fillRect(0, 0, 256, 256);
  [
    [14, 118],
    [138, 242],
  ].forEach(([top, bottom]) => {
    d.fillStyle = '#2e1c12';
    d.fillRect(12, top, 232, bottom - top);
    let x = 14;
    while (x < 236) {
      const width = 14 + rnd() * 16;
      const height = (bottom - top) * (0.72 + rnd() * 0.26);
      d.fillStyle = colors[Math.floor(rnd() * colors.length)];
      d.fillRect(x, bottom - height, Math.min(width, 242 - x) - 2, height);
      // A gold band and a lit edge on each spine.
      d.fillStyle = 'rgba(232,192,106,0.9)';
      d.fillRect(x + 2, bottom - height * 0.78, Math.min(width, 242 - x) - 6, 3);
      d.fillStyle = 'rgba(255,255,255,0.18)';
      d.fillRect(x, bottom - height, 2, height);
      x += width;
    }
    d.fillStyle = '#7d5136';
    d.fillRect(8, bottom, 240, 9);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  spineTextures.set(seed, texture);
  return texture;
}

const CASE_HEIGHT = 0.62;
/** The four sides of a cell: the step to the neighbor on the board, and how the side's face is placed and turned. */
const SIDES = [
  { step: [1, 0], position: [0.502, 0], turn: Math.PI / 2 },
  { step: [-1, 0], position: [-0.502, 0], turn: -Math.PI / 2 },
  { step: [0, 1], position: [0, 0.502], turn: 0 },
  { step: [0, -1], position: [0, -0.502], turn: Math.PI },
];

/**
 * A wall: a bookcase that fills its whole square, so bookcases on neighboring squares join into one long run of
 * shelves. Books show on every side that faces the open floor (never between two joined cases).
 */
export function BookcaseWall({ tile, level }) {
  const isWall = (x, y) => level.tiles.some((other) => other.type === TILE.WALL && other.x === x && other.y === y);
  const open = SIDES.filter(({ step }) => !isWall(tile.x + step[0], tile.y + step[1]));
  return (
    <group>
      <mesh position={[0, CASE_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, CASE_HEIGHT, 1]} />
        <meshStandardMaterial color="#6b4430" roughness={0.75} />
      </mesh>
      {open.map(({ position, turn }, side) => (
        <mesh key={turn} position={[position[0], CASE_HEIGHT / 2, position[1]]} rotation={[0, turn, 0]}>
          <planeGeometry args={[1, CASE_HEIGHT]} />
          <meshStandardMaterial map={spinesTexture(1 + ((tile.x * 3 + tile.y * 5 + side) % 5))} roughness={0.7} />
        </mesh>
      ))}
      {/* A lighter top board with a book left lying on it. */}
      <mesh position={[0, CASE_HEIGHT + 0.015, 0]} castShadow>
        <boxGeometry args={[1, 0.03, 1]} />
        <meshStandardMaterial color="#7d5136" roughness={0.7} />
      </mesh>
      <mesh position={[0.12, CASE_HEIGHT + 0.065, -0.08]} rotation={[0, ((tile.x + tile.y) % 5) * 0.4, 0]} castShadow>
        <boxGeometry args={[0.42, 0.07, 0.3]} />
        <meshStandardMaterial color={['#b5503f', '#3d5a80', '#3f6b4c'][(tile.x + tile.y * 2) % 3]} roughness={0.75} />
      </mesh>
    </group>
  );
}
