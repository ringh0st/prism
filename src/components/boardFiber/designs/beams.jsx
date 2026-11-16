import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { glowing } from '../look.js';

/** Place something along a straight light path from a to b (both [x, y, z]). */
function useSpan(from, to) {
  return useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    return { a, b, mid: a.clone().lerp(b, 0.5), length: a.distanceTo(b), angle: -Math.atan2(b.z - a.z, b.x - a.x) };
  }, [from, to]);
}

/** A soft glow texture across the width of a band: bright middle, fading edges. */
function bandTexture(stops) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 64;
  const draw = canvas.getContext('2d');
  const gradient = draw.createLinearGradient(0, 0, 0, 64);
  stops.forEach(([at, color]) => gradient.addColorStop(at, color));
  draw.fillStyle = gradient;
  draw.fillRect(0, 0, 4, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** 1 · Satin ribbon: a flat ribbon of light floating just above the tiles, white in the middle, golden at the edges. */
export function BeamRibbon({ from, to }) {
  const span = useSpan(from, to);
  const texture = useMemo(
    () =>
      bandTexture([
        [0, 'rgba(255,214,90,0)'],
        [0.25, 'rgba(255,214,90,0.9)'],
        [0.5, 'rgba(255,255,240,1)'],
        [0.75, 'rgba(255,214,90,0.9)'],
        [1, 'rgba(255,214,90,0)'],
      ]),
    [],
  );
  return (
    <mesh position={span.mid} rotation={[-Math.PI / 2, 0, -span.angle]}>
      <planeGeometry args={[span.length, 0.34]} />
      <meshBasicMaterial map={texture} color={glowing('#ffffff', 1.7)} toneMapped={false} transparent depthWrite={false} />
    </mesh>
  );
}

/** 2 · Fairy dust: a fine golden thread with twinkling sparkles drifting along it the way the light goes. */
export function BeamFairyDust({ from, to }) {
  const span = useSpan(from, to);
  const dust = useRef([]);
  const count = Math.round(span.length * 14);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, n) => ({
        phase: n / count,
        lift: Math.sin(n * 7.3) * 0.08,
        side: Math.cos(n * 3.1) * 0.08,
        size: 0.035 + (n % 3) * 0.015,
      })),
    [count],
  );
  useFrame(({ clock }) => {
    seeds.forEach((seed, n) => {
      const mesh = dust.current[n];
      if (!mesh) return;
      const along = (seed.phase + clock.elapsedTime * 0.35) % 1;
      mesh.position.lerpVectors(span.a, span.b, along);
      mesh.position.y += seed.lift;
      mesh.position.z += seed.side;
      mesh.scale.setScalar(0.6 + 0.6 * Math.abs(Math.sin(clock.elapsedTime * 4 + n)));
    });
  });
  return (
    <>
      <group position={span.mid} rotation={[0, span.angle, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, span.length, 10]} />
          <meshBasicMaterial color={glowing('#ffc93a', 2)} toneMapped={false} />
        </mesh>
      </group>
      {seeds.map((seed, n) => (
        <mesh key={n} ref={(mesh) => (dust.current[n] = mesh)}>
          <octahedronGeometry args={[seed.size, 0]} />
          <meshBasicMaterial color={glowing(n % 3 ? '#ffd24a' : '#ffb347', 2.2)} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/** 3 · Sunrise ribbon: a white-hot core with a soft warm rainbow at its edges (peach, butter, mint), like sunlight through glass. */
export function BeamSunrise({ from, to }) {
  const span = useSpan(from, to);
  const layers = [
    { radius: 0.17, color: '#9fe3c6', opacity: 0.35 },
    { radius: 0.13, color: '#ffb48a', opacity: 0.5 },
    { radius: 0.09, color: '#ffe066', opacity: 0.85 },
    { radius: 0.04, color: '#fffbea', opacity: 1, bright: 4 },
  ];
  return (
    <group position={span.mid} rotation={[0, span.angle, 0]}>
      {layers.map((layer) => (
        <mesh key={layer.radius} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[layer.radius, layer.radius, span.length, 24, 1, true]} />
          <meshBasicMaterial
            color={glowing(layer.color, layer.bright ?? 1.4)}
            toneMapped={false}
            transparent
            opacity={layer.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** 4 · String of pearls: round beads of light flowing along a thin glowing line, like a necklace, showing the way. */
export function BeamPearls({ from, to }) {
  const span = useSpan(from, to);
  const beads = useRef([]);
  const count = Math.max(2, Math.round(span.length * 3.2));
  useFrame(({ clock }) => {
    beads.current.forEach((bead, n) => {
      if (!bead) return;
      const along = (n / count + clock.elapsedTime * 0.25) % 1;
      bead.position.lerpVectors(span.a, span.b, along);
    });
  });
  return (
    <>
      <group position={span.mid} rotation={[0, span.angle, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, span.length, 12, 1, true]} />
          <meshBasicMaterial color={glowing('#ffc93a', 1.6)} toneMapped={false} transparent opacity={0.8} depthWrite={false} />
        </mesh>
      </group>
      {Array.from({ length: count }, (_, n) => (
        <mesh key={n} ref={(mesh) => (beads.current[n] = mesh)} position={span.a.clone().lerp(span.b, n / count)}>
          <sphereGeometry args={[0.1, 20, 14]} />
          <meshPhysicalMaterial color="#ffd447" emissive="#ffc21a" emissiveIntensity={1.6} roughness={0.15} clearcoat={1} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/** 5 · Sunbeam: a wide, soft shaft of warm light with floating motes, like sun through a window. */
export function BeamSunbeam({ from, to }) {
  const span = useSpan(from, to);
  const texture = useMemo(
    () =>
      bandTexture([
        [0, 'rgba(255,224,120,0)'],
        [0.35, 'rgba(255,224,120,0.55)'],
        [0.5, 'rgba(255,250,225,0.95)'],
        [0.65, 'rgba(255,224,120,0.55)'],
        [1, 'rgba(255,224,120,0)'],
      ]),
    [],
  );
  const motes = useMemo(() => Array.from({ length: Math.round(span.length * 6) }, (_, n) => n), [span.length]);
  return (
    <>
      {[0, Math.PI / 2].map((roll) => (
        <group key={roll} position={span.mid} rotation={[0, span.angle, 0]}>
          <mesh rotation={[roll, 0, 0]}>
            <planeGeometry args={[span.length, 0.42]} />
            <meshBasicMaterial
              map={texture}
              color={glowing('#ffffff', 1.25)}
              toneMapped={false}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
      {motes.map((n) => {
        const point = span.a.clone().lerp(span.b, (n + 0.5) / motes.length);
        point.y += Math.sin(n * 5.1) * 0.12;
        point.z += Math.cos(n * 2.7) * 0.1;
        return (
          <mesh key={n} position={point}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshBasicMaterial color={glowing('#fffbe8', 3)} toneMapped={false} />
          </mesh>
        );
      })}
    </>
  );
}
