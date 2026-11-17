import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BEAM_HEIGHT, facetedBlock, glowing } from './look.js';

const DIRECTION_ANGLE = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 };

/**
 * The light source as a fire lamp: a little brass oil lamp on a honey plinth with a dancing flame, and a shiny
 * curved reflector behind the flame that throws its light one way (that is the way the beam leaves). The flame
 * flickers gently; a turning lamp swings its reflector round.
 */
export default function FireLamp({ tile, turn, calm }) {
  const flame = useRef();
  const inner = useRef();
  const head = useRef();
  const plinth = useMemo(() => facetedBlock(0.56, 0.56, 0.08, 0.14, 0.02), []);
  const bowl = useMemo(() => {
    const outline = [
      [0.001, 0],
      [0.1, 0.0],
      [0.19, 0.06],
      [0.21, 0.13],
      [0.17, 0.15],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(outline, 32);
  }, []);
  const reflector = useMemo(() => new THREE.SphereGeometry(0.19, 32, 16, Math.PI * 0.5, Math.PI, Math.PI * 0.15, Math.PI * 0.55), []);
  const angle = (DIRECTION_ANGLE[tile.dir] ?? 0) - (tile.turnable ? (turn % 2) * (Math.PI / 2) : 0);

  useFrame(({ clock }, dt) => {
    // The head eases to its way; the flame flickers (stills for reduced motion).
    head.current.rotation.y += (angle - head.current.rotation.y) * Math.min(1, dt * 10);
    if (calm) return;
    const t = clock.elapsedTime;
    const flicker = 1 + Math.sin(t * 13) * 0.06 + Math.sin(t * 7.3) * 0.05;
    flame.current.scale.set(1 + Math.sin(t * 9) * 0.05, flicker, 1 + Math.cos(t * 11) * 0.05);
    flame.current.rotation.z = Math.sin(t * 5) * 0.06;
    inner.current.scale.setScalar(0.95 + Math.sin(t * 17) * 0.05);
  });

  const brass = <meshPhysicalMaterial color="#d9a441" metalness={0.65} roughness={0.28} clearcoat={0.7} />;
  return (
    <group>
      <mesh geometry={plinth} position={[0, 0.17, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={tile.turnable ? '#e9b44c' : '#f6c85a'} roughness={0.7} flatShading />
      </mesh>
      <mesh geometry={bowl} position={[0, 0.25, 0]} castShadow>
        {brass}
      </mesh>
      <group ref={head} rotation={[0, angle, 0]}>
        {/* The reflector: a shiny half-dish behind the flame, open towards the way the light goes. */}
        <mesh geometry={reflector} position={[-0.1, 0.52, 0]} rotation={[0, Math.PI, 0]} castShadow>
          <meshPhysicalMaterial
            color="#ffe3a0"
            metalness={0.35}
            roughness={0.2}
            clearcoat={1}
            emissive="#ffcf6b"
            emissiveIntensity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0.2, BEAM_HEIGHT, 0]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshBasicMaterial color={glowing('#fffbe8', 5)} toneMapped={false} />
        </mesh>
      </group>
      {/* The flame: an outer orange tongue, an inner yellow one and a white-hot heart. */}
      <group ref={flame} position={[0, 0.56, 0]} scale={1.9}>
        <mesh position={[0, 0.08, 0]}>
          <coneGeometry args={[0.09, 0.32, 16]} />
          <meshBasicMaterial color={glowing('#ff6a2b', 1.6)} toneMapped={false} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <sphereGeometry args={[0.09, 16, 12]} />
          <meshBasicMaterial color={glowing('#ff6a2b', 1.6)} toneMapped={false} transparent opacity={0.9} />
        </mesh>
        <group ref={inner}>
          <mesh position={[0, 0.04, 0]}>
            <coneGeometry args={[0.055, 0.2, 16]} />
            <meshBasicMaterial color={glowing('#ffe066', 3)} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <meshBasicMaterial color={glowing('#fffbe8', 4.5)} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
