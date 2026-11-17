import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { BEAM_COLORS, BEAM_HEIGHT, facetedBlock, glowing } from './look.js';

const DIRECTION_ANGLE = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 };

/**
 * The light source as a Crystal Emitter (owner's mockup): a glowing crystal in its beam's color sitting in a golden
 * lotus with teal leaves, on a little honey plinth. A bright orb on one side shows where its light leaves; the crystal
 * breathes and the orb pulses (GSAP). A turning lamp swings its orb to the new way.
 */
export default function CrystalEmitter({ tile, turn, calm }) {
  const head = useRef();
  const orb = useRef();
  const crystal = useRef();
  const color = BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun;
  const plinth = useMemo(() => facetedBlock(0.56, 0.56, 0.08, 0.14, 0.02), []);
  const petal = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, 12, 8);
    geometry.scale(0.13, 0.055, 0.24);
    geometry.translate(0, 0, 0.17);
    return geometry;
  }, []);
  const leaf = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, 10, 6);
    geometry.scale(0.08, 0.025, 0.2);
    geometry.translate(0, 0, 0.25);
    return geometry;
  }, []);
  const angle = (DIRECTION_ANGLE[tile.dir] ?? 0) - (tile.turnable ? (turn % 2) * (Math.PI / 2) : 0);

  useEffect(() => {
    gsap.to(head.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.6)' });
  }, [angle]);
  useEffect(() => {
    if (calm) return undefined;
    const pulse = gsap.to(orb.current.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    const glow = gsap.to(crystal.current, { emissiveIntensity: 0.9, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    return () => {
      pulse.kill();
      glow.kill();
    };
  }, [calm]);

  return (
    <group>
      <mesh geometry={plinth} position={[0, 0.17, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={tile.turnable ? '#e9b44c' : '#f6c85a'} roughness={0.7} flatShading />
      </mesh>
      {/* Teal leaves under the flower. */}
      {[0.4, 2, 3.6, 5.2].map((turnAt) => (
        <mesh key={turnAt} geometry={leaf} position={[0, 0.27, 0]} rotation={[0, turnAt, 0]}>
          <meshPhysicalMaterial color="#4fbfad" roughness={0.4} clearcoat={0.6} />
        </mesh>
      ))}
      {/* Golden lotus petals, tipped outwards. */}
      {Array.from({ length: 8 }, (_, n) => (
        <group key={n} position={[0, 0.29, 0]} rotation={[0, (n / 8) * Math.PI * 2, 0]}>
          <mesh geometry={petal} rotation={[-0.75, 0, 0]} castShadow>
            <meshPhysicalMaterial color="#f5c542" roughness={0.3} clearcoat={0.9} />
          </mesh>
        </group>
      ))}
      {/* The crystal: a six-sided glowing gem standing in the flower. */}
      <group position={[0, 0.52, 0]} scale={1.45}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.13, 0.26, 6]} />
          <meshPhysicalMaterial ref={crystal} color="#fff1a8" roughness={0.1} clearcoat={1} flatShading emissive={color} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <coneGeometry args={[0.12, 0.15, 6]} />
          <meshPhysicalMaterial color="#fff6c8" roughness={0.1} clearcoat={1} flatShading emissive={color} emissiveIntensity={0.5} />
        </mesh>
      </group>
      {/* Where the light leaves. */}
      <group ref={head} rotation={[0, angle, 0]}>
        <mesh ref={orb} position={[0.24, BEAM_HEIGHT, 0]}>
          <sphereGeometry args={[0.07, 20, 14]} />
          <meshBasicMaterial color={glowing('#fffbe8', 5)} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
