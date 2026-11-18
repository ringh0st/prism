/*
 * The Pond the board sits in, as a little model: a grassy bank with rounded corners, a sandy shore, calm jade water,
 * lily pads as the tiles you tap (light warms them), and reeds and stones along two edges.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { GroundShadow, roundedSlab } from '../themes/shared.jsx';

export const POND_PAD = 0.95;
export const POND_HEIGHT = 1.25;
const BASE_DEPTH = 0.42;
const PAD_GREENS = ['#7fb86a', '#6aa85e', '#8cc276'];

/** A lily pad: a round leaf with a notch, turned differently on every tile. */
function padGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.absarc(0, 0, 0.46, 0.22, Math.PI * 2 - 0.22, false);
  shape.lineTo(0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 28 });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}
let padShape = null;

export function LilyPad({ position, x, y, isLit, onClick, cell }) {
  padShape ??= padGeometry();
  return (
    <group position={position}>
      {/* The whole cell takes the tap, not only the leaf. */}
      <mesh userData={{ cell }} onClick={onClick} position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.98, 0.98]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh geometry={padShape} rotation={[0, ((x * 7 + y * 13) % 12) * 0.52, 0]} receiveShadow castShadow onClick={onClick}>
        <meshStandardMaterial color={PAD_GREENS[(x * 2 + y * 3) % PAD_GREENS.length]} roughness={0.65} emissive="#ffb24a" emissiveIntensity={isLit ? 0.2 : 0} />
      </mesh>
    </group>
  );
}

/** A clump of reeds with cattail heads. */
function Reeds({ position, seed = 0 }) {
  return (
    <group position={position}>
      {[0, 1, 2, 3, 4].map((k) => {
        const height = 0.7 + ((k * 3 + seed) % 4) * 0.14;
        const lean = (((k * 5 + seed) % 5) - 2) * 0.05;
        return (
          <group key={k} position={[(k - 2) * 0.09, 0, ((k * 7 + seed) % 3) * 0.06]} rotation={[lean, 0, lean]}>
            <mesh position={[0, height / 2, 0]} castShadow>
              <cylinderGeometry args={[0.012, 0.018, height, 6]} />
              <meshStandardMaterial color="#5f8f4e" roughness={0.8} />
            </mesh>
            {k % 2 === 0 && (
              <mesh position={[0, height + 0.02, 0]} castShadow>
                <capsuleGeometry args={[0.032, 0.14, 4, 10]} />
                <meshStandardMaterial color="#6b4630" roughness={0.9} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

const Stone = ({ position, size = 0.16 }) => (
  <mesh position={position} scale={[1, 0.55, 0.8]} castShadow receiveShadow>
    <icosahedronGeometry args={[size, 1]} />
    <meshStandardMaterial color="#a9a79a" roughness={0.9} flatShading />
  </mesh>
);

export function PondRoom({ level }) {
  const width = level.width + POND_PAD * 2;
  const depth = level.height + POND_PAD * 2;
  const bank = useMemo(() => roundedSlab(width, depth, BASE_DEPTH, 0.5), [width, depth]);
  const shore = useMemo(() => roundedSlab(level.width + 0.8, level.height + 0.8, 0.04, 0.4), [level]);
  const water = useMemo(() => roundedSlab(level.width + 0.5, level.height + 0.5, 0.04, 0.32), [level]);
  const back = -(level.height / 2 + 0.66);
  const side = -(level.width / 2 + 0.66);
  return (
    <group>
      <GroundShadow width={width} depth={depth} y={-BASE_DEPTH - 0.1} />
      <mesh geometry={bank} position={[0, -0.02, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#8fbf7a" roughness={0.95} />
      </mesh>
      <mesh geometry={shore} position={[0, 0.0, 0]} receiveShadow>
        <meshStandardMaterial color="#e0cfa2" roughness={1} />
      </mesh>
      <mesh geometry={water} position={[0, 0.012, 0]} receiveShadow>
        <meshPhysicalMaterial color="#63b3a1" roughness={0.08} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      <Reeds position={[-level.width / 2 + 0.3, 0, back]} seed={1} />
      <Reeds position={[level.width / 2 - 0.9, 0, back]} seed={4} />
      <Reeds position={[side, 0, -level.height / 2 + 1]} seed={2} />
      <Stone position={[0.4, 0.05, back]} />
      <Stone position={[side, 0.04, 0.9]} size={0.13} />
      <Stone position={[level.width / 2 + 0.62, 0.04, level.height / 2 - 0.4]} size={0.12} />
    </group>
  );
}
