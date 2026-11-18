/*
 * The Castle theme's pieces: a burning torch for the light, polished knights' shields as mirrors (on a stone
 * turntable when they turn, on a stone pillar when they can't), a clear crystal pane in a gold stand for splitters,
 * little stained-glass towers that color the light passing through, and stacks of stone blocks as walls.
 */
import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { DIRECTION_ANGLE, mirrorAngle } from '../library/LibraryPieces.jsx';
import Flame from '../themes/Flame.jsx';
import { Gear, Streaks, brassM, mirrorM } from '../themes/shared.jsx';

const STONE = '#cfc5dc';
const STONE_DARK = '#b3a7c6';
const IRON = '#4a4038';
const stoneM = (color = STONE) => <meshStandardMaterial color={color} roughness={0.9} />;
const ironM = <meshStandardMaterial color={IRON} roughness={0.5} metalness={0.5} />;

/** A knight's shield outline (flat top, pointed foot), centered, about 0.56 wide and 0.62 tall. */
function shieldShape(scale = 1) {
  const shape = new THREE.Shape();
  const w = 0.28 * scale;
  const top = 0.28 * scale;
  shape.moveTo(-w, top);
  shape.lineTo(w, top);
  shape.lineTo(w, 0);
  shape.quadraticCurveTo(w, -0.24 * scale, 0, -0.34 * scale);
  shape.quadraticCurveTo(-w, -0.24 * scale, -w, 0);
  shape.closePath();
  return shape;
}

/** The shield: a gold rim with a mirror-bright face on both sides. */
function Shield({ glass = mirrorM, streaks = true }) {
  const rim = useMemo(() => new THREE.ExtrudeGeometry(shieldShape(), { depth: 0.03, bevelEnabled: false }).translate(0, 0, -0.015), []);
  const face = useMemo(() => new THREE.ShapeGeometry(shieldShape(0.86)), []);
  return (
    <group>
      <mesh geometry={rim} castShadow>
        {brassM()}
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} geometry={face} position={[0, 0, side * 0.017]} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
          {glass}
        </mesh>
      ))}
      {streaks && <Streaks w={0.42} h={0.36} z={0.02} />}
    </group>
  );
}

/** A piece that turns: on a round stone turntable that swings with it. */
function OnTurntable({ turn, children }) {
  const rotor = useRef();
  const angle = mirrorAngle(turn);
  useEffect(() => {
    gsap.to(rotor.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.7)' });
  }, [angle]);
  return (
    <group ref={rotor} rotation={[0, angle, 0]}>
      <Gear r={0.34} teeth={8} h={0.07} color={STONE_DARK} metalness={0} roughness={0.9} />
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.2, 10]} />
        {ironM}
      </mesh>
      <group position={[0, 0.56, 0]}>{children}</group>
    </group>
  );
}

/** A piece that can't turn: bolted to a square stone pillar (no turntable). */
function OnPillar({ turn, children }) {
  return (
    <group rotation={[0, mirrorAngle(turn), 0]}>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.06, 0.4]} />
        {stoneM(STONE_DARK)}
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.22, 0.28]} />
        {stoneM()}
      </mesh>
      <group position={[0, 0.6, 0]}>{children}</group>
    </group>
  );
}

export const ShieldMirror = ({ turn }) => (
  <OnTurntable turn={turn}>
    <Shield />
  </OnTurntable>
);

export const PillarShield = ({ turn }) => (
  <OnPillar turn={turn}>
    <Shield />
  </OnPillar>
);

