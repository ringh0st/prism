/*
 * The Pond theme's pieces: a lantern on a dock post for the light, mirrors in dark-wood rings that turn on a wooden
 * cog wheel (or stand on a mossy stone when they can't), clear amber glass in the same ring for splitters, and piles
 * of logs as walls. Turning pieces swing a quarter turn with a springy GSAP ease, their cog with them.
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { DIRECTION_ANGLE, RoundMirror, mirrorAngle } from '../library/LibraryPieces.jsx';
import { Gear, brassM, glow, lath, mirrorM } from '../themes/shared.jsx';

const BARK = '#6b4a32';
const WOOD = '#a8774a';
const woodM = (color = '#5b3d28') => <meshStandardMaterial color={color} roughness={0.7} />;
/** A splitter's pane: clear amber glass you can see through (light passes and bounces). */
const amberGlass = (
  <meshPhysicalMaterial color="#ffd98a" roughness={0.05} clearcoat={1} transparent opacity={0.42} emissive="#ffc35a" emissiveIntensity={0.25} side={THREE.DoubleSide} />
);

/** A piece that turns: on a floating wooden cog wheel, swinging with it. */
function OnCog({ turn, children }) {
  const rotor = useRef();
  const angle = mirrorAngle(turn);
  useEffect(() => {
    gsap.to(rotor.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.7)' });
  }, [angle]);
  return (
    <group ref={rotor} rotation={[0, angle, 0]}>
      <Gear r={0.33} teeth={12} h={0.06} color={WOOD} metalness={0} roughness={0.75} />
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.11, 0.14, 24]} />
        <meshBasicMaterial color="#5a3f22" />
      </mesh>
      <group position={[0, 0.39, 0]}>{children}</group>
    </group>
  );
}

/** A piece that can't turn: standing on a mossy stone (no cog). */
function OnStone({ turn, children }) {
  return (
    <group rotation={[0, mirrorAngle(turn), 0]}>
      <mesh position={[0, 0.07, 0]} scale={[1, 0.42, 0.8]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color="#9a9a8c" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.04, 0.16, 0.02]} scale={[1, 0.25, 0.75]}>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshStandardMaterial color="#6f9a5a" roughness={1} flatShading />
      </mesh>
      <group position={[0, 0.44, 0]}>{children}</group>
    </group>
  );
}

export const PondMirror = ({ turn }) => (
  <OnCog turn={turn}>
    <RoundMirror frame={woodM} glass={mirrorM} />
  </OnCog>
);

export const PondFixedMirror = ({ turn }) => (
  <OnStone turn={turn}>
    <RoundMirror frame={woodM} glass={mirrorM} knob={false} postsFrom={-0.14} />
  </OnStone>
);

/** A splitter: the same ring with clear amber glass and a brass stud on top, so it never reads as a mirror. */
function SplitterPane(props) {
  return (
    <group>
      <RoundMirror frame={woodM} glass={amberGlass} streaks={false} {...props} />
      <mesh position={[0, 0.33, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.07, 0.07, 0.03]} />
        {brassM('#e8c06a')}
      </mesh>
    </group>
  );
}

export const PondSplitter = ({ turn }) => (
  <OnCog turn={turn}>
    <SplitterPane />
  </OnCog>
);

export const PondFixedSplitter = ({ turn }) => (
  <OnStone turn={turn}>
    <SplitterPane knob={false} postsFrom={-0.14} />
  </OnStone>
);

/** One log lying on its side: bark, with pale cut ends. */
function Log({ position, length = 0.72, radius = 0.13, turn = 0 }) {
  return (
    <group position={position} rotation={[0, turn, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, length, 14]} />
        <meshStandardMaterial color={BARK} roughness={0.9} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * length) / 2 + side * 0.002, 0, 0]} rotation={[0, (side * Math.PI) / 2, 0]}>
          <circleGeometry args={[radius * 0.86, 14]} />
          <meshStandardMaterial color="#e2c08f" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** A wall: a little pile of logs, with a mushroom growing on top. */
export function LogPile() {
  return (
    <group>
      <Log position={[0, 0.13, -0.15]} turn={0.06} />
      <Log position={[0, 0.13, 0.15]} turn={-0.05} />
      <Log position={[0, 0.36, 0]} length={0.64} turn={0.1} />
      <group position={[0.14, 0.49, 0.02]}>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 0.08, 8]} />
          <meshStandardMaterial color="#f4ead6" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.08, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.07, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d96a4f" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/** The lantern: a copper hood on an arm, shining the way the light leaves (local +x). */
function LanternBody() {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.07, 0.56, 10]} />
        <meshStandardMaterial color={BARK} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.05, 16]} />
        <meshStandardMaterial color={WOOD} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.065, 12, 10]} />
        {brassM('#c98a4a')}
      </mesh>
      <group position={[0.1, 0.44, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh
          geometry={lath(
            [
              [0.05, -0.1],
              [0.15, -0.06],
              [0.18, 0.08],
              [0.16, 0.12],
              [0.05, 0.12],
            ],
            32,
          )}
          castShadow
        >
          <meshPhysicalMaterial color="#c9824a" metalness={0.7} roughness={0.3} clearcoat={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.155, 32]} />
          <meshBasicMaterial color={glow('#fff0c8', 3)} toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[0.3, 0.44, 0]} color="#ffcf8a" intensity={2} distance={2.2} />
    </group>
  );
}

/** The light: a dock-post lantern facing the way its light leaves; a turning one stands on a cog and swings round. */
export function DockLantern({ tile, turn }) {
  const head = useRef();
  const angle = (DIRECTION_ANGLE[tile.dir] ?? 0) - (tile.turnable ? (turn % 2) * (Math.PI / 2) : 0);
  useEffect(() => {
    gsap.to(head.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.6)' });
  }, [angle]);
  return (
    <group ref={head} rotation={[0, angle, 0]}>
      {tile.turnable && <Gear r={0.34} teeth={12} h={0.06} color={WOOD} metalness={0} roughness={0.75} />}
      <group position={[0, tile.turnable ? 0.06 : 0, 0]}>
        <LanternBody />
      </group>
    </group>
  );
}
