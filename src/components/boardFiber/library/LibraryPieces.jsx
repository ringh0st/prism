/*
 * The Library theme's pieces (owner's pick): a green banker's lamp for the light, brass mirrors on a gear wheel
 * (they turn) or bolted to a wooden plinth (they don't), and stacks of old books as walls. Mirrors swing a quarter
 * turn with a springy GSAP ease and their gear turns with them; a turning lamp sits on its own gear.
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
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
        <RoundMirror knob={false} postsFrom={-0.14} />
        <mesh position={[0, 0.31, 0]}>
          <sphereGeometry args={[0.03, 12, 10]} />
          {brassM('#e8c06a')}
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

export function Book({ w = 0.55, d = 0.4, h = 0.09, color, rot = 0, y = 0 }) {
  return (
    <group position={[0, y + h / 2, 0]} rotation={[0, rot, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0.012, 0, 0]}>
        <boxGeometry args={[w - 0.03, h - 0.025, d + 0.004]} />
        <meshStandardMaterial color="#f6ecd6" roughness={0.9} />
      </mesh>
      <mesh position={[-w / 2 - 0.001, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d * 0.7, h * 0.18]} />
        <meshStandardMaterial color="#e5c06a" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** A wall: a tall leaning stack of old books. */
export function BookStack() {
  return (
    <group>
      {['#7a3b33', '#3f6b4c', '#a36b2a', '#2f5f73', '#5a3b5c'].map((c, k) => (
        <Book key={k} w={0.7 - k * 0.04} d={0.52 - k * 0.02} h={0.1} color={c} rot={(k % 2 ? 1 : -1) * 0.12 * k} y={k * 0.1} />
      ))}
    </group>
  );
}
