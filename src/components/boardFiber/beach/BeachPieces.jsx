/*
 * The Beach theme's pieces: a lighthouse for the light, mirrors in white frames that turn on a
 * life ring (or stand on a sandcastle in a teal frame when they can't), amber glass in coral frames for splitters,
 * glass fishing floats on a coil of rope for color glass, and rows of striped beach huts that join up as walls.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundMirror } from '../library/LibraryPieces.jsx';
import { GlassBell } from '../themes/ColorGlass.jsx';
import { Facing, Standing, Turning } from '../themes/Stands.jsx';
import { Flare, amberGlass, glow, mirrorM, wallBeside } from '../themes/shared.jsx';

const paint = (color) => <meshStandardMaterial color={color} roughness={0.55} />;
const whiteFrame = (color = '#f1e9d8') => paint(color === '#e8c06a' ? '#e8604a' : color);
const tealFrame = (color = '#2f8f8a') => paint(color === '#e8c06a' ? '#fbf7ee' : color);
const coralFrame = (color = '#ff7f6e') => paint(color === '#e8c06a' ? '#fbf7ee' : color);

/** A life ring lying flat: white, with four red bands. */
function LifeRing() {
  return (
    <group position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh castShadow receiveShadow>
        <torusGeometry args={[0.27, 0.085, 12, 32]} />
        {paint('#f1e9d8')}
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} rotation={[0, 0, (k * Math.PI) / 2 + Math.PI / 4]} position={[Math.cos((k * Math.PI) / 2 + Math.PI / 4) * 0.27, Math.sin((k * Math.PI) / 2 + Math.PI / 4) * 0.27, 0]}>
          <torusGeometry args={[0.088, 0.03, 8, 16]} />
          {paint('#e8604a')}
        </mesh>
      ))}
    </group>
  );
}

/** A little sandcastle mound, turned out of a bucket. */
const Sandcastle = () => (
  <group>
    <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.24, 0.32, 0.2, 16]} />
      <meshStandardMaterial color="#e3b874" roughness={1} />
    </mesh>
    {[0, 1, 2, 3, 4, 5].map((k) => (
      <mesh key={k} position={[Math.cos(k * 1.047) * 0.2, 0.23, Math.sin(k * 1.047) * 0.2]}>
        <boxGeometry args={[0.07, 0.06, 0.07]} />
        <meshStandardMaterial color="#e3b874" roughness={1} />
      </mesh>
    ))}
  </group>
);

const onRing = (pane) =>
  function RingPiece({ turn }) {
    return (
      <Turning turn={turn}>
        <LifeRing />
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.2, 10]} />
          {paint('#f1e9d8')}
        </mesh>
        <group position={[0, 0.5, 0]}>{pane}</group>
      </Turning>
    );
  };
const onSandcastle = (pane) =>
  function SandcastlePiece({ turn }) {
    return (
      <Standing turn={turn}>
        <Sandcastle />
        <group position={[0, 0.5, 0]}>{pane}</group>
      </Standing>
    );
  };

export const RingMirror = onRing(<RoundMirror frame={whiteFrame} glass={mirrorM} />);
export const SandcastleMirror = onSandcastle(<RoundMirror frame={tealFrame} glass={mirrorM} knob={false} postsFrom={-0.14} />);
export const RingSplitter = onRing(<RoundMirror frame={coralFrame} glass={amberGlass} streaks={false} />);
export const SandcastleSplitter = onSandcastle(<RoundMirror frame={coralFrame} glass={amberGlass} streaks={false} knob={false} postsFrom={-0.14} />);

/** Color glass: a glass fishing float on a coil of rope. */
export const GlassFloat = ({ tile }) => (
  <GlassBell tile={tile}>
    {[0.3, 0.24].map((radius, k) => (
      <mesh key={radius} position={[0, 0.05 + k * 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[radius, 0.045, 8, 24]} />
        <meshStandardMaterial color="#d9b98a" roughness={0.9} />
      </mesh>
    ))}
  </GlassBell>
);

const HUT_COLORS = ['#f27f7f', '#4fb5a6', '#f2a94a', '#7fb0ea', '#e88fc0'];
const stripes = new Map();

/** A beach hut's striped boards: white and one color, painted on a canvas. */
function stripeTexture(color) {
  if (stripes.has(color)) return stripes.get(color);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const d = canvas.getContext('2d');
  for (let k = 0; k < 6; k++) {
    d.fillStyle = k % 2 ? '#f3ead8' : color;
    d.fillRect((k * 128) / 6, 0, 128 / 6 + 1, 128);
  }
  d.fillStyle = 'rgba(60,40,30,0.1)';
  for (let k = 1; k < 6; k++) d.fillRect((k * 128) / 6 - 1, 0, 2, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  stripes.set(color, texture);
  return texture;
}

const HUT_HEIGHT = 0.46;

/**
 * A wall: a striped beach hut that fills its whole square, so huts on neighboring squares join into one long row,
 * each in its own color. The roof ridge runs along the row.
 */
export function BeachHut({ tile, level }) {
  const isWall = wallBeside(level, tile);
  const alongZ = !isWall(-1, 0) && !isWall(1, 0) && (isWall(0, -1) || isWall(0, 1));
  const color = HUT_COLORS[(tile.x * 2 + tile.y * 3) % HUT_COLORS.length];
  const roof = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.56, 0);
    shape.lineTo(0, 0.3);
    shape.lineTo(0.56, 0);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5);
  }, []);
  return (
    <group rotation={[0, alongZ ? 0 : Math.PI / 2, 0]}>
      <mesh position={[0, HUT_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, HUT_HEIGHT, 1]} />
        <meshStandardMaterial map={stripeTexture(color)} roughness={0.7} />
      </mesh>
      <mesh geometry={roof} position={[0, HUT_HEIGHT, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** The light: a little lighthouse, its lamp room open towards the way the light leaves (local +x). */
export function Lighthouse({ tile, turn }) {
  return (
    <Facing tile={tile} turn={turn}>
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.33, 0.08, 20]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3].map((band) => (
        <mesh key={band} position={[0, 0.16 + band * 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.2 - band * 0.022, 0.222 - band * 0.022, 0.16, 20]} />
          {paint(band % 2 ? '#e8604a' : '#fbf7ee')}
        </mesh>
      ))}
      <mesh position={[0, 0.74, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 20]} />
        {paint('#4a4a52')}
      </mesh>
      {/* The lamp room: dark behind, glowing glass in front. */}
      <mesh position={[0, 0.86, 0]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.2, 16, 1, true, Math.PI / 2 - 1.1, 2.2]} />
        <meshStandardMaterial color="#4a4a52" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.86, 0]}>
        <sphereGeometry args={[0.085, 16, 12]} />
        <meshBasicMaterial color={glow('#fff0c8', 3)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow>
        <coneGeometry args={[0.17, 0.16, 16]} />
        {paint('#e8604a')}
      </mesh>
      <Flare position={[0.12, 0.86, 0]} size={0.8} />
      <pointLight position={[0.25, 0.86, 0]} color="#ffe2a8" intensity={3.4} distance={3} />
    </Facing>
  );
}
