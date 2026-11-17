import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { LOOK, roundedRect } from './look.js';

/** The frame: a rounded-square ring, extruded with a soft bevel. */
function frameGeometry(width, height, border, radius) {
  const shape = roundedRect(width, height, radius);
  shape.holes.push(roundedRect(width - border * 2, height - border * 2, radius * 0.6));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 4,
    curveSegments: 10,
  });
  geometry.center();
  return geometry;
}

/**
 * A mirror (design guide: "Mirror — reflects the light"): a pane of pale sky glass in a rounded sage frame with a
 * gold inner rim, standing on a turntable ringed with turn arrows (a fixed one stands on a stone plate). It swings
 * a quarter turn with a springy GSAP ease. A splitter is half-silvered mint glass that lets light through too.
 */
export default function Mirror({ tile, turn, isRotatable }) {
  const rotor = useRef();
  const isSplitter = tile.type === 'splitter';
  const frame = useMemo(() => frameGeometry(0.84, 0.56, 0.1, 0.16), []);
  const rim = useMemo(() => frameGeometry(0.66, 0.38, 0.03, 0.1), []);
  const pane = useMemo(() => new THREE.ShapeGeometry(roundedRect(0.66, 0.38, 0.1)), []);
  const angle = -THREE.MathUtils.degToRad(-45 + turn * 90);

  useEffect(() => {
    gsap.to(rotor.current.rotation, { y: angle, duration: 0.45, ease: 'back.out(1.8)' });
  }, [angle]);

  return (
    <group>
      {isRotatable ? (
        <group>
          <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[0.36, 0.38, 0.06, 48]} />
            <meshPhysicalMaterial color={LOOK.mint} roughness={0.5} clearcoat={0.4} />
          </mesh>
          {/* Turn arrows: two curved teal arcs around the turntable. */}
          {[0, Math.PI].map((start) => (
            <mesh key={start} position={[0, 0.235, 0]} rotation={[-Math.PI / 2, 0, start + 0.5]}>
              <torusGeometry args={[0.32, 0.022, 8, 32, Math.PI * 0.55]} />
              <meshStandardMaterial color={LOOK.sageDeep} />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.72, 0.06, 0.72]} />
          <meshStandardMaterial color={LOOK.stone} roughness={0.8} />
        </mesh>
      )}
      <group ref={rotor} rotation={[0, angle, 0]} position={[0, 0.23, 0]}>
        <mesh position={[0, 0.03, 0]} castShadow>
          <boxGeometry args={[0.3, 0.05, 0.14]} />
          <meshPhysicalMaterial color={LOOK.gold} metalness={0.5} roughness={0.35} />
        </mesh>
        <group position={[0, 0.33, 0]}>
          <mesh geometry={frame} castShadow receiveShadow>
            <meshPhysicalMaterial color={isSplitter ? LOOK.mint : LOOK.sage} roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.2} />
          </mesh>
          <mesh geometry={rim}>
            <meshPhysicalMaterial color={LOOK.gold} metalness={0.55} roughness={0.3} clearcoat={0.6} />
          </mesh>
          {[0.01, -0.01].map((z) => (
            <mesh key={z} geometry={pane} position={[0, 0, z]} rotation={[0, z < 0 ? Math.PI : 0, 0]}>
              <meshPhysicalMaterial
                color={isSplitter ? '#d8f5ec' : LOOK.glass}
                metalness={isSplitter ? 0.05 : 0.25}
                roughness={0.05}
                clearcoat={1}
                iridescence={isSplitter ? 0.9 : 0.25}
                transparent={isSplitter}
                opacity={isSplitter ? 0.65 : 1}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
          {/* A bright streak across the glass so it reads as a reflecting surface. */}
          <mesh position={[-0.12, 0.02, 0.02]} rotation={[0, 0, 0.6]}>
            <planeGeometry args={[0.06, 0.42]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} depthWrite={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
