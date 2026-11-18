import { useMemo } from 'react';
/*
 * Shared bits of the themed boards: materials, the lathe helper, and the soft lights (flare, glint, light strips).
 */
import * as THREE from 'three';

export const glow = (c, k) => new THREE.Color(c).multiplyScalar(k);
export const lath = (pts, seg = 32) =>
  new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    seg,
  );

export const brassM = (c = '#d6a347') => <meshPhysicalMaterial color={c} metalness={0.8} roughness={0.28} clearcoat={0.6} />;

export const mirrorM = (
  <meshPhysicalMaterial
    color="#e8f4f8"
    metalness={0.9}
    roughness={0.04}
    clearcoat={1}
    emissive="#d9eef6"
    emissiveIntensity={0.35}
    side={THREE.DoubleSide}
  />
);

export function Streaks({ w = 0.5, h = 0.4, z = 0.012 }) {
  return [z, -z].flatMap((zz) =>
    [
      [-w * 0.18, w * 0.12],
      [w * 0.05, w * 0.05],
    ].map(([x, ww]) => (
      <mesh key={`${zz}${x}`} position={[x, 0, zz]} rotation={[0, zz < 0 ? Math.PI : 0, 0.7]}>
        <planeGeometry args={[ww, h * 1.1]} />
        <meshBasicMaterial color="#fff" transparent opacity={0.6} depthWrite={false} />
      </mesh>
    )),
  );
}

export function softStrip(stops) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const d = c.getContext('2d');
  const g = d.createLinearGradient(0, 0, 0, 128);
  stops.forEach(([at, col]) => g.addColorStop(at, col));
  d.fillStyle = g;
  d.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const SHAFT = softStrip([
  [0, 'rgba(255,214,140,0)'],
  [0.32, 'rgba(255,214,140,0.25)'],
  [0.47, 'rgba(255,240,205,0.85)'],
  [0.5, 'rgba(255,252,240,1)'],
  [0.53, 'rgba(255,240,205,0.85)'],
  [0.68, 'rgba(255,214,140,0.25)'],
  [1, 'rgba(255,214,140,0)'],
]);

export const POOL = softStrip([
  [0, 'rgba(255,200,120,0)'],
  [0.3, 'rgba(255,205,130,0.35)'],
  [0.5, 'rgba(255,225,170,0.6)'],
  [0.7, 'rgba(255,205,130,0.35)'],
  [1, 'rgba(255,200,120,0)'],
]);

let flareTex = null;

export function Flare({ position, size = 0.6 }) {
  if (!flareTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const d = c.getContext('2d');
    const g = d.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,250,235,1)');
    g.addColorStop(0.2, 'rgba(255,225,160,0.6)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    d.fillStyle = g;
    d.fillRect(0, 0, 128, 128);
    flareTex = new THREE.CanvasTexture(c);
  }
  return (
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial map={flareTex} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

let glintTex = null;

export function Glint({ position, size = 0.22 }) {
  if (!glintTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const d = c.getContext('2d');
    d.translate(64, 64);
    for (let k = 0; k < 4; k++) {
      d.rotate(Math.PI / 2);
      const g = d.createLinearGradient(0, 0, 60, 0);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      d.fillStyle = g;
      d.beginPath();
      d.moveTo(0, -4);
      d.lineTo(60, 0);
      d.lineTo(0, 4);
      d.fill();
    }
    const r = d.createRadialGradient(0, 0, 0, 0, 0, 16);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    d.fillStyle = r;
    d.fillRect(-16, -16, 32, 32);
    glintTex = new THREE.CanvasTexture(c);
  }
  return (
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial map={glintTex} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

export function Gear({ r = 0.4, teeth = 12, h = 0.06, color = '#c9973f', metalness = 0.75, roughness = 0.32 }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    for (let k = 0; k < teeth * 2; k++) {
      const a = (k / (teeth * 2)) * Math.PI * 2,
        rr = k % 2 ? r : r * 0.86;
      const p = [Math.cos(a) * rr, Math.sin(a) * rr];
      if (k) s.lineTo(...p);
      else s.moveTo(...p);
    }
    s.holes.push(new THREE.Path().absarc(0, 0, r * 0.25, 0, Math.PI * 2));
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [r, teeth, h]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

/** A slab with rounded corners, lying flat (its top at y = 0); texture coordinates in world units / 4. */
export function roundedSlab(width, depth, height, radius) {
  const shape = new THREE.Shape();
  const w = width / 2;
  const d = depth / 2;
  shape.moveTo(-w + radius, -d);
  shape.lineTo(w - radius, -d);
  shape.quadraticCurveTo(w, -d, w, -d + radius);
  shape.lineTo(w, d - radius);
  shape.quadraticCurveTo(w, d, w - radius, d);
  shape.lineTo(-w + radius, d);
  shape.quadraticCurveTo(-w, d, -w, d - radius);
  shape.lineTo(-w, -d + radius);
  shape.quadraticCurveTo(-w, -d, -w + radius, -d);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geometry.rotateX(Math.PI / 2);
  const uv = geometry.attributes.uv;
  for (let n = 0; n < uv.count; n++) uv.setXY(n, uv.getX(n) / 4, uv.getY(n) / 4);
  return geometry;
}

let groundShadow = null;

/** A soft round shadow on the page under a room's base, so the room sits on the screen like a little model. */
export function GroundShadow({ width, depth, y }) {
  if (!groundShadow) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    const fade = context.createRadialGradient(128, 128, 40, 128, 128, 128);
    fade.addColorStop(0, 'rgba(70, 42, 22, 0.42)');
    fade.addColorStop(0.6, 'rgba(70, 42, 22, 0.16)');
    fade.addColorStop(1, 'rgba(70, 42, 22, 0)');
    context.fillStyle = fade;
    context.fillRect(0, 0, 256, 256);
    groundShadow = new THREE.CanvasTexture(canvas);
  }
  return (
    <mesh position={[0, y, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width * 1.22, depth * 1.22]} />
      <meshBasicMaterial map={groundShadow} transparent depthWrite={false} />
    </mesh>
  );
}

/** A splitter's pane: clear amber glass you can see through (light passes and bounces). */
export const amberGlass = (
  <meshPhysicalMaterial
    color="#ffd98a"
    roughness={0.05}
    clearcoat={1}
    transparent
    opacity={0.42}
    emissive="#ffc35a"
    emissiveIntensity={0.25}
    side={THREE.DoubleSide}
  />
);

/** For walls that join up: is there a wall on the square `dx`, `dy` away from this tile? */
export const wallBeside = (level, tile) => (dx, dy) =>
  level.tiles.some((other) => other.type === 'wall' && other.x === tile.x + dx && other.y === tile.y + dy);
