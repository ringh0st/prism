/*
 * The Beach the board sits on, as a little model: a sandbar in a turquoise sea, sand tiles with
 * ripples, shells and pebbles (light warms them), and a palm, a parasol, a starfish and a beach ball around it.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { GroundShadow, roundedSlab } from '../themes/shared.jsx';

export const BEACH_PAD = 0.95;
export const BEACH_HEIGHT = 2;
const BASE_DEPTH = 0.42;
const sands = new Map();

/** Sand painted on a canvas: fine grain, soft ripple lines, and a shell or a pebble here and there. */
function sandTexture(seed, tone) {
  const key = `${seed}${tone}`;
  if (sands.has(key)) return sands.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const d = canvas.getContext('2d');
  let r = seed * 9301 + 49297;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  d.fillStyle = `rgb(${tone + 14},${tone - 14},${tone - 62})`;
  d.fillRect(0, 0, 256, 256);
  for (let n = 0; n < 500; n++) {
    d.fillStyle = n % 2 ? `rgba(255,255,255,${0.12 + rnd() * 0.16})` : `rgba(150,110,60,${0.08 + rnd() * 0.12})`;
    d.fillRect(rnd() * 256, rnd() * 256, 2, 2);
  }
  d.strokeStyle = 'rgba(160,120,70,0.22)';
  d.lineWidth = 3;
  for (let line = 0; line < 4; line++) {
    const y = 36 + line * 60 + rnd() * 12;
    d.beginPath();
    for (let x = 0; x <= 256; x += 16) d.lineTo(x, y + Math.sin(x * 0.05 + line) * 6);
    d.stroke();
  }
  for (let n = 0; n < 2; n++) {
    const [x, y] = [30 + rnd() * 196, 30 + rnd() * 196];
    d.fillStyle = ['#ffd9d0', '#ffffff', '#9aa0a6', '#ffc8a8'][Math.floor(rnd() * 4)];
    d.beginPath();
    d.ellipse(x, y, 9, 7, rnd() * 3, 0, Math.PI * 2);
    d.fill();
    d.strokeStyle = 'rgba(120,80,60,0.35)';
    d.lineWidth = 1.5;
    d.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  sands.set(key, texture);
  return texture;
}

export function SandTile({ position, x, y, isLit, onClick, cell }) {
  const texture = useMemo(() => {
    const sand = sandTexture(1 + ((x * 3 + y * 7) % 6), (x + y) % 2 ? 214 : 196).clone();
    sand.needsUpdate = true;
    sand.center.set(0.5, 0.5);
    sand.rotation = ((x + y * 3) % 4) * (Math.PI / 2);
    return sand;
  }, [x, y]);
  return (
    <mesh position={position} receiveShadow castShadow userData={{ cell }} onClick={onClick}>
      <boxGeometry args={[0.94, 0.08, 0.94]} />
      <meshStandardMaterial map={texture} roughness={0.95} emissive="#ffb24a" emissiveIntensity={isLit ? 0.3 : 0} />
    </mesh>
  );
}

function Palm({ position }) {
  return (
    <group position={position}>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} position={[k * 0.04, 0.16 + k * 0.3, 0]} rotation={[0, 0, -0.12]} castShadow>
          <cylinderGeometry args={[0.07 - k * 0.006, 0.08 - k * 0.006, 0.32, 10]} />
          <meshStandardMaterial color={k % 2 ? '#a8774a' : '#b98856'} roughness={0.9} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <group key={k} position={[0.16, 1.32, 0]} rotation={[0, k * 1.047, 0]}>
          <mesh position={[0.26, -0.05, 0]} rotation={[0, 0, -0.45]} scale={[1, 0.12, 0.38]} castShadow>
            <sphereGeometry args={[0.3, 12, 8]} />
            <meshStandardMaterial color={k % 2 ? '#4fa871' : '#62b982'} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Parasol({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
        <meshStandardMaterial color="#fbf7ee" roughness={0.6} />
      </mesh>
      {Array.from({ length: 8 }, (_, k) => (
        <mesh key={k} position={[0, 0.9, 0]} rotation={[0, (k * Math.PI) / 4, 0]} castShadow>
          <coneGeometry args={[0.5, 0.22, 8, 1, false, 0, Math.PI / 4]} />
          <meshStandardMaterial color={k % 2 ? '#fbf7ee' : '#ff7f6e'} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Starfish({ position, color = '#ff8f73' }) {
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      {[0, 1, 2, 3, 4].map((k) => (
        <mesh key={k} rotation={[0, k * 1.2566, 0]} position={[Math.cos(-k * 1.2566) * 0.07, 0.025, Math.sin(-k * 1.2566) * 0.07]} scale={[1, 0.35, 0.45]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export function BeachRoom({ level }) {
  const width = level.width + BEACH_PAD * 2;
  const depth = level.height + BEACH_PAD * 2;
  const sea = useMemo(() => roundedSlab(width, depth, BASE_DEPTH, 0.5), [width, depth]);
  const sandbar = useMemo(() => roundedSlab(level.width + 1.2, level.height + 1.2, 0.06, 0.5), [level]);
  const wet = useMemo(() => roundedSlab(level.width + 0.5, level.height + 0.5, 0.04, 0.14), [level]);
  const back = -(level.height / 2 + 0.38);
  const side = -(level.width / 2 + 0.38);
  return (
    <group>
      <GroundShadow width={width} depth={depth} y={-BASE_DEPTH - 0.1} />
      <mesh geometry={sea} position={[0, -0.04, 0]} receiveShadow castShadow>
        <meshPhysicalMaterial color="#3fa9a8" roughness={0.12} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      <mesh geometry={sandbar} position={[0, 0.0, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#e2c38a" roughness={1} />
      </mesh>
      <mesh geometry={wet} position={[0, 0.012, 0]} receiveShadow>
        <meshStandardMaterial color="#a8824e" roughness={1} />
      </mesh>
      <Palm position={[side, 0, back]} />
      <Parasol position={[level.width / 2 + 0.34, 0, back + 0.1]} />
      <Starfish position={[level.width / 2 + 0.42, 0.03, 0.8]} />
      <Starfish position={[-1, 0.03, level.height / 2 + 0.42]} color="#f6add6" />
      <mesh position={[1.2, 0.14, level.height / 2 + 0.42]} castShadow>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshStandardMaterial color="#ffc46b" roughness={0.6} />
      </mesh>
    </group>
  );
}
