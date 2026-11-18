/*
 * The Castle courtyard the board sits in, as a little model: a green lawn with rounded corners, rough stone paving
 * as the tiles you tap (light warms them), and sandstone battlements with two red-roofed towers along the back and
 * side (owner's reference: a hand-drawn medieval castle).
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { GroundShadow, roundedSlab } from '../themes/shared.jsx';

export const CASTLE_PAD = 0.95;
export const CASTLE_HEIGHT = 2.4;
const BASE_DEPTH = 0.42;
const LAWN = '#9ccb86';
const WALL = '#d6c29a';
const ROOF = '#c9553a';
const TIMBER = '#6b4630';
const MORTAR = '#56525c';
const SOFT_JOINT = '#8c8890';

const textures = new Map();
const seeded = (seed) => {
  let r = seed * 9301 + 49297;
  return () => (r = (r * 9301 + 49297) % 233280) / 233280;
};

/**
 * Stone paving painted on a canvas: a few rough-cut stones with uneven edges, each its own grey (some warmer, some
 * cooler), grainy and pitted, with a hairline crack here and there and a little moss in the joints.
 */
function pavingTexture(seed, tone) {
  const key = `paving${seed}${tone}`;
  if (textures.has(key)) return textures.get(key);
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const d = canvas.getContext('2d');
  const rnd = seeded(seed);
  // Joints inside a tile are a mid grey, so the darker gaps between tiles still show where each cell is.
  d.fillStyle = SOFT_JOINT;
  d.fillRect(0, 0, size, size);
  const rowAt = size * (0.4 + rnd() * 0.2);
  const stones = [];
  [
    [0, rowAt],
    [rowAt, size],
  ].forEach(([top, bottom]) => {
    const cuts = rnd() < 0.5 ? [size * (0.38 + rnd() * 0.24)] : [size * (0.26 + rnd() * 0.12), size * (0.6 + rnd() * 0.14)];
    [0, ...cuts].forEach((left, k, starts) => stones.push([left, top, (starts[k + 1] ?? size) - left, bottom - top]));
  });
  stones.forEach(([left, top, width, height]) => {
    const gap = 5;
    const [x, y, w, h] = [left + gap, top + gap, width - gap * 2, height - gap * 2];
    // Each stone: its own grey, leaning warm or cool, with rough corners instead of a neat rectangle.
    const shade = tone + (rnd() - 0.5) * 38;
    const warm = (rnd() - 0.5) * 16;
    const jag = () => (rnd() - 0.5) * 9;
    d.fillStyle = `rgb(${shade + warm},${shade},${shade - warm})`;
    d.beginPath();
    d.moveTo(x + 8 + jag(), y + jag());
    d.lineTo(x + w - 8 + jag(), y + jag());
    d.lineTo(x + w + jag(), y + 8 + jag());
    d.lineTo(x + w + jag(), y + h - 8 + jag());
    d.lineTo(x + w - 8 + jag(), y + h + jag());
    d.lineTo(x + 8 + jag(), y + h + jag());
    d.lineTo(x + jag(), y + h - 8 + jag());
    d.lineTo(x + jag(), y + 8 + jag());
    d.closePath();
    d.fill();
    d.save();
    d.clip();
    // Grain: many light and dark flecks, and a few shallow pits.
    for (let n = 0; n < 90; n++) {
      d.fillStyle = n % 2 ? `rgba(255,255,255,${0.05 + rnd() * 0.1})` : `rgba(40,38,44,${0.05 + rnd() * 0.12})`;
      d.fillRect(x + rnd() * w, y + rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3);
    }
    for (let n = 0; n < 3; n++) {
      d.fillStyle = 'rgba(40,38,44,0.16)';
      d.beginPath();
      d.ellipse(x + rnd() * w, y + rnd() * h, 2 + rnd() * 4, 1.5 + rnd() * 2.5, rnd() * 3, 0, Math.PI * 2);
      d.fill();
    }
    if (rnd() < 0.35) {
      // A hairline crack wandering across the stone.
      d.strokeStyle = 'rgba(40,38,44,0.4)';
      d.lineWidth = 1.2;
      d.beginPath();
      let [cx, cy] = [x + rnd() * w * 0.3, y + rnd() * h];
      d.moveTo(cx, cy);
      for (let step = 0; step < 5; step++) {
        cx += w * 0.16;
        cy += (rnd() - 0.5) * h * 0.3;
        d.lineTo(cx, cy);
      }
      d.stroke();
    }
    // A lit top edge and a shaded bottom edge give each stone a little thickness.
    d.fillStyle = 'rgba(255,255,255,0.3)';
    d.fillRect(x, y, w, 4);
    d.fillStyle = 'rgba(30,28,34,0.28)';
    d.fillRect(x, y + h - 5, w, 5);
    d.restore();
  });
  // Moss in a few joints.
  for (let n = 0; n < 5; n++) {
    d.fillStyle = `rgba(104,150,88,${0.45 + rnd() * 0.3})`;
    d.beginPath();
    d.ellipse(rnd() * size, rnd() < 0.5 ? rowAt + (rnd() - 0.5) * 6 : rnd() * size, 5 + rnd() * 9, 3 + rnd() * 3, 0, 0, Math.PI * 2);
    d.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textures.set(key, texture);
  return texture;
}

/**
 * Medieval rubble masonry for the walls and towers (owner's reference: a hand-drawn medieval castle): rough
 * sandstone blocks of uneven sizes in warm creams and tans, with a few grey ones, and deep mortar lines.
 */
function brickTexture() {
  if (textures.has('brick')) return textures.get('brick');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const d = canvas.getContext('2d');
  const rnd = seeded(5);
  d.fillStyle = '#7d6a54';
  d.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 5; row++) {
    const top = row * 51.2;
    let x = -rnd() * 40;
    while (x < 256) {
      const width = 34 + rnd() * 44;
      const grey = rnd() < 0.22;
      const shade = (rnd() - 0.5) * 30;
      const [r, g, b] = grey ? [176 + shade, 170 + shade, 160 + shade] : [222 + shade, 200 + shade, 158 + shade];
      d.fillStyle = `rgb(${r},${g},${b})`;
      d.beginPath();
      d.roundRect(x + 2.5, top + 2.5, width - 5, 46, 7);
      d.fill();
      d.fillStyle = 'rgba(255,255,255,0.28)';
      d.fillRect(x + 6, top + 4, width - 12, 3);
      d.fillStyle = 'rgba(70,50,30,0.22)';
      d.fillRect(x + 6, top + 43, width - 12, 4);
      for (let n = 0; n < 10; n++) {
        d.fillStyle = n % 2 ? 'rgba(255,255,255,0.14)' : 'rgba(70,50,30,0.16)';
        d.fillRect(x + 5 + rnd() * (width - 10), top + 6 + rnd() * 38, 2 + rnd() * 3, 2 + rnd() * 2);
      }
      x += width;
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  textures.set('brick', texture);
  return texture;
}

/** The repeating brick map for a surface `across` by `up` (in board units). */
export function useBricks(across, up) {
  return useMemo(() => {
    const texture = brickTexture().clone();
    texture.needsUpdate = true;
    texture.repeat.set(across * 1.1, up * 1.1);
    return texture;
  }, [across, up]);
}

/** A courtyard paving tile: rough grey stones in two tones (a checker), warmed by torchlight where light passes. */
export function Flagstone({ position, x, y, isLit, glow, onClick, cell }) {
  const texture = useMemo(() => {
    const paving = pavingTexture(1 + ((x * 3 + y * 7) % 6), (x + y) % 2 ? 196 : 168).clone();
    paving.needsUpdate = true;
    paving.center.set(0.5, 0.5);
    paving.rotation = ((x + y * 3) % 4) * (Math.PI / 2);
    return paving;
  }, [x, y]);
  return (
    <mesh position={position} receiveShadow castShadow userData={{ cell }} onClick={onClick}>
      <boxGeometry args={[0.94, 0.08, 0.94]} />
      <meshStandardMaterial map={texture} bumpMap={texture} bumpScale={0.6} roughness={0.95} emissive={glow} emissiveIntensity={isLit ? 0.26 : 0} />
    </mesh>
  );
}

/** A stretch of low brick wall with battlements, `length` long, running along local x; a banner hangs on it. */
function Battlement({ position, rotation, length, banner }) {
  const merlons = Math.max(2, Math.round(length / 0.5));
  const bricks = useBricks(length, 0.5);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.5, 0.3]} />
        <meshStandardMaterial map={bricks} roughness={0.9} />
      </mesh>
      {Array.from({ length: merlons }, (_, k) => (
        <mesh key={k} position={[-length / 2 + (length / merlons) * (k + 0.5), 0.58, 0]} castShadow>
          <boxGeometry args={[(length / merlons) * 0.5, 0.16, 0.3]} />
          <meshStandardMaterial color={WALL} roughness={0.9} />
        </mesh>
      ))}
      {[-0.25, 0.25].map((at, k) => (
        <group key={at} position={[length * at, 0.3, 0.155]}>
          <mesh>
            <planeGeometry args={[0.26, 0.36]} />
            <meshStandardMaterial color={banner[k]} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0.002]} rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[0.11, 0.11]} />
            <meshStandardMaterial color="#f0c14e" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * A round stone tower as in a medieval castle: rubble masonry, arrow slits and a door, a wooden gallery under a tall
 * red-tiled roof with a wide eave, and a little flag.
 */
function Tower({ position, flag = '#f0c14e' }) {
  const bricks = useBricks(1.9, 1.2);
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.38, 1.2, 20]} />
        <meshStandardMaterial map={bricks} roughness={0.95} />
      </mesh>
      {[0.6, Math.PI / 2 + 0.3].map((turn) => (
        <group key={turn} rotation={[0, turn, 0]}>
          <mesh position={[0, 0.72, 0.345]}>
            <planeGeometry args={[0.06, 0.22]} />
            <meshBasicMaterial color="#3a2a1e" />
          </mesh>
          <mesh position={[0, 0.17, 0.372]}>
            <planeGeometry args={[0.17, 0.3]} />
            <meshStandardMaterial color={TIMBER} roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* The wooden gallery: a dark timber ring with small posts, wider than the tower. */}
      <mesh position={[0, 1.27, 0]} castShadow>
        <cylinderGeometry args={[0.43, 0.4, 0.2, 20]} />
        <meshStandardMaterial color={TIMBER} roughness={0.85} />
      </mesh>
      {Array.from({ length: 10 }, (_, k) => (
        <mesh key={k} position={[Math.cos((k / 10) * Math.PI * 2) * 0.435, 1.27, Math.sin((k / 10) * Math.PI * 2) * 0.435]}>
          <boxGeometry args={[0.035, 0.2, 0.035]} />
          <meshStandardMaterial color="#8a5a34" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.42, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.52, 0.1, 20]} />
        <meshStandardMaterial color="#a8432c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <coneGeometry args={[0.42, 0.8, 20]} />
        <meshStandardMaterial color={ROOF} roughness={0.75} />
      </mesh>
      <mesh position={[0, 2.36, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.26, 6]} />
        <meshStandardMaterial color="#4a4038" />
      </mesh>
      <mesh position={[0.1, 2.43, 0]}>
        <planeGeometry args={[0.2, 0.12]} />
        <meshStandardMaterial color={flag} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** A round garden bush with a few flowers. */
function Bush({ position, flower = '#ff9d9d' }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]} scale={[1, 0.75, 1]} castShadow>
        <sphereGeometry args={[0.2, 14, 10]} />
        <meshStandardMaterial color="#6fb06a" roughness={0.9} />
      </mesh>
      {[0, 2.1, 4.2].map((turn) => (
        <mesh key={turn} position={[Math.cos(turn) * 0.13, 0.2, Math.sin(turn) * 0.13]}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial color={flower} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function CastleRoom({ level }) {
  const width = level.width + CASTLE_PAD * 2;
  const depth = level.height + CASTLE_PAD * 2;
  const base = useMemo(() => roundedSlab(width, depth, BASE_DEPTH, 0.4), [width, depth]);
  const yard = useMemo(() => roundedSlab(level.width + 0.5, level.height + 0.5, 0.04, 0.12), [level]);
  const back = -(level.height / 2 + 0.66);
  const side = -(level.width / 2 + 0.66);
  return (
    <group>
      <GroundShadow width={width} depth={depth} y={-BASE_DEPTH - 0.1} />
      <mesh geometry={base} position={[0, -0.02, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={LAWN} roughness={0.95} />
      </mesh>
      <mesh geometry={yard} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color={MORTAR} roughness={1} />
      </mesh>
      <Battlement position={[0.2, 0, back]} length={level.width - 0.4} banner={['#c9553a', '#3f7f6a']} />
      <Battlement position={[side, 0, 0.2]} rotation={[0, Math.PI / 2, 0]} length={level.height - 0.4} banner={['#3f7f6a', '#c9553a']} />
      <Tower position={[side, 0, back]} />
      <Tower position={[level.width / 2 + 0.5, 0, back]} flag="#ff9d9d" />
      <Bush position={[level.width / 2 + 0.6, 0, 0.3]} />
      <Bush position={[level.width / 2 + 0.62, 0, level.height / 2 - 0.5]} flower="#f0c14e" />
      <Bush position={[-0.8, 0, level.height / 2 + 0.62]} flower="#c3a2f5" />
      <Bush position={[1.1, 0, level.height / 2 + 0.64]} />
    </group>
  );
}