/** A splitter: a clear crystal pane cut like a diamond, in a gold frame (light passes and bounces). */
function CrystalPane() {
  const frame = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.34);
    shape.lineTo(0.27, 0);
    shape.lineTo(0, -0.34);
    shape.lineTo(-0.27, 0);
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(0, 0.28);
    hole.lineTo(-0.22, 0);
    hole.lineTo(0, -0.28);
    hole.lineTo(0.22, 0);
    hole.closePath();
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false }).translate(0, 0, -0.015);
  }, []);
  const pane = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.28);
    shape.lineTo(0.22, 0);
    shape.lineTo(0, -0.28);
    shape.lineTo(-0.22, 0);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
  return (
    <group>
      <mesh geometry={frame} castShadow>
        {brassM()}
      </mesh>
      <mesh geometry={pane}>
        <meshPhysicalMaterial color="#eaf6ff" roughness={0.04} clearcoat={1} transparent opacity={0.4} emissive="#cfe9ff" emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export const CrystalSplitter = ({ turn }) => (
  <OnTurntable turn={turn}>
    <CrystalPane />
  </OnTurntable>
);

export const PillarCrystal = ({ turn }) => (
  <OnPillar turn={turn}>
    <CrystalPane />
  </OnPillar>
);

/** Each light's stained glass, and the shape that names it (so color is never the only clue). */
const GLASS = {
  sun: { color: '#ffcf4a', shape: 'diamond' },
  coral: { color: '#ff7a68', shape: 'round' },
  lime: { color: '#7bd464', shape: 'triangle' },
  sky: { color: '#63b6ee', shape: 'square' },
};

function ShapeMark({ shape, color }) {
  const material = <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.4} />;
  if (shape === 'round')
    return (
      <mesh>
        <sphereGeometry args={[0.07, 14, 10]} />
        {material}
      </mesh>
    );
  if (shape === 'triangle')
    return (
      <mesh>
        <coneGeometry args={[0.08, 0.13, 3]} />
        {material}
      </mesh>
    );
  if (shape === 'square')
    return (
      <mesh>
        <boxGeometry args={[0.11, 0.11, 0.11]} />
        {material}
      </mesh>
    );
  return (
    <mesh scale={[1, 1.3, 1]}>
      <octahedronGeometry args={[0.07, 0]} />
      {material}
    </mesh>
  );
}

/** Color glass: a little stained-glass tower. Light passing through from any side leaves in its color. */
export function StainedGlassTower({ tile }) {
  const { color, shape } = GLASS[tile.color] ?? GLASS.sun;
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        {stoneM(STONE_DARK)}
      </mesh>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * 0.2, 0.4, z * 0.2]} castShadow>
            <boxGeometry args={[0.06, 0.6, 0.06]} />
            {stoneM()}
          </mesh>
        )),
      )}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.36, 0.58, 0.36]} />
        <meshPhysicalMaterial color={color} roughness={0.08} clearcoat={1} transparent opacity={0.62} emissive={color} emissiveIntensity={0.45} />
      </mesh>
      {/* Lead lines across the glass, like a real window. */}
      {[0.3, 0.5].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[0.375, 0.015, 0.375]} />
          {ironM}
        </mesh>
      ))}
      <mesh position={[0, 0.73, 0]} castShadow>
        <boxGeometry args={[0.5, 0.07, 0.5]} />
        {stoneM()}
      </mesh>
      <group position={[0, 0.86, 0]}>
        <ShapeMark shape={shape} color={color} />
      </group>
    </group>
  );
}

/** A wall: stacked stone blocks with a small banner. */
export function StoneBlocks() {
  return (
    <group>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.32, 0.6]} />
        {stoneM()}
      </mesh>
      <mesh position={[-0.06, 0.45, 0.02]} rotation={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.26, 0.5]} />
        {stoneM(STONE_DARK)}
      </mesh>
      <mesh position={[0.22, 0.78, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.4, 6]} />
        {ironM}
      </mesh>
      <mesh position={[0.31, 0.9, 0]}>
        <planeGeometry args={[0.18, 0.13]} />
        <meshStandardMaterial color="#e8839a" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** The torch: an iron stand holding a burning torch that leans the way its light leaves (local +x). */
function TorchBody({ calm }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.1, 0.44]} />
        {stoneM(STONE_DARK)}
      </mesh>
      <mesh position={[-0.06, 0.26, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.34, 8]} />
        {ironM}
      </mesh>
      <group position={[-0.06, 0.42, 0]} rotation={[0, 0, -0.75]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.03, 0.34, 10]} />
          <meshStandardMaterial color="#7a5232" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.075, 0.055, 0.07, 12]} />
          {ironM}
        </mesh>
      </group>
      <group position={[0.17, 0.62, 0]} scale={2.3}>
        <Flame calm={calm} />
      </group>
      <pointLight position={[0.2, 0.6, 0]} color="#ffb866" intensity={2.6} distance={2.6} />
    </group>
  );
}

/** The light: a torch leaning the way its light leaves; a turning one swings on a stone turntable. */
export function Torch({ tile, turn, calm }) {
  const head = useRef();
  const angle = (DIRECTION_ANGLE[tile.dir] ?? 0) - (tile.turnable ? (turn % 2) * (Math.PI / 2) : 0);
  useEffect(() => {
    gsap.to(head.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.6)' });
  }, [angle]);
  return (
    <group ref={head} rotation={[0, angle, 0]}>
      {tile.turnable && <Gear r={0.36} teeth={8} h={0.07} color={STONE_DARK} metalness={0} roughness={0.9} />}
      <group position={[0, tile.turnable ? 0.07 : 0, 0]}>
        <TorchBody calm={calm} />
      </group>
    </group>
  );
}
