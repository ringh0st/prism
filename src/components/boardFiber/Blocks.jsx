import { useMemo } from 'react';
import * as THREE from 'three';
import { LOOK, facetedBlock, glowing } from './look.js';

/** A wall (design guide: "Blocker"): a soft stone block with a carved cross. */
export function Wall() {
  const block = useMemo(() => facetedBlock(0.8, 0.8, 0.5, 0.18, 0.05), []);
  return (
    <group position={[0, 0.17, 0]}>
      <mesh geometry={block} castShadow receiveShadow>
        <meshStandardMaterial color={LOOK.stone} roughness={0.75} flatShading />
      </mesh>
      {[1, -1].map((tilt) => (
        <mesh key={tilt} position={[0, 0.505, 0]} rotation={[-Math.PI / 2, 0, (tilt * Math.PI) / 4]}>
          <planeGeometry args={[0.5, 0.08]} />
          <meshStandardMaterial color={LOOK.stoneDeep} />
        </mesh>
      ))}
    </group>
  );
}

/** A shadow crystal: a dark stone that must stay out of the light (it flares red when lit). */
export function ShadeCrystal({ isLit }) {
  return (
    <mesh position={[0, 0.5, 0]} castShadow>
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshPhysicalMaterial
        color={LOOK.shade}
        roughness={0.35}
        clearcoat={0.6}
        flatShading
        emissive={isLit ? '#ff4433' : '#000000'}
        emissiveIntensity={isLit ? 1.2 : 0}
      />
    </mesh>
  );
}

/** Fog: a soft cloud over a cell until light reaches it. */
export function Fog() {
  return (
    <group position={[0, 0.35, 0]}>
      {[
        [0, 0, 0.3],
        [-0.2, 0.06, 0.2],
        [0.2, 0.05, 0.22],
      ].map(([x, z, r]) => (
        <mesh key={x} position={[x, 0, z]} scale={[1, 0.7, 1]} castShadow>
          <sphereGeometry args={[r, 20, 12]} />
          <meshStandardMaterial color="#fbf7ef" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** A piece without its own design yet: a plain marker so the board still reads. */
export function Marker() {
  return (
    <mesh position={[0, 0.3, 0]} castShadow>
      <cylinderGeometry args={[0.28, 0.3, 0.2, 6]} />
      <meshStandardMaterial color={new THREE.Color(LOOK.stone)} emissive={glowing('#000000')} />
    </mesh>
  );
}
