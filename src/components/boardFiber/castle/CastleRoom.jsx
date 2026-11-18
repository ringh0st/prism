/*
 * The Castle courtyard the board sits in, as a little model: a green lawn with rounded corners, pale lilac flagstones
 * as the tiles you tap (light warms them), and low battlements with two bright-roofed towers along the back and side
 * (a fairy-tale castle, not a grey one).
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { GroundShadow, roundedSlab } from '../themes/shared.jsx';

export const CASTLE_PAD = 0.95;
export const CASTLE_HEIGHT = 1.7;
const BASE_DEPTH = 0.42;
const LAWN = '#9ccb86';
const STONE = '#ddd3e6';
const WALL = '#c9bdd6';

/** A flagstone: two soft greys in a checker; warmed by torchlight when light passes over it. */
export function Flagstone({ position, x, y, isLit, onClick, cell }) {
  return (
    <mesh position={position} receiveShadow castShadow userData={{ cell }} onClick={onClick}>
      <boxGeometry args={[0.95, 0.08, 0.95]} />
      <meshStandardMaterial color={(x + y) % 2 ? '#ece9f3' : '#dcd7e8'} roughness={0.85} emissive="#ffb24a" emissiveIntensity={isLit ? 0.22 : 0} />
    </mesh>
  );
}

/** A stretch of low wall with battlements, `length` long, running along local x. */
function Battlement({ position, rotation, length }) {
  const merlons = Math.max(2, Math.round(length / 0.5));
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.4, 0.22]} />
        <meshStandardMaterial color={WALL} roughness={0.9} />
      </mesh>
      {Array.from({ length: merlons }, (_, k) => (
        <mesh key={k} position={[-length / 2 + (length / merlons) * (k + 0.5), 0.47, 0]} castShadow>
          <boxGeometry args={[(length / merlons) * 0.5, 0.14, 0.22]} />
          <meshStandardMaterial color={WALL} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** A round tower with a tiled roof and a little flag. */
function Tower({ position, roof = '#e8839a', flag = '#f0c14e' }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.3, 0.9, 16]} />
        <meshStandardMaterial color={STONE} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.93, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.3, 0.08, 16]} />
        <meshStandardMaterial color={WALL} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.34, 0.5, 16]} />
        <meshStandardMaterial color={roof} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.24, 6]} />
        <meshStandardMaterial color="#4a4038" />
      </mesh>
      <mesh position={[0.08, 1.61, 0]}>
        <planeGeometry args={[0.16, 0.1]} />
        <meshStandardMaterial color={flag} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function CastleRoom({ level }) {
  const width = level.width + CASTLE_PAD * 2;
  const depth = level.height + CASTLE_PAD * 2;
  const base = useMemo(() => roundedSlab(width, depth, BASE_DEPTH, 0.4), [width, depth]);
  const yard = useMemo(() => roundedSlab(level.width + 0.5, level.height + 0.5, 0.04, 0.12), [level]);
  const back = -(level.height / 2 + 0.66);
  const side = -(level.width / 2 + 0.66);
  return (
    <group>
      <GroundShadow width={width} depth={depth} y={-BASE_DEPTH - 0.1} />
      <mesh geometry={base} position={[0, -0.02, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={LAWN} roughness={0.95} />
      </mesh>
      <mesh geometry={yard} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#9a90ad" roughness={1} />
      </mesh>
      <Battlement position={[0.2, 0, back]} length={level.width - 0.4} />
      <Battlement position={[side, 0, 0.2]} rotation={[0, Math.PI / 2, 0]} length={level.height - 0.4} />
      <Tower position={[side, 0, back]} />
      <Tower position={[level.width / 2 + 0.5, 0, back]} roof="#5fc4b0" flag="#ff9d9d" />
    </group>
  );
}
