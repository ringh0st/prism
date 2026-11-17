/*
 * The Library room the board sits in: a wooden floor platform, a red rug with a gold border, oak parquet tiles (the
 * tiles you tap; light warms them) and two bookshelves behind. Wood is painted onto canvases (grain, knots, seams).
 */
import { useMemo } from 'react';
import * as THREE from 'three';

const woodCache = new Map();

export function woodTexture({ base = [148, 98, 62], planksAcross = 6, length = 4, seed = 1, varied = 18 } = {}) {
  const key = JSON.stringify([base, planksAcross, length, seed, varied]);
  if (woodCache.has(key)) return woodCache.get(key);
  const W = 1024,
    H = 1024,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const d = c.getContext('2d');
  let r = seed * 9301 + 49297;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const rowH = H / planksAcross;
  for (let row = 0; row < planksAcross; row++) {
    let x = -rnd() * (W / length);
    while (x < W) {
      const len = (W / length) * (0.7 + rnd() * 0.6);
      const shade = (rnd() - 0.5) * varied;
      const [cr, cg, cb] = base.map((v) => Math.max(0, Math.min(255, v + shade)));
      const y0 = row * rowH;
      d.fillStyle = `rgb(${cr},${cg},${cb})`;
      d.fillRect(x, y0, len, rowH);
      // grain: long wavy lines, slightly darker and lighter
      for (let g = 0; g < 14; g++) {
        const gy = y0 + rnd() * rowH,
          amp = 1 + rnd() * 3,
          freq = 0.004 + rnd() * 0.01,
          ph = rnd() * 6;
        d.strokeStyle = `rgba(${g % 3 ? 60 : 255},${g % 3 ? 35 : 230},${g % 3 ? 20 : 200},${0.06 + rnd() * 0.08})`;
        d.lineWidth = 0.6 + rnd() * 1.4;
        d.beginPath();
        for (let gx = x; gx <= x + len; gx += 8) {
          const yy = gy + Math.sin(gx * freq + ph) * amp;
          if (gx === x) d.moveTo(gx, yy);
          else d.lineTo(gx, yy);
        }
        d.stroke();
      }
      if (rnd() < 0.07) {
        // a small knot
        const kx = x + rnd() * len,
          ky = y0 + rowH * (0.3 + rnd() * 0.4);
        const kg = d.createRadialGradient(kx, ky, 0, kx, ky, rowH * 0.18);
        kg.addColorStop(0, 'rgba(70,40,22,0.28)');
        kg.addColorStop(1, 'rgba(60,32,18,0)');
        d.fillStyle = kg;
        d.beginPath();
        d.ellipse(kx, ky, rowH * 0.3, rowH * 0.14, 0, 0, Math.PI * 2);
        d.fill();
      }
      d.fillStyle = 'rgba(40,22,12,0.55)';
      d.fillRect(x, y0, 2, rowH); // end seam
      x += len;
    }
    d.fillStyle = 'rgba(40,22,12,0.6)';
    d.fillRect(0, row * rowH, W, 2.5); // side seam
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  woodCache.set(key, t);
  return t;
}

export function Shelf({ position, rotation, books = 9, seed = 0 }) {
  const colors = ['#7a3b33', '#2f5f73', '#3f6b4c', '#a36b2a', '#5a3b5c', '#c49a4a', '#8a4a3a', '#2e4a3a'];
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.9, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.9, 0.08]} />
        <meshStandardMaterial color="#6b4430" roughness={0.8} />
      </mesh>
      {[0.05, 0.65, 1.25, 1.85].map((y) => (
        <mesh key={y} position={[0, y, 0.12]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.06, 0.38]} />
          <meshStandardMaterial color="#7d5136" roughness={0.75} />
        </mesh>
      ))}
      {[0.08, 0.68, 1.28].flatMap((y, row) => {
        let x = -1.12;
        const out = [];
        for (let k = 0; k < books; k++) {
          const w = 0.07 + ((k * 7 + row * 3 + seed) % 4) * 0.025,
            h = 0.38 + ((k * 5 + row + seed) % 3) * 0.08;
          out.push(
            <mesh key={`${row}-${k}`} position={[x + w / 2, y + h / 2, 0.12]} rotation={[0, 0, (k + seed) % 9 === 0 ? -0.15 : 0]} castShadow>
              <boxGeometry args={[w, h, 0.3]} />
              <meshStandardMaterial color={colors[(k * 3 + row * 5 + seed) % colors.length]} roughness={0.7} />
            </mesh>,
          );
          x += w + 0.012;
          if (x > 1.05) break;
        }
        return out;
      })}
    </group>
  );
}

/** Oak parquet on a tap tile, its grain turned every other tile; warmed by lamplight when light passes over it. */
export function ParquetTile({ position, x, y, isLit, onClick, cell }) {
  const texture = useMemo(() => {
    const t = woodTexture({ base: [201, 152, 104], planksAcross: 4, length: 1.4, seed: 7 + ((x * 3 + y * 5) % 6), varied: 22 }).clone();
    t.needsUpdate = true;
    t.center.set(0.5, 0.5);
    t.rotation = (x + y) % 2 ? Math.PI / 2 : 0;
    return t;
  }, [x, y]);
  return (
    <mesh position={position} receiveShadow castShadow userData={{ cell }} onClick={onClick}>
      <boxGeometry args={[0.95, 0.08, 0.95]} />
      <meshPhysicalMaterial
        map={texture}
        roughness={0.35}
        clearcoat={0.8}
        clearcoatRoughness={0.2}
        emissive="#ffb24a"
        emissiveIntensity={isLit ? 0.18 : 0}
      />
    </mesh>
  );
}

/** The room around the board: a wooden floor platform, the rug and two bookshelves at the back. */
export function LibraryRoom({ level }) {
  const span = Math.max(level.width, level.height);
  const floor = useMemo(() => {
    const t = woodTexture({ base: [124, 78, 48], planksAcross: 8, length: 3, seed: 3 }).clone();
    t.needsUpdate = true;
    t.repeat.set((span + 3) / 4, (span + 3) / 4);
    return t;
  }, [span]);
  const rug = (pad, color, y) => (
    <mesh position={[0, y, 0]} receiveShadow>
      <boxGeometry args={[level.width + pad, 0.03, level.height + pad]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
  const back = -(level.height / 2 + 1.1);
  const side = -(level.width / 2 + 1.1);
  return (
    <group>
      <mesh position={[0, -0.16, 0]} receiveShadow castShadow>
        <boxGeometry args={[level.width + 3, 0.3, level.height + 3]} />
        <meshPhysicalMaterial map={floor} roughness={0.45} clearcoat={0.5} clearcoatRoughness={0.35} />
      </mesh>
      {rug(0.7, '#7d2f2a', 0)}
      {rug(0.3, '#c99a5a', 0.005)}
      {rug(0.15, '#8a3530', 0.01)}
      <Shelf position={[-0.3, 0, back]} seed={2} />
      <Shelf position={[side, 0, -0.4]} rotation={[0, Math.PI / 2, 0]} seed={5} />
    </group>
  );
}
