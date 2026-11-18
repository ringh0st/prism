/*
 * The later worlds' pieces, drawn once for every theme (each theme still brings its own mirrors, lamp, walls and
 * floor): shadow crystals, portals, prisms, light gates and switches, voids and fog, plus the marks that ride on a
 * theme's own mirrors (twins, cracking, one-sided). Pairs keep their color and shape: a = a honey diamond, b = a
 * peach ball, so color is never the only clue.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FACE_NORMALS } from '../../../game/beam.js';
import { FRAGILE_TURNS } from '../../../game/constants.js';
import { glow } from './shared.jsx';

const PAIRS = { a: { color: '#f0c14e', shape: 'diamond' }, b: { color: '#f2a67e', shape: 'ball' } };
const pairOf = (name) => PAIRS[name] ?? PAIRS.a;

/** A pair's shape as a small 3D mark. */
function PairMark({ pair, size = 0.07, lit = false }) {
  const { color, shape } = pairOf(pair);
  const material = <meshStandardMaterial color={color} emissive={color} emissiveIntensity={lit ? 1.2 : 0.35} roughness={0.4} />;
  return shape === 'ball' ? (
    <mesh>
      <sphereGeometry args={[size, 14, 10]} />
      {material}
    </mesh>
  ) : (
    <mesh scale={[1, 1.35, 1]}>
      <octahedronGeometry args={[size, 0]} />
      {material}
    </mesh>
  );
}

/** A shadow crystal: dark shards that must stay out of the light; lit, they flare an angry red. */
export function ShadowCrystal({ isLit }) {
  const shards = [
    [0, 0.5, 0, 0, 0.15],
    [0.14, 0.34, 0.06, -0.4, 0.1],
    [-0.13, 0.3, -0.05, 0.45, 0.1],
    [0.02, 0.26, 0.15, 0.2, 0.08],
  ];
  return (
    <group>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#2a2030" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {shards.map(([x, height, z, lean, radius], k) => (
        <mesh key={k} position={[x, height / 2, z]} rotation={[0, k, lean]} castShadow>
          <coneGeometry args={[radius, height, 5]} />
          <meshStandardMaterial color="#3a2d42" roughness={0.35} flatShading emissive="#ff3b30" emissiveIntensity={isLit ? 0.9 : 0} />
        </mesh>
      ))}
    </group>
  );
}

/** A portal: a glowing ring lying over a swirl, in its pair's color with the pair's shape floating in it. */
export function Portal({ tile, calm }) {
  const swirl = useRef();
  const { color } = pairOf(tile.pair);
  useFrame((_, dt) => {
    if (!calm) swirl.current.rotation.z += dt * 0.9;
  });
  return (
    <group>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.34, 0.06, 12, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.4} />
      </mesh>
      <mesh ref={swirl} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.3, 24, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial color={glow(color, 1.6)} transparent opacity={0.6} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, 0.3, 0]}>
        <PairMark pair={tile.pair} size={0.09} lit />
      </group>
    </group>
  );
}

/** A prism crystal: a clear three-sided crystal on a little base; light splits out to both sides. */
export function PrismCrystal() {
  return (
    <group>
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.33, 0.08, 6]} />
        <meshStandardMaterial color="#d9c8a4" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.58, 3]} />
        <meshPhysicalMaterial color="#f2fbff" roughness={0.03} clearcoat={1} transparent opacity={0.55} iridescence={1} emissive="#cfe9ff" emissiveIntensity={0.35} />
      </mesh>
      {['#ff7a68', '#ffcf4a', '#63b6ee'].map((color, k) => (
        <mesh key={color} position={[0, 0.2 + k * 0.18, 0]}>
          <cylinderGeometry args={[0.265, 0.265, 0.03, 3]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** A light gate: bars between two posts in its pair's color, a wall until its switch is lit; then the bars drop. */
export function LightGate({ tile, isOpen }) {
  const { color } = pairOf(tile.pair);
  return (
    <group>
      {[-0.42, 0.42].flatMap((x) =>
        [-0.42, 0.42].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.3, z]} castShadow>
            <boxGeometry args={[0.12, 0.6, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        )),
      )}
      <group position={[0, isOpen ? -0.42 : 0, 0]}>
        {[-0.21, 0, 0.21].flatMap((offset) => [
          <mesh key={`x${offset}`} position={[offset, 0.3, 0]} castShadow>
            <boxGeometry args={[0.07, 0.56, 0.84]} />
            <meshStandardMaterial color="#5a4d5e" roughness={0.5} metalness={0.4} transparent opacity={isOpen ? 0.25 : 1} />
          </mesh>,
          <mesh key={`z${offset}`} position={[0, 0.3, offset]} castShadow>
            <boxGeometry args={[0.84, 0.56, 0.07]} />
            <meshStandardMaterial color="#5a4d5e" roughness={0.5} metalness={0.4} transparent opacity={isOpen ? 0.25 : 1} />
          </mesh>,
        ])}
      </group>
      <group position={[0, 0.74, 0]}>
        <PairMark pair={tile.pair} size={0.09} lit={isOpen} />
      </group>
    </group>
  );
}

/** A light switch: a round button in its pair's color that glows when light hits it. */
export function LightSwitch({ tile, isLit }) {
  const { color } = pairOf(tile.pair);
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.38, 0.1, 24]} />
        <meshStandardMaterial color="#7d748a" roughness={0.7} />
      </mesh>
      <mesh position={[0, isLit ? 0.11 : 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.26, 0.1, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isLit ? 1.4 : 0.15} roughness={0.4} />
      </mesh>
      <group position={[0, 0.34, 0]}>
        <PairMark pair={tile.pair} lit={isLit} />
      </group>
    </group>
  );
}

