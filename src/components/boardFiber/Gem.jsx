import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { BEAM_COLORS, LOOK, glowing } from './look.js';

/** Each color keeps its own outline from above: diamond 8 facets, circle 12, triangle 3, square 4. */
const SIDES = { sun: 8, coral: 12, lime: 3, sky: 4 };

function gemGeometry(sides) {
  const outline = [
    [0.001, -0.34],
    [0.34, 0.0],
    [0.34, 0.04],
    [0.2, 0.22],
    [0.001, 0.22],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const geometry = new THREE.LatheGeometry(outline, sides, sides === 4 ? Math.PI / 4 : 0);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A gem (design guide: "Gem — collects the light"): a faceted jewel on a little gold-rimmed stand. Idle it is
 * soft and pale; when light reaches it, it charges (a ring of light spins up around it) and pops into a glowing,
 * sparkling jewel (GSAP), then turns slowly while it stays lit.
 */
export default function Gem({ tile, isLit, isDarkened, calm }) {
  const jewel = useRef();
  const halo = useRef();
  const material = useRef();
  const sparkles = useRef([]);
  const color = BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun;
  const geometry = useMemo(() => gemGeometry(SIDES[tile.color] ?? 8), [tile.color]);
  const idle = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35), [color]);

  useEffect(() => {
    const m = material.current;
    if (isDarkened) {
      gsap.to(m.color, { r: 0.55, g: 0.51, b: 0.47, duration: 0.4 });
      m.emissiveIntensity = 0;
      return;
    }
    const target = isLit ? new THREE.Color(color) : idle;
    gsap.to(m.color, { r: target.r, g: target.g, b: target.b, duration: 0.35 });
    gsap.to(m, { emissiveIntensity: isLit ? 0.55 : 0, duration: 0.5 });
    gsap.to(halo.current.material, { opacity: isLit ? 0.1 : 0, duration: 0.5 });
    if (isLit && !calm) {
      // Collect: charge (a quick squash), pop up bigger, settle; sparkles burst out and fade.
      gsap
        .timeline()
        .to(jewel.current.scale, { x: 0.85, y: 0.85, z: 0.85, duration: 0.12, ease: 'power2.in' })
        .to(jewel.current.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.22, ease: 'back.out(3)' })
        .to(jewel.current.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
      sparkles.current.forEach((sparkle, n) => {
        const angle = (n / sparkles.current.length) * Math.PI * 2;
        gsap.fromTo(
          sparkle.position,
          { x: 0, y: 0.5, z: 0 },
          { x: Math.cos(angle) * 0.55, y: 0.7 + (n % 2) * 0.2, z: Math.sin(angle) * 0.55, duration: 0.7, ease: 'power2.out' },
        );
        gsap.fromTo(sparkle.scale, { x: 1, y: 1, z: 1 }, { x: 0.01, y: 0.01, z: 0.01, duration: 0.7, ease: 'power1.in' });
      });
    }
  }, [isLit, isDarkened, calm, color, idle]);

  useFrame((_, dt) => {
    if (calm) return;
    jewel.current.rotation.y += dt * (isLit ? 1.2 : 0.25);
  });

  return (
    <group>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.24, 0.12, 32]} />
        <meshPhysicalMaterial color={LOOK.cream} roughness={0.45} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.185, 0.022, 10, 40]} />
        <meshPhysicalMaterial color={LOOK.gold} metalness={0.55} roughness={0.3} />
      </mesh>
      <group ref={jewel} position={[0, 0.66, 0]}>
        <mesh geometry={geometry} castShadow>
          <meshPhysicalMaterial
            ref={material}
            color={idle}
            roughness={0.08}
            clearcoat={1}
            iridescence={0.6}
            flatShading
            emissive={color}
            emissiveIntensity={0}
          />
        </mesh>
      </group>
      <mesh ref={halo} position={[0, 0.66, 0]}>
        <sphereGeometry args={[0.36, 24, 16]} />
        <meshBasicMaterial color={glowing(color, 2.34)} toneMapped={false} transparent opacity={0} depthWrite={false} />
      </mesh>
      {Array.from({ length: 8 }, (_, n) => (
        <mesh key={n} ref={(mesh) => (sparkles.current[n] = mesh)} position={[0, 0.5, 0]} scale={0.01}>
          <octahedronGeometry args={[0.05, 0]} />
          <meshBasicMaterial color={glowing('#fffbe0', 5.4)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
