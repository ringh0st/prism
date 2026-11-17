import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { BEAM_COLORS, facetedBlock, glowing } from './look.js';

/** A natural crystal point: a six-sided prism with a pointed tip. */
function crystalGeometry(radius, height) {
  const body = new THREE.CylinderGeometry(radius, radius * 0.92, height, 6, 1);
  body.translate(0, height / 2, 0);
  const tip = new THREE.ConeGeometry(radius, radius * 1.6, 6);
  tip.translate(0, height + radius * 0.8, 0);
  return [body, tip];
}

/** The gem colors as crystal tones: each light's own color, so a gem still shows which light it needs. */
const CRYSTAL_TONES = { sun: '#ffb020', coral: '#ff6f8f', lime: '#7fd36a', sky: '#6cc7f2' };

/**
 * A gem as an actual crystal cluster: one tall six-sided crystal point with two smaller ones leaning out of a cream
 * rock base. Frosted and pale until its light reaches it; then it glows from inside in its color, pops and sparkles
 * (GSAP), and stays softly shining.
 */
export default function CrystalGem({ tile, isLit, isDarkened, calm }) {
  const cluster = useRef();
  const materials = useRef([]);
  const sparks = useRef([]);
  const color = CRYSTAL_TONES[tile.color] ?? BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun;
  const big = useMemo(() => crystalGeometry(0.12, 0.34), []);
  const small = useMemo(() => crystalGeometry(0.07, 0.18), []);
  const rock = useMemo(() => facetedBlock(0.42, 0.42, 0.1, 0.12, 0.03), []);
  const pale = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.55), [color]);

  useEffect(() => {
    const target = isDarkened ? new THREE.Color('#8c8378') : isLit ? new THREE.Color(color) : pale;
    materials.current.forEach((m) => {
      if (!m) return;
      gsap.to(m.color, { r: target.r, g: target.g, b: target.b, duration: 0.35 });
      gsap.to(m, { emissiveIntensity: isLit && !isDarkened ? 0.5 : 0.05, duration: 0.4 });
    });
    if (isLit && !calm) {
      gsap
        .timeline()
        .to(cluster.current.scale, { x: 0.88, y: 0.88, z: 0.88, duration: 0.1 })
        .to(cluster.current.scale, { x: 1.18, y: 1.18, z: 1.18, duration: 0.2, ease: 'back.out(3)' })
        .to(cluster.current.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
      sparks.current.forEach((spark, n) => {
        const a = (n / sparks.current.length) * Math.PI * 2;
        gsap.fromTo(
          spark.position,
          { x: 0, y: 0.55, z: 0 },
          { x: Math.cos(a) * 0.55, y: 0.75 + (n % 3) * 0.12, z: Math.sin(a) * 0.55, duration: 0.8, ease: 'power2.out' },
        );
        gsap.fromTo(spark.scale, { x: 1, y: 1, z: 1 }, { x: 0.01, y: 0.01, z: 0.01, duration: 0.8, ease: 'power1.in' });
      });
    }
  }, [isLit, isDarkened, calm, color, pale]);

  useFrame((_, dt) => {
    if (!calm && isLit) cluster.current.rotation.y += dt * 0.4;
  });

  const crystal = (index) => (
    <meshPhysicalMaterial
      ref={(m) => (materials.current[index] = m)}
      color={pale}
      roughness={0.08}
      clearcoat={1}
      iridescence={0.6}
      flatShading
      transparent
      opacity={0.92}
      emissive={color}
      emissiveIntensity={0.05}
    />
  );
  const parts = [
    { geometry: big, position: [0, 0, 0], rotation: [0, 0, 0] },
    { geometry: small, position: [0.11, 0, 0.04], rotation: [0.15, 0.4, -0.45] },
    { geometry: small, position: [-0.1, 0, -0.06], rotation: [-0.2, 1.2, 0.5] },
  ];
  return (
    <group>
      <mesh geometry={rock} position={[0, 0.17, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f6ead6" roughness={0.75} flatShading />
      </mesh>
      <group ref={cluster} position={[0, 0.26, 0]} scale={1.35}>
        {parts.map((part, index) => (
          <group key={index} position={part.position} rotation={part.rotation}>
            {part.geometry.map((geometry, n) => (
              <mesh key={n} geometry={geometry} castShadow>
                {crystal(index * 2 + n)}
              </mesh>
            ))}
          </group>
        ))}
      </group>
      {Array.from({ length: 10 }, (_, n) => (
        <mesh key={n} ref={(mesh) => (sparks.current[n] = mesh)} position={[0, 0.55, 0]} scale={0.01}>
          <octahedronGeometry args={[0.04, 0]} />
          <meshBasicMaterial color={glowing('#fff3c4', 3)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
