/*
 * The Forest theme's pieces (in preview): a campfire for the light, mirrors in pale birch frames that turn on a
 * slice of tree stump (or stand on a boulder in a dark bark frame when they can't), amber glass for splitters,
 * glowing glass mushrooms for color glass, and clumps of trees that join up into thick forest as walls.
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

export const StumpMirror = onStump(<RoundMirror legs={1} frame={birchFrame} glass={mirrorM} />);
export const BoulderMirror = onBoulder(<RoundMirror frame={barkFrame} glass={mirrorM} knob={false} postsFrom={-0.14} />);
export const StumpSplitter = onStump(<RoundMirror legs={1} frame={sapFrame} glass={amberGlass} streaks={false} />);
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
        <meshPhysicalMaterial
          color={color}
          roughness={0.1}
          clearcoat={1}
          transparent
          opacity={0.7}
          emissive={color}
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
        />
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

const PINE_GREENS = ['#2f6b4f', '#3a7d5c', '#28604a'];
const LEAF_COLORS = ['#e8964a', '#d9553f', '#f0c14e', '#c9703a'];

/** A little pine: a short trunk and three tiers of needles. */
function SmallPine({ height, green }) {
  return (
    <group>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.065, 0.18, 8]} />
        <meshStandardMaterial color="#6b4630" roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((tier) => (
        <mesh key={tier} position={[0, 0.26 + tier * height * 0.24, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.29 - tier * 0.07, height * 0.42, 10]} />
          <meshStandardMaterial color={green} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** A little leafy tree in autumn colors: a trunk and a round crown made of three puffs. */
function LeafyTree({ height, color }) {
  return (
    <group>
      <mesh position={[0, height * 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, height * 0.5, 8]} />
        <meshStandardMaterial color="#7a5232" roughness={0.9} />
      </mesh>
      {[
        [0, height * 0.72, 0, 0.27],
        [0.12, height * 0.6, 0.08, 0.19],
        [-0.11, height * 0.62, -0.07, 0.2],
      ].map(([x, y, z, radius], k) => (
        <mesh key={k} position={[x, y, z]} castShadow receiveShadow>
          <icosahedronGeometry args={[radius, 1]} />
          <meshStandardMaterial color={color} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/**
 * A wall: a clump of four trees that fills its whole square (owner's pick: real trees, not trunks), so clumps on
 * neighboring squares join into one thick stretch of forest. Dark pines mix with leafy trees in autumn colors, so
 * the wall never blends into the green floor.
 */
export function TreeClump({ tile }) {
  return (
    <group>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => {
          // Seeded by where the tree stands on the board, so a joined wall looks like one wood, never a repeat.
          const seed = (tile.x * 2 + (x + 1) / 2) * 7 + (tile.y * 2 + (z + 1) / 2) * 13;
          const height = 0.78 + (seed % 4) * 0.07;
          return (
            <group key={`${x}${z}`} position={[x * 0.25 + ((seed % 3) - 1) * 0.02, 0, z * 0.25 + ((seed % 5) - 2) * 0.012]}>
              {seed % 3 === 0 ? (
                <LeafyTree height={height} color={LEAF_COLORS[seed % LEAF_COLORS.length]} />
              ) : (
                <SmallPine height={height} green={PINE_GREENS[seed % PINE_GREENS.length]} />
              )}
            </group>
          );
        }),
      )}
      {/* Undergrowth, so no light slips between the trunks. */}
      <mesh position={[0, 0.11, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.98, 0.22, 0.98]} />
        <meshStandardMaterial color="#3f7d57" roughness={1} />
      </mesh>
    </group>
  );
}

/** The light: a campfire in a ring of stones, with a slab of bark behind it that throws the light forward. */
export function Campfire({ tile, turn, calm }) {
  return (
    <Facing tile={tile} turn={turn}>
      <group scale={1.25}>
        {Array.from({ length: 8 }, (_, k) => (
          <mesh
            key={k}
            position={[Math.cos((k / 8) * Math.PI * 2) * 0.27, 0.05, Math.sin((k / 8) * Math.PI * 2) * 0.27]}
            scale={[1, 0.7, 1]}
            castShadow
          >
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
      </group>
      <pointLight position={[0.1, 0.5, 0]} color="#ffb866" intensity={4} distance={3.2} />
    </Facing>
  );
}
