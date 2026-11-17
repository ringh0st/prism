import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { BEAM_COLORS, BEAM_HEIGHT, LOOK, glowing, pillow, starShape } from './look.js';

const DIRECTION_ANGLE = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 };

/**
 * The lamp (design guide: "Lamp — emits light"): a glossy coral-orange block with a cream cap and button, a butter
 * star on each side and a big gold-ringed lens that glows white-hot in its beam's color, facing the way the light
 * leaves. Its glow breathes (GSAP), and a turning lamp swings to its new way.
 */
export default function Lamp({ tile, turn, calm }) {
  const head = useRef();
  const glow = useRef();
  const body = useMemo(() => pillow(0.66, 0.66, 0.56, 0.2, 0.1), []);
  const cap = useMemo(() => pillow(0.52, 0.52, 0.12, 0.14, 0.04), []);
  const star = useMemo(
    () => new THREE.ExtrudeGeometry(starShape(0.13), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2 }),
    [],
  );
  const angle = (DIRECTION_ANGLE[tile.dir] ?? 0) - (tile.turnable ? (turn % 2) * (Math.PI / 2) : 0);
  const color = BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun;

  useEffect(() => {
    gsap.to(head.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.6)' });
  }, [angle]);
  useEffect(() => {
    if (calm) return undefined;
    const pulse = gsap.to(glow.current.scale, { x: 1.18, y: 1.18, z: 1.18, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    return () => pulse.kill();
  }, [calm]);

  return (
    <group>
      {tile.turnable && (
        <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[0.38, 0.45, 48]} />
          <meshStandardMaterial color={LOOK.sage} />
        </mesh>
      )}
      <group ref={head} rotation={[0, angle, 0]} position={[0, 0.16, 0]}>
        <mesh geometry={body} castShadow receiveShadow>
          <meshPhysicalMaterial color={LOOK.coral} roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.2} />
        </mesh>
        <mesh geometry={cap} position={[0, 0.55, 0]} castShadow>
          <meshPhysicalMaterial color={LOOK.cream} roughness={0.4} clearcoat={0.6} />
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.07, 32]} />
          <meshPhysicalMaterial color={LOOK.coral} roughness={0.3} clearcoat={0.8} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} geometry={star} position={[-0.04, 0.3, side * 0.335]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
            <meshPhysicalMaterial color={LOOK.butter} roughness={0.3} clearcoat={0.8} />
          </mesh>
        ))}
        {/* The lens, on the side the light leaves from. */}
        <group position={[0.34, BEAM_HEIGHT - 0.16, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.2, 0.05, 20, 48]} />
            <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.3} clearcoat={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[0.18, 48]} />
            <meshBasicMaterial color={glowing(color, 2.88)} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <circleGeometry args={[0.1, 40]} />
            <meshBasicMaterial color={glowing('#fffbe8', 5.4)} toneMapped={false} />
          </mesh>
          <mesh ref={glow} position={[0, 0, 0.03]}>
            <circleGeometry args={[0.24, 48]} />
            <meshBasicMaterial color={glowing(color, 2.16)} toneMapped={false} transparent opacity={0.35} depthWrite={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
