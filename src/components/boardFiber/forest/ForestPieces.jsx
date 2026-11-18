/*
 * The Forest theme's pieces (in preview): a campfire for the light, mirrors in pale birch frames that turn on a
 * slice of tree stump (or stand on a boulder in a dark bark frame when they can't), amber glass for splitters,
 * glowing glass mushrooms for color glass, and palisades of upright logs that join up as walls.
 */
import * as THREE from 'three';
import { RoundMirror } from '../library/LibraryPieces.jsx';
import { barkTexture } from '../pond/PondPieces.jsx';
import { GLASS, ShapeMark } from '../themes/ColorGlass.jsx';
import Flame from '../themes/Flame.jsx';
import { Facing, Standing, Turning } from '../themes/Stands.jsx';
import { Flare, amberGlass, brassM, mirrorM } from '../themes/shared.jsx';

const birchFrame = (color = '#f1ece0') => <meshStandardMaterial color={color === '#e8c06a' ? '#3d342c' : color} roughness={0.7} />;
const barkFrame = (color = '#4f3b2c') => <meshStandardMaterial color={color === '#e8c06a' ? '#8a6a4a' : color} roughness={0.85} />;
const sapFrame = () => brassM('#e0a23a');

/** A slice of tree stump: bark round the side, pale wood with growth rings on top. */
function StumpSlice({ radius = 0.34, height = 0.1 }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.06, height, 20]} />
        <meshStandardMaterial map={barkTexture()} color="#9a6b45" roughness={0.95} />
      </mesh>
      <mesh position={[0, height + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.92, 20]} />
        <meshStandardMaterial color="#e6c794" roughness={0.8} />
      </mesh>
      {[0.7, 0.45, 0.2].map((ring) => (
        <mesh key={ring} position={[0, height + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * ring, radius * (ring + 0.05), 20]} />
          <meshStandardMaterial color="#b98d58" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

const Boulder = () => (
  <group>
    <mesh position={[0, 0.08, 0]} scale={[1, 0.5, 0.82]} castShadow receiveShadow>
      <icosahedronGeometry args={[0.3, 1]} />
      <meshStandardMaterial color="#8f8f96" roughness={0.9} flatShading />
    </mesh>
    <mesh position={[0.08, 0.17, 0.05]} scale={[1, 0.3, 0.8]}>
      <icosahedronGeometry args={[0.13, 1]} />
      <meshStandardMaterial color="#6f9a5a" roughness={1} flatShading />
    </mesh>
  </group>
);

const onStump = (pane) =>
  function StumpPiece({ turn }) {
    return (
      <Turning turn={turn}>
        <StumpSlice />
        <group position={[0, 0.44, 0]}>{pane}</group>
      </Turning>
    );
  };
const onBoulder = (pane) =>
  function BoulderPiece({ turn }) {
    return (
      <Standing turn={turn}>
        <Boulder />
        <group position={[0, 0.46, 0]}>{pane}</group>
      </Standing>
    );
  };

export const StumpMirror = onStump(<RoundMirror frame={birchFrame} glass={mirrorM} />);
export const BoulderMirror = onBoulder(<RoundMirror frame={barkFrame} glass={mirrorM} knob={false} postsFrom={-0.14} />);
export const StumpSplitter = onStump(<RoundMirror frame={sapFrame} glass={amberGlass} streaks={false} />);
export const BoulderSplitter = onBoulder(<RoundMirror frame={sapFrame} glass={amberGlass} streaks={false} knob={false} postsFrom={-0.14} />);

/** Color glass: a glowing glass mushroom, its cap in the light's color with that color's shape on top. */
export function GlassMushroom({ tile }) {
  const { color, shape } = GLASS[tile.color] ?? GLASS.sun;
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.4, 14]} />
        <meshStandardMaterial color="#f6eedd" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.38, 0]} scale={[1, 0.75, 1]}>
        <sphereGeometry args={[0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color={color} roughness={0.1} clearcoat={1} transparent opacity={0.7} emissive={color} emissiveIntensity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1.3, 2.6, 3.9, 5.2].map((turn) => (
        <mesh key={turn} position={[Math.cos(turn) * 0.2, 0.52, Math.sin(turn) * 0.2]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshBasicMaterial color="#fffbe8" />
        </mesh>
      ))}
      <group position={[0, 0.74, 0]}>
        <ShapeMark shape={shape} color={color} />
      </group>
    </group>
  );
}

const STAKE = 0.166;
const STAKE_BARKS = ['#9a6b45', '#b07d52', '#84583a'];

/**
 * A wall: a palisade of nine upright logs with pointed tips that fills its whole square, so palisades on
 * neighboring squares join into one long fence.
 */
export function Palisade({ tile }) {
  return (
    <group>
      {[-1, 0, 1].flatMap((x) =>
        [-1, 0, 1].map((z) => {
          const height = 0.5 + (((tile.x + x) * 3 + (tile.y + z) * 5 + 9) % 3) * 0.05;
          const bark = STAKE_BARKS[((tile.x + x) * 2 + (tile.y + z) + 9) % STAKE_BARKS.length];
          return (
            <group key={`${x}${z}`} position={[x * STAKE * 2, 0, z * STAKE * 2]}>
              <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[STAKE, STAKE, height, 12]} />
                <meshStandardMaterial map={barkTexture()} color={bark} roughness={0.95} />
              </mesh>
              <mesh position={[0, height + 0.08, 0]} castShadow>
                <coneGeometry args={[STAKE, 0.16, 12]} />
                <meshStandardMaterial color="#e6c794" roughness={0.85} />
              </mesh>
            </group>
          );
        }),
      )}
    </group>
  );
}

/** The light: a campfire in a ring of stones, with a slab of bark behind it that throws the light forward. */
export function Campfire({ tile, turn, calm }) {
  return (
    <Facing tile={tile} turn={turn}>
      {Array.from({ length: 8 }, (_, k) => (
        <mesh key={k} position={[Math.cos((k / 8) * Math.PI * 2) * 0.27, 0.05, Math.sin((k / 8) * Math.PI * 2) * 0.27]} scale={[1, 0.7, 1]} castShadow>
          <icosahedronGeometry args={[0.075, 0]} />
          <meshStandardMaterial color={k % 2 ? '#8f8f96' : '#a9a8ae'} roughness={0.9} flatShading />
        </mesh>
      ))}
      {[0.5, -0.5, 1.6].map((spin) => (
        <mesh key={spin} position={[0, 0.07, 0]} rotation={[0, spin, Math.PI / 2 - 0.25]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.36, 8]} />
          <meshStandardMaterial color="#6b4630" roughness={0.9} />
        </mesh>
      ))}
      {/* The reflector: a curved slab of bark behind the fire, open towards the way the light goes. */}
      <mesh position={[-0.05, 0.3, 0]} rotation={[0, Math.PI, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.6, 16, 1, true, Math.PI / 2 - 0.9, 1.8]} />
        <meshStandardMaterial map={barkTexture()} color="#9a6b45" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, 0.14, 0]} scale={3.6}>
        <Flame calm={calm} />
      </group>
      <Flare position={[0.05, 0.42, 0]} size={1} />
      <pointLight position={[0.1, 0.45, 0]} color="#ffb866" intensity={4} distance={3.2} />
    </Facing>
  );
}
