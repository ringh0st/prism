import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { glow } from './shared.jsx';

/** A small flame: an orange tongue with a yellow heart; it flickers gently (still for reduced motion). */
export default function Flame({ calm }) {
  const flame = useRef();
  useFrame(({ clock }) => {
    if (calm) return;
    const t = clock.elapsedTime;
    flame.current.scale.set(1 + Math.sin(t * 9) * 0.06, 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.05, 1 + Math.cos(t * 11) * 0.06);
    flame.current.rotation.z = Math.sin(t * 5) * 0.07;
  });
  return (
    <group ref={flame} userData={{ live: true }}>
      <mesh position={[0, 0.075, 0]}>
        <coneGeometry args={[0.04, 0.13, 12]} />
        <meshBasicMaterial color={glow('#ff8a3a', 1.8)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.04, 12, 10]} />
        <meshBasicMaterial color={glow('#ff8a3a', 1.8)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.035, 0]} scale={[0.55, 1, 0.55]}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshBasicMaterial color={glow('#fff3c0', 3.2)} toneMapped={false} />
      </mesh>
    </group>
  );
}
