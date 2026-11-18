import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cellPosition } from '../look.js';
import { chosenSunColor, isDefaultSun } from '../../../lib/beamStyle.js';
import { POOL, SHAFT, glow } from './shared.jsx';

const TINT = { sun: '#ffe2a8', coral: '#ff9a86', lime: '#c4f0a0', sky: '#a8dcf6' };
const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide };

/** Dust specks drifting slowly through the shaft, the way the light goes (still for reduced motion). */
function Motes({ from, to, calm }) {
  const ref = useRef([]);
  const count = Math.max(2, Math.round(from.distanceTo(to) * 10));
  const seeds = useMemo(() => Array.from({ length: count }, (_, k) => [k / count, Math.sin(k * 9.1) * 0.06, Math.cos(k * 5.3) * 0.06]), [count]);
  useFrame(({ clock }) =>
    ref.current.forEach((mesh, k) => {
      if (!mesh) return;
      const along = calm ? seeds[k][0] : (seeds[k][0] + clock.elapsedTime * 0.05) % 1;
      mesh.position.lerpVectors(from, to, along);
      mesh.position.y += seeds[k][1] + (calm ? 0 : Math.sin(clock.elapsedTime * 0.8 + k) * 0.02);
      mesh.position.z += seeds[k][2];
    }),
  );
  return seeds.map((_, k) => (
    <mesh key={k} ref={(mesh) => (ref.current[k] = mesh)}>
      <sphereGeometry args={[0.008, 6, 4]} />
      <meshBasicMaterial color={glow('#fff3d6', 2.2)} toneMapped={false} transparent opacity={0.8} />
    </mesh>
  ));
}

/**
 * A natural beam of lamplight between two cells: a soft shaft with feathered edges and a thin bright core, dust
 * drifting in it, and the warm pool it casts on the floor beneath.
 */
export default function NaturalBeam({ level, segment, height, floorY, calm }) {
  const from = useMemo(() => new THREE.Vector3(...cellPosition(level, segment.x1, segment.y1)).setY(height), [level, segment, height]);
  const to = useMemo(() => new THREE.Vector3(...cellPosition(level, segment.x2, segment.y2)).setY(height), [level, segment, height]);
  const length = from.distanceTo(to);
  const middle = from.clone().lerp(to, 0.5);
  const angle = -Math.atan2(to.z - from.z, to.x - from.x);
  // Plain sunlight wears the player's chosen beam style, clearly (only a touch softened); the default stays lamplight.
  const tint = useMemo(() => {
    if ((segment.color ?? 'sun') !== 'sun') return TINT[segment.color] ?? TINT.sun;
    const chosen = chosenSunColor();
    return isDefaultSun(chosen) ? TINT.sun : `#${new THREE.Color(chosen).lerp(new THREE.Color('#ffffff'), 0.12).getHexString()}`;
  }, [segment.color]);
  // The bright core takes a little of the color too, so a colored beam never reads as plain white-yellow.
  const core = useMemo(() => new THREE.Color(tint).lerp(new THREE.Color('#ffffff'), 0.55), [tint]);
  return (
    <group>
      <group position={middle} rotation={[0, angle, 0]}>
        {[0, Math.PI / 2].map((roll) => (
          <mesh key={roll} rotation={[roll, 0, 0]}>
            <planeGeometry args={[length, 0.34]} />
            <meshBasicMaterial map={SHAFT} color={glow(tint, 1.45)} opacity={0.95} {...ADD} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, length, 8]} />
          <meshBasicMaterial color={core.clone().multiplyScalar(2.2)} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[middle.x, floorY, middle.z]} rotation={[-Math.PI / 2, 0, -angle]}>
        <planeGeometry args={[length + 0.4, 0.95]} />
        <meshBasicMaterial map={POOL} color={tint} opacity={0.85} {...ADD} />
      </mesh>
      <Motes from={from} to={to} calm={calm} />
    </group>
  );
}
