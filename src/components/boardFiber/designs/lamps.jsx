import { useMemo } from 'react';
import * as THREE from 'three';
import { LOOK, glowing } from '../look.js';

/** Where the light comes out, facing +x at beam height: a gold ring, a glowing lens and a white-hot centre. */
function Lens({ x, radius = 0.17 }) {
  return (
    <group position={[x, 0.36, 0]} rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow>
        <torusGeometry args={[radius, 0.035, 16, 48]} />
        <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.3} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <circleGeometry args={[radius * 0.95, 48]} />
        <meshBasicMaterial color={glowing('#ffd23f', 2.6)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[radius * 0.5, 40]} />
        <meshBasicMaterial color={glowing('#fffbe8', 5)} toneMapped={false} />
      </mesh>
    </group>
  );
}

const glossy = (color) => <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.2} />;

/** A: Lantern. A cream lantern with a gold cap and handle and a glowing glass heart, shining out of its round window. */
export function LampLantern() {
  return (
    <group>
      <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.32, 0.08, 40]} />
        {glossy(LOOK.coral)}
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.26, 0.36, 40]} />
        <meshPhysicalMaterial color={LOOK.cream} roughness={0.25} clearcoat={0.9} transmission={0.2} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.13, 24, 16]} />
        <meshBasicMaterial color={glowing('#ffd23f', 2.2)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <coneGeometry args={[0.3, 0.16, 40]} />
        {glossy(LOOK.coral)}
      </mesh>
      <mesh position={[0, 0.76, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.08, 0.022, 10, 32]} />
        <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.3} />
      </mesh>
      <Lens x={0.25} radius={0.12} />
    </group>
  );
}

/** B: Torch. A chunky coral torch lying on a cream cradle, honey grip rings, a big glowing lens at the end. */
export function LampTorch() {
  const body = useMemo(() => {
    const geometry = new THREE.CapsuleGeometry(0.17, 0.36, 8, 32);
    geometry.rotateZ(Math.PI / 2);
    return geometry;
  }, []);
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.08, 0.3]} />
        {glossy(LOOK.cream)}
      </mesh>
      <mesh geometry={body} position={[-0.06, 0.36, 0]} castShadow>
        {glossy(LOOK.coral)}
      </mesh>
      {[-0.2, -0.08].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.172, 0.018, 10, 40]} />
          {glossy(LOOK.butter)}
        </mesh>
      ))}
      <mesh position={[0.2, 0.36, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.17, 0.14, 40]} />
        {glossy(LOOK.coral)}
      </mesh>
      <Lens x={0.28} radius={0.2} />
    </group>
  );
}

/** C: Little lighthouse. A squat cream lighthouse with coral stripes, a glowing lamp room on top and a round window shining out. */
export function LampLighthouse() {
  return (
    <group>
      <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.34, 0.08, 40]} />
        {glossy(LOOK.sage)}
      </mesh>
      {[0, 1, 2].map((band) => (
        <mesh key={band} position={[0, 0.27 + band * 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.24 - band * 0.02, 0.26 - band * 0.02, 0.12, 40]} />
          {glossy(band % 2 ? LOOK.coral : LOOK.cream)}
        </mesh>
      ))}
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.14, 24]} />
        <meshBasicMaterial color={glowing('#ffd23f', 2)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <coneGeometry args={[0.2, 0.14, 32]} />
        {glossy(LOOK.coral)}
      </mesh>
      <Lens x={0.25} radius={0.1} />
    </group>
  );
}

/** D: Sun cup. A glowing little sun sitting in a coral cup with a cream petal collar, its light poured out of a gold spout. */
export function LampSunCup() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.26, 40]} />
        {glossy(LOOK.coral)}
      </mesh>
      {Array.from({ length: 8 }, (_, n) => (
        <mesh
          key={n}
          position={[Math.cos((n / 8) * Math.PI * 2) * 0.27, 0.45, Math.sin((n / 8) * Math.PI * 2) * 0.27]}
          rotation={[0, -(n / 8) * Math.PI * 2, 0.5]}
          castShadow
        >
          <sphereGeometry args={[0.08, 16, 10]} />
          {glossy(LOOK.cream)}
        </mesh>
      ))}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.2, 32, 20]} />
        <meshBasicMaterial color={glowing('#ffd23f', 2.4)} toneMapped={false} />
      </mesh>
      <mesh position={[0.3, 0.36, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.14, 32]} />
        <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.3} />
      </mesh>
      <Lens x={0.38} radius={0.1} />
    </group>
  );
}