/** A void: a dark ball that swallows light in its own square and the four beside it (the dark cross shows where). */
export function VoidHole({ calm }) {
  const ball = useRef();
  useFrame(({ clock }) => {
    if (!calm) ball.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.6) * 0.05);
  });
  return (
    <group>
      {[
        [3, 1],
        [1, 3],
      ].map(([w, d]) => (
        <mesh key={w} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w * 0.96, d * 0.96]} />
          <meshBasicMaterial color="#1c1424" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={ball} position={[0, 0.32, 0]} castShadow>
        <sphereGeometry args={[0.28, 24, 18]} />
        <meshStandardMaterial color="#1c1424" roughness={0.3} emissive="#5a3d7a" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.38, 0.025, 8, 32]} />
        <meshBasicMaterial color="#8a6bb0" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/** Fog: a soft cloud hiding what stands on the square until light touches it. */
export function FogCloud({ calm }) {
  const group = useRef();
  const puffs = useMemo(
    () => [
      [0, 0.08, 0, 0.21],
      [-0.17, 0.03, 0.05, 0.16],
      [0.18, 0.04, -0.03, 0.17],
      [0.06, 0.2, 0.02, 0.14],
      [-0.08, 0.16, -0.06, 0.13],
      [0.02, 0, 0.18, 0.14],
      [-0.04, 0, -0.18, 0.14],
      [0.28, -0.02, 0.08, 0.11],
      [-0.28, -0.02, -0.04, 0.11],
    ],
    [],
  );
  useFrame(({ clock }) => {
    if (!calm) group.current.position.y = 0.36 + Math.sin(clock.elapsedTime * 1.3) * 0.025;
  });
  return (
    <group ref={group} position={[0, 0.36, 0]}>
      {puffs.map(([x, y, z, radius], n) => (
        <mesh key={n} position={[x, y, z]} scale={[1, 0.82, 1]} castShadow>
          <sphereGeometry args={[radius, 20, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.95} emissive="#f6f3ff" emissiveIntensity={0.22} />
        </mesh>
      ))}
    </group>
  );
}

/** Twin mirrors turn together: each wears its pair's shape on a little stalk above it. */
export function TwinMark({ link }) {
  return (
    <group position={[0, 1.02, 0]}>
      <PairMark pair={link} size={0.085} lit />
    </group>
  );
}

/** A cracking mirror: one pip for every turn it has left; when none are left it is cracked and stays put. */
export function CrackPips({ turnsLeft }) {
  const left = turnsLeft ?? FRAGILE_TURNS;
  return (
    <group position={[0, 1, 0]}>
      {Array.from({ length: FRAGILE_TURNS }, (_, k) => (
        <mesh key={k} position={[(k - (FRAGILE_TURNS - 1) / 2) * 0.13, 0, 0]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color={k < left ? '#fffbe8' : '#5a4d5e'} emissive="#fff3c4" emissiveIntensity={k < left ? 0.9 : 0} />
        </mesh>
      ))}
      {left === 0 && (
        <mesh position={[0, -0.42, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.03, 0.5, 0.4]} />
          <meshBasicMaterial color="#3a2d42" />
        </mesh>
      )}
    </group>
  );
}

/**
 * A one-sided mirror: a dark plate covers its back, the side that stops the light. `orient` is the mirror's
 * current state; the plate stands just behind the glass, on the far side from the silvered face.
 */
export function DarkBack({ tile, orient }) {
  const [nx, ny] = FACE_NORMALS[orient % 2][tile.oneSided];
  const length = Math.hypot(nx, ny);
  const [bx, bz] = [-nx / length, -ny / length];
  return (
    <mesh position={[bx * 0.045, 0.56, bz * 0.045]} rotation={[0, Math.atan2(bx, bz), 0]}>
      <circleGeometry args={[0.3, 28]} />
      <meshStandardMaterial color="#2f2a35" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** A square the hint asks you to look at: a soft honey glow that breathes (still for reduced motion). */
export function HintGlow({ position, calm }) {
  const material = useRef();
  useFrame(({ clock }) => {
    material.current.opacity = calm ? 0.4 : 0.28 + 0.2 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 3.5));
  });
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshBasicMaterial ref={material} color="#f7d47a" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}

/** The Lens helper's preview: a faint dotted line along the solved light path. */
export function GhostPath({ from, to }) {
  const dots = Math.max(2, Math.round(from.distanceTo(to) * 4));
  return Array.from({ length: dots }, (_, k) => (
    <mesh key={k} position={from.clone().lerp(to, (k + 0.5) / dots)}>
      <sphereGeometry args={[0.04, 8, 6]} />
      <meshBasicMaterial color="#fff3c4" transparent opacity={0.75} />
    </mesh>
  ));
}
