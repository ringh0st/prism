/*
 * The Castle theme's pieces: a burning torch for the light, polished knights' shields as mirrors (on a stone
 * turntable when they turn, on a stone pillar when they can't), a clear crystal pane in a gold stand for splitters,
 * little stained-glass towers that color the light passing through, and stretches of castle wall that join up as walls.
 */
import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { TILE } from '../../../game/constants.js';
import { DIRECTION_ANGLE, mirrorAngle } from '../library/LibraryPieces.jsx';
import { useBricks } from './CastleRoom.jsx';
import Flame from '../themes/Flame.jsx';
import { Flare, Gear, Streaks, brassM, mirrorM } from '../themes/shared.jsx';

const STONE = '#d9c8a4';
const STONE_DARK = '#8f7a5e';
const IRON = '#4a4038';
/** Mirror stands and shield rims: dark grey iron-stone (owner's pick), so the bright glass stands out. */
const DARK_GREY = '#4d4b54';
const darkGreyM = <meshStandardMaterial color={DARK_GREY} roughness={0.55} metalness={0.35} />;
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

/** A fixed shield's rim: warm bronze, so it never reads as one of the dark grey shields that turn. */
const bronzeM = <meshPhysicalMaterial color="#b0683c" metalness={0.75} roughness={0.35} clearcoat={0.4} />;

/** The shield: a rim (dark grey when it turns, bronze when it can't) with a mirror-bright face on both sides. */
function Shield({ rim: rimMaterial = darkGreyM, glass = mirrorM, streaks = true }) {
  const rim = useMemo(() => new THREE.ExtrudeGeometry(shieldShape(), { depth: 0.03, bevelEnabled: false }).translate(0, 0, -0.015), []);
  const face = useMemo(() => new THREE.ShapeGeometry(shieldShape(0.86)), []);
  return (
    <group>
      <mesh geometry={rim} castShadow>
        {rimMaterial}
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
      <Gear r={0.34} teeth={8} h={0.07} color={DARK_GREY} metalness={0.2} roughness={0.7} />
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
        {darkGreyM}
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.22, 0.28]} />
        {stoneM('#62606a')}
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
    <Shield rim={bronzeM} />
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

const WALL_HEIGHT = 0.56;
/** The four sides of a cell: [dx, dy] on the board, and where that side is in the piece's own space. */
const SIDES = [
  { step: [1, 0], at: [0.5, 0], along: 'z' },
  { step: [-1, 0], at: [-0.5, 0], along: 'z' },
  { step: [0, 1], at: [0, 0.5], along: 'x' },
  { step: [0, -1], at: [0, -0.5], along: 'x' },
];

/**
 * A wall: a stretch of castle wall that fills its whole square, so walls on neighboring squares join into one long
 * wall. Battlements run only along the sides that face open ground (never between two joined pieces).
 */
export function CastleWall({ tile, level }) {
  const masonry = useBricks(1, WALL_HEIGHT);
  const isWall = (x, y) => level.tiles.some((other) => other.type === TILE.WALL && other.x === x && other.y === y);
  const open = SIDES.filter(({ step }) => !isWall(tile.x + step[0], tile.y + step[1]));
  return (
    <group>
      <mesh position={[0, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, WALL_HEIGHT, 1]} />
        <meshStandardMaterial map={masonry} roughness={0.95} />
      </mesh>
      {/* The walkway on top, a little darker than the stone. */}
      <mesh position={[0, WALL_HEIGHT + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="#b9a47c" roughness={1} />
      </mesh>
      {open.flatMap(({ at, along }) =>
        [-0.36, 0, 0.36].map((slide) => (
          <mesh
            key={`${at}${slide}`}
            position={[along === 'z' ? at[0] * 0.86 : slide, WALL_HEIGHT + 0.08, along === 'z' ? slide : at[1] * 0.86]}
            castShadow
          >
            <boxGeometry args={along === 'z' ? [0.14, 0.16, 0.2] : [0.2, 0.16, 0.14]} />
            {stoneM()}
          </mesh>
        )),
      )}
    </group>
  );
}

/**
 * The torch, big and proud: a stone pedestal with an iron ring, a thick wooden shaft bound with iron bands, and an
 * iron basket of fire that leans the way the light leaves (local +x), with a soft glow around the flame.
 */
function TorchBody({ calm }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.34, 0.12, 8]} />
        {stoneM(STONE_DARK)}
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.26, 0.1, 8]} />
        {stoneM()}
      </mesh>
      <mesh position={[0, 0.215, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.022, 8, 20]} />
        {ironM}
      </mesh>
      <group position={[-0.03, 0.2, 0]} rotation={[0, 0, -0.5]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.05, 0.56, 12]} />
          <meshStandardMaterial color="#8a5a34" roughness={0.75} />
        </mesh>
        {[0.14, 0.34].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.078 - (0.5 - y) * 0.02, 0.074 - (0.5 - y) * 0.02, 0.04, 12]} />
            {ironM}
          </mesh>
        ))}
        {/* The fire basket: an iron cup and four prongs holding the flame. */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.15, 0.085, 0.12, 12]} />
          {ironM}
        </mesh>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[Math.cos((k * Math.PI) / 2 + 0.78) * 0.135, 0.71, Math.sin((k * Math.PI) / 2 + 0.78) * 0.135]}>
            <boxGeometry args={[0.025, 0.14, 0.025]} />
            {ironM}
          </mesh>
        ))}
        <group position={[0, 0.66, 0]} rotation={[0, 0, 0.5]} scale={3.4}>
          <Flame calm={calm} />
        </group>
      </group>
      <Flare position={[0.33, 0.92, 0]} size={0.95} />
      <pointLight position={[0.33, 0.9, 0]} color="#ffb866" intensity={4} distance={3.2} />
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
