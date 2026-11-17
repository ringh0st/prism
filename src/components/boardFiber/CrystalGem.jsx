import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { BEAM_COLORS, glowing } from './look.js';

/** A natural crystal point: a slightly tapered six-sided prism with a pointed tip (one geometry). */
function crystalGeometry(radius, height) {
  const points = [
    [0.001, 0],
    [radius * 0.9, 0],
    [radius, height * 0.15],
    [radius * 0.92, height],
    [0.001, height + radius * 1.7],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(points, 6);
}

/** Each light's crystal tone, so a gem still shows which light it needs. */
const CRYSTAL_TONES = { sun: '#ffb020', coral: '#ff6f8f', lime: '#7fd36a', sky: '#6cc7f2' };
const FROSTED = new THREE.Color('#eef3ff');

/** Crystal points growing out of the rock: [radius, height, x, z, tilt towards x, tilt towards z, turn]. */
const POINTS = [
  [0.11, 0.34, 0, 0, 0, 0, 0],
  [0.075, 0.2, 0.12, 0.03, -0.5, 0.15, 0.4],
  [0.07, 0.18, -0.11, -0.05, 0.5, -0.2, 1.2],
  [0.05, 0.12, 0.03, 0.13, 0.15, 0.55, 0.2],
  [0.05, 0.11, -0.05, -0.13, -0.1, -0.55, 2.2],
  [0.04, 0.08, 0.13, -0.1, -0.45, -0.4, 0.9],
];

/**
 * A gem as a crystal cluster: six crystal points growing out of a little lilac-grey geode. Waiting, it is clear
 * frosted glass; when its light reaches it, it fills with its color, glows from a heart inside, pops (GSAP) and
 * twinkles with tiny star glints, turning slowly while it stays lit.
 */
export default function CrystalGem({ tile, isLit, isDarkened, calm }) {
  const cluster = useRef();
  const heart = useRef();
  const materials = useRef([]);
  const sparks = useRef([]);
  const twinkles = useRef([]);
  const color = CRYSTAL_TONES[tile.color] ?? BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun;
  const points = useMemo(() => POINTS.map(([r, h]) => crystalGeometry(r, h)), []);
  const rock = useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(0.2, 0);
    geometry.scale(1.1, 0.42, 1.1);
    return geometry;
  }, []);

  useEffect(() => {
    const target = isDarkened ? new THREE.Color('#8c8378') : isLit ? new THREE.Color(color) : FROSTED;
    materials.current.forEach((m) => {
      if (!m) return;
      gsap.to(m.color, { r: target.r, g: target.g, b: target.b, duration: 0.35 });
      gsap.to(m, { emissiveIntensity: isLit && !isDarkened ? 0.45 : 0, roughness: isLit ? 0.05 : 0.22, duration: 0.4 });
    });
    gsap.to(heart.current.scale, { x: isLit ? 1 : 0.001, y: isLit ? 1 : 0.001, z: isLit ? 1 : 0.001, duration: 0.4, ease: 'back.out(2)' });
    if (isLit && !calm) {
      gsap
        .timeline()
        .to(cluster.current.scale, { x: 0.88, y: 0.88, z: 0.88, duration: 0.1 })
        .to(cluster.current.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.2, ease: 'back.out(3)' })
        .to(cluster.current.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
      sparks.current.forEach((spark, n) => {
        const a = (n / sparks.current.length) * Math.PI * 2;
        gsap.fromTo(
          spark.position,
          { x: 0, y: 0.45, z: 0 },
          { x: Math.cos(a) * 0.55, y: 0.7 + (n % 3) * 0.12, z: Math.sin(a) * 0.55, duration: 0.8, ease: 'power2.out' },
        );
        gsap.fromTo(spark.scale, { x: 1, y: 1, z: 1 }, { x: 0.01, y: 0.01, z: 0.01, duration: 0.8, ease: 'power1.in' });
      });
    }
  }, [isLit, isDarkened, calm, color]);

  useFrame(({ clock }, dt) => {
    if (calm) return;
    if (isLit) cluster.current.rotation.y += dt * 0.35;
    twinkles.current.forEach((star, n) => {
      if (!star) return;
      const beat = isLit ? Math.max(0, Math.sin(clock.elapsedTime * 2.4 + n * 2.1)) : 0;
      star.scale.setScalar(0.001 + beat);
      star.rotation.z = clock.elapsedTime * 0.8 + n;
    });
  });

  return (
    <group position={[0, 0.17, 0]}>
      <mesh geometry={rock} position={[0, 0.05, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#cdc6db" roughness={0.8} flatShading />
      </mesh>
      <group ref={cluster} position={[0, 0.09, 0]} scale={1.3}>
        {POINTS.map(([, , x, z, tiltX, tiltZ, turn], n) => (
          <mesh key={n} geometry={points[n]} position={[x, 0, z]} rotation={[tiltZ, turn, tiltX]} castShadow>
            <meshPhysicalMaterial
              ref={(m) => (materials.current[n] = m)}
              color={FROSTED}
              roughness={0.22}
              clearcoat={1}
              clearcoatRoughness={0.05}
              iridescence={0.5}
              flatShading
              transparent
              opacity={0.93}
              emissive={color}
              emissiveIntensity={0}
            />
          </mesh>
        ))}
      </group>
      {/* A glowing heart inside the big crystal, seen through its faces once it's lit. */}
      <mesh ref={heart} position={[0, 0.33, 0]} scale={0.001}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshBasicMaterial color={glowing(color, 2.2)} toneMapped={false} transparent opacity={0.75} />
      </mesh>
      {/* Star glints on the tips while lit. */}
      {[
        [0.02, 0.66, 0.03],
        [0.2, 0.42, 0.06],
        [-0.17, 0.38, -0.08],
      ].map((position, n) => (
        <mesh key={n} ref={(mesh) => (twinkles.current[n] = mesh)} position={position} scale={0.001}>
          <octahedronGeometry args={[0.035, 0]} />
          <meshBasicMaterial color={glowing('#fffbe8', 5)} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, n) => (
        <mesh key={n} ref={(mesh) => (sparks.current[n] = mesh)} position={[0, 0.45, 0]} scale={0.01}>
          <octahedronGeometry args={[0.04, 0]} />
          <meshBasicMaterial color={glowing('#fff3c4', 3)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
