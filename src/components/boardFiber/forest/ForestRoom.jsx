/*
 * The Forest clearing the board sits in (in preview), as a little model: a mossy mound with rounded corners, forest
 * floor tiles with fallen leaves (light warms them), and pines, a stump, ferns and toadstools round two edges.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { GroundShadow, roundedSlab } from '../themes/shared.jsx';

export const FOREST_PAD = 0.95;
export const FOREST_HEIGHT = 2.2;
const BASE_DEPTH = 0.42;
const floors = new Map();
const LEAVES = ['#e8964a', '#d9b03f', '#c9553a', '#8fbf5a', '#f0c96a'];

/** Forest floor painted on a canvas: mottled moss with a few fallen leaves and tiny flowers. */
function floorTexture(seed, tone) {
  const key = `${seed}${tone}`;
  if (floors.has(key)) return floors.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const d = canvas.getContext('2d');
  let r = seed * 9301 + 49297;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  d.fillStyle = `rgb(${tone - 30},${tone + 22},${tone - 46})`;
  d.fillRect(0, 0, 256, 256);
  for (let n = 0; n < 70; n++) {
    d.fillStyle = n % 2 ? `rgba(190,225,150,${0.1 + rnd() * 0.14})` : `rgba(30,60,30,${0.08 + rnd() * 0.12})`;
    d.beginPath();
    d.ellipse(rnd() * 256, rnd() * 256, 4 + rnd() * 12, 3 + rnd() * 8, rnd() * 3, 0, Math.PI * 2);
    d.fill();
  }
  for (let n = 0; n < 2; n++) {
    const [x, y, turn] = [30 + rnd() * 196, 30 + rnd() * 196, rnd() * Math.PI];
    d.save();
    d.translate(x, y);
    d.rotate(turn);
    d.fillStyle = LEAVES[Math.floor(rnd() * LEAVES.length)];
    d.beginPath();
    d.ellipse(0, 0, 17, 8, 0, 0, Math.PI * 2);
    d.fill();
    d.strokeStyle = 'rgba(90,50,20,0.55)';
    d.lineWidth = 1.5;
    d.beginPath();
    d.moveTo(-17, 0);
    d.lineTo(20, 0);
    d.stroke();
    d.restore();
  }
  for (let n = 0; n < 3; n++) {
    const [x, y] = [rnd() * 256, rnd() * 256];
    d.fillStyle = '#fff6e0';
    for (let p = 0; p < 5; p++) d.fillRect(x + Math.cos(p * 1.26) * 5 - 2, y + Math.sin(p * 1.26) * 5 - 2, 4, 4);
    d.fillStyle = '#f0c14e';
    d.fillRect(x - 2, y - 2, 4, 4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  floors.set(key, texture);
  return texture;
}

export function ForestFloor({ position, x, y, isLit, onClick, cell }) {
  const texture = useMemo(() => {
    const floor = floorTexture(1 + ((x * 3 + y * 7) % 6), (x + y) % 2 ? 172 : 156).clone();
    floor.needsUpdate = true;
    floor.center.set(0.5, 0.5);
    floor.rotation = ((x + y * 3) % 4) * (Math.PI / 2);
    return floor;
  }, [x, y]);
  return (
    <mesh position={position} receiveShadow castShadow userData={{ cell }} onClick={onClick}>
      <boxGeometry args={[0.94, 0.08, 0.94]} />
      <meshStandardMaterial map={texture} roughness={0.95} emissive="#ffb24a" emissiveIntensity={isLit ? 0.3 : 0} />
    </mesh>
  );
}

function Pine({ position, height = 1.7 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.4, 8]} />
        <meshStandardMaterial color="#6b4630" roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((tier) => (
        <mesh key={tier} position={[0, 0.5 + tier * (height * 0.24), 0]} castShadow>
          <coneGeometry args={[0.42 - tier * 0.1, height * 0.4, 12]} />
          <meshStandardMaterial color={['#3f7d57', '#4a8f63', '#58a171'][tier]} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Toadstool({ position, cap = '#d9553f' }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.14, 8]} />
        <meshStandardMaterial color="#f6eedd" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.14, 0]} scale={[1, 0.65, 1]} castShadow>
        <sphereGeometry args={[0.11, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={cap} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function ForestRoom({ level }) {
  const width = level.width + FOREST_PAD * 2;
  const depth = level.height + FOREST_PAD * 2;
  const mound = useMemo(() => roundedSlab(width, depth, BASE_DEPTH, 0.5), [width, depth]);
  const soil = useMemo(() => roundedSlab(level.width + 0.5, level.height + 0.5, 0.04, 0.14), [level]);
  const back = -(level.height / 2 + 0.62);
  const side = -(level.width / 2 + 0.62);
  return (
    <group>
      <GroundShadow width={width} depth={depth} y={-BASE_DEPTH - 0.1} />
      <mesh geometry={mound} position={[0, -0.02, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#86b972" roughness={0.95} />
      </mesh>
      <mesh geometry={soil} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#3f4a34" roughness={1} />
      </mesh>
      <Pine position={[side, 0, back]} />
      <Pine position={[-level.width / 2 + 1.1, 0, back]} height={1.35} />
      <Pine position={[level.width / 2 - 0.6, 0, back]} height={1.55} />
      <Pine position={[side, 0, -level.height / 2 + 1.5]} height={1.3} />
      <Toadstool position={[0.3, 0, back]} />
      <Toadstool position={[0.52, 0, back + 0.08]} cap="#f0a23a" />
      <Toadstool position={[side, 0, 0.8]} />
      <Toadstool position={[level.width / 2 + 0.6, 0, level.height / 2 - 0.5]} cap="#f0a23a" />
      <Toadstool position={[-0.9, 0, level.height / 2 + 0.62]} />
    </group>
  );
}
