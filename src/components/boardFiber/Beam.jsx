import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { BEAM_COLORS, BEAM_HEIGHT, cellPosition, glowing } from './look.js';

/**
 * A light beam between two cell centres (design guide: "Light beam — travels, reflects and bends"): a white-hot
 * core inside a golden glow (both bright enough to bloom), fading in when it appears, with a pulse of light
 * travelling the way the light goes.
 */
export default function Beam({ level, segment, calm }) {
  const group = useRef();
  const pulse = useRef();
  const from = useMemo(() => new THREE.Vector3(...cellPosition(level, segment.x1, segment.y1)).setY(BEAM_HEIGHT), [level, segment]);
  const to = useMemo(() => new THREE.Vector3(...cellPosition(level, segment.x2, segment.y2)).setY(BEAM_HEIGHT), [level, segment]);
  const length = from.distanceTo(to) + 0.05;
  const middle = from.clone().lerp(to, 0.5);
  const angle = -Math.atan2(to.z - from.z, to.x - from.x);
  const color = BEAM_COLORS[segment.color] ?? BEAM_COLORS.sun;

  useEffect(() => {
    if (calm) return;
    gsap.fromTo(group.current.scale, { y: 0.2, z: 0.2 }, { y: 1, z: 1, duration: 0.25, ease: 'power2.out' });
  }, [calm]);

  useFrame(({ clock }) => {
    if (calm || !pulse.current) return;
    const along = (clock.elapsedTime * (1.6 / length)) % 1;
    pulse.current.position.lerpVectors(from, to, along);
  });

  return (
    <>
      <group ref={group} position={middle} rotation={[0, angle, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.085, 0.085, length, 16, 1, true]} />
          <meshBasicMaterial color={glowing(color, 2)} toneMapped={false} transparent opacity={0.55} depthWrite={false} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, length, 12]} />
          <meshBasicMaterial color={glowing('#fffbe8', 4.68)} toneMapped={false} />
        </mesh>
      </group>
      {!calm && (
        <mesh ref={pulse} position={from}>
          <sphereGeometry args={[0.08, 16, 12]} />
          <meshBasicMaterial color={glowing('#ffffff', 5.76)} toneMapped={false} />
        </mesh>
      )}
    </>
  );
}
