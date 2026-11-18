/*
 * The Pond theme's pieces: a candle lantern for the light (a real little flame), mirrors framed in green reeds that
 * turn on a water-lily flower (or stand on a mossy stone when they can't), clear amber glass in the same frame for
 * splitters, and stacks of logs that join up as walls. Turning pieces swing a quarter turn with a springy GSAP ease, their flower
 * with them.
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { TILE } from '../../../game/constants.js';
import { DIRECTION_ANGLE, RoundMirror, mirrorAngle } from '../library/LibraryPieces.jsx';
import Flame from '../themes/Flame.jsx';
import { brassM, mirrorM } from '../themes/shared.jsx';

const WOOD = '#a8774a';
/** The mirror's frame: green reed stems, with cattail-brown beads for the knobs. */
const reedM = (color = '#5f8f4e') => <meshStandardMaterial color={color === '#e8c06a' ? '#6b4630' : color} roughness={0.7} />;
/** A fixed mirror's frame: grey river stone, like the stone it stands on (the ones that turn are green reed). */
const stoneFrame = () => <meshStandardMaterial color="#6f6d68" roughness={0.85} />;
/** A splitter's frame: honey brass, to match its amber glass. */
const honeyFrame = () => brassM('#e0a23a');
const PETALS = 9;
/** A splitter's pane: clear amber glass you can see through (light passes and bounces). */
const amberGlass = (
  <meshPhysicalMaterial color="#ffd98a" roughness={0.05} clearcoat={1} transparent opacity={0.42} emissive="#ffc35a" emissiveIntensity={0.25} side={THREE.DoubleSide} />
);

/** A water-lily flower lying open on the pond: a ring of pink petals round a golden heart. */
function LilyFlower() {
  return (
    <group>
      {Array.from({ length: PETALS * 2 }, (_, k) => {
        const outer = k < PETALS;
        const angle = (k / PETALS) * Math.PI * 2 + (outer ? 0 : Math.PI / PETALS);
        const reach = outer ? 0.25 : 0.16;
        return (
          <group key={k} rotation={[0, angle, 0]}>
            <mesh position={[reach, outer ? 0.03 : 0.06, 0]} rotation={[0, 0, outer ? 0.18 : 0.5]} scale={[1, 0.22, 0.5]} castShadow>
              <sphereGeometry args={[outer ? 0.13 : 0.1, 12, 8]} />
              <meshStandardMaterial color={outer ? '#f3b3c0' : '#f8cdd5'} roughness={0.6} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.07, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.08, 14, 10]} />
        <meshStandardMaterial color="#f0c14e" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** A piece that turns: standing in a water-lily flower that swings round with it. */
function OnLily({ turn, children }) {
  const rotor = useRef();
  const angle = mirrorAngle(turn);
  useEffect(() => {
    gsap.to(rotor.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.7)' });
  }, [angle]);
  return (
    <group ref={rotor} rotation={[0, angle, 0]}>
      <LilyFlower />
      <group position={[0, 0.42, 0]}>{children}</group>
    </group>
  );
}

/** A piece that can't turn: standing on a mossy stone (no flower). */
function OnStone({ turn, children }) {
  return (
    <group rotation={[0, mirrorAngle(turn), 0]}>
      <mesh position={[0, 0.07, 0]} scale={[1, 0.42, 0.8]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color="#9a9a8c" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.04, 0.16, 0.02]} scale={[1, 0.25, 0.75]}>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshStandardMaterial color="#6f9a5a" roughness={1} flatShading />
      </mesh>
      <group position={[0, 0.44, 0]}>{children}</group>
    </group>
  );
}

export const PondMirror = ({ turn }) => (
  <OnLily turn={turn}>
    <RoundMirror frame={reedM} glass={mirrorM} />
  </OnLily>
);

export const PondFixedMirror = ({ turn }) => (
  <OnStone turn={turn}>
    <RoundMirror frame={stoneFrame} glass={mirrorM} knob={false} postsFrom={-0.14} />
  </OnStone>
);

/** A splitter: the same ring with clear amber glass and a brass stud on top, so it never reads as a mirror. */
function SplitterPane(props) {
  return (
    <group>
      <RoundMirror frame={honeyFrame} glass={amberGlass} streaks={false} {...props} />
      <mesh position={[0, 0.33, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.07, 0.07, 0.03]} />
        {brassM('#e8c06a')}
      </mesh>
    </group>
  );
}

export const PondSplitter = ({ turn }) => (
  <OnLily turn={turn}>
    <SplitterPane />
  </OnLily>
);

export const PondFixedSplitter = ({ turn }) => (
  <OnStone turn={turn}>
    <SplitterPane knob={false} postsFrom={-0.14} />
  </OnStone>
);

const LOG_RADIUS = 0.166;
const BARKS = ['#9a6b45', '#b07d52', '#84583a'];

let barkMap = null;

/** Bark painted on a canvas (in greys, tinted by each log's own brown): long ragged furrows along the log and knots. */
function barkTexture() {
  if (barkMap) return barkMap;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const d = canvas.getContext('2d');
  let r = 71;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  d.fillStyle = '#d8d8d8';
  d.fillRect(0, 0, 256, 256);
  // Furrows run along the log (down the canvas), wandering a little and breaking off.
  for (let n = 0; n < 46; n++) {
    let x = rnd() * 256;
    let y = rnd() * 256 - 60;
    d.strokeStyle = `rgba(40,26,16,${0.35 + rnd() * 0.4})`;
    d.lineWidth = 1.5 + rnd() * 3.5;
    d.beginPath();
    d.moveTo(x, y);
    for (let step = 0; step < 6; step++) {
      x += (rnd() - 0.5) * 9;
      y += 18 + rnd() * 26;
      d.lineTo(x, y);
    }
    d.stroke();
  }
  for (let n = 0; n < 30; n++) {
    d.fillStyle = `rgba(255,255,255,${0.12 + rnd() * 0.2})`;
    d.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 10 + rnd() * 26);
  }
  for (let n = 0; n < 3; n++) {
    const [x, y] = [rnd() * 256, rnd() * 256];
    d.strokeStyle = 'rgba(40,26,16,0.7)';
    d.lineWidth = 3;
    d.beginPath();
    d.ellipse(x, y, 9, 14, 0, 0, Math.PI * 2);
    d.stroke();
    d.fillStyle = 'rgba(40,26,16,0.45)';
    d.beginPath();
    d.ellipse(x, y, 4, 7, 0, 0, Math.PI * 2);
    d.fill();
  }
  barkMap = new THREE.CanvasTexture(canvas);
  barkMap.colorSpace = THREE.SRGBColorSpace;
  barkMap.wrapS = barkMap.wrapT = THREE.RepeatWrapping;
  return barkMap;
}

/**
 * One log lying along x, a full square long, in furrowed bark; a pale cut end with growth rings shows only where
 * the wall ends (`ends`: [-1, 1]). `turn` rolls the bark so no two logs look alike.
 */
function Log({ position, bark, radius = LOG_RADIUS, turn = 0, ends }) {
  return (
    <group position={position}>
      <mesh rotation={[turn, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, 1, 16]} />
        <meshStandardMaterial map={barkTexture()} bumpMap={barkTexture()} bumpScale={1.2} color={bark} roughness={0.95} />
      </mesh>
      {ends.map((side) => (
        <group key={side} position={[side * 0.502, 0, 0]} rotation={[0, (side * Math.PI) / 2, 0]}>
          <mesh>
            <circleGeometry args={[radius * 0.9, 16]} />
            <meshStandardMaterial color="#e6c794" roughness={0.8} />
          </mesh>
          {[0.68, 0.42, 0.18].map((ring) => (
            <mesh key={ring} position={[0, 0, 0.001]}>
              <ringGeometry args={[radius * ring, radius * (ring + 0.06), 16]} />
              <meshStandardMaterial color="#b98d58" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

const TWIG_COLORS = ['#8a6a4a', '#c2a27a', '#5c4433', '#a8563c', '#9a9a82', '#d9b98a'];

/** A tiny branch lying on the logs: a thin stick with a little side shoot, in its own color. */
function Twig({ position, turn, length, color }) {
  return (
    <group position={position} rotation={[0, turn, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.02, length, 6]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[length * 0.18, 0.012, 0.05]} rotation={[0.3, 0.9, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.012, length * 0.42, 5]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

/**
 * A wall: a stack of logs that fills its whole square, so log walls on neighboring squares join into one long wall
 * (like a beaver's dam). The logs run along the wall in furrowed bark, each a little thicker or thinner than the
 * next, cut ends show only where the wall stops, and a few tiny branches in different colors lie on top.
 */
export function LogWall({ tile, level }) {
  const isWall = (dx, dy) => level.tiles.some((other) => other.type === TILE.WALL && other.x === tile.x + dx && other.y === tile.y + dy);
  // Logs follow the wall's run: along x when it continues left or right, else along z when it continues up or down.
  const alongZ = !isWall(-1, 0) && !isWall(1, 0) && (isWall(0, -1) || isWall(0, 1));
  const ends = [-1, 1].filter((side) => !(alongZ ? isWall(0, -side) : isWall(side, 0)));
  const seed = tile.x * 3 + tile.y * 5;
  return (
    <group>
      <group rotation={[0, alongZ ? Math.PI / 2 : 0, 0]}>
        {[0, 1].flatMap((row) =>
          [-1, 0, 1].map((across) => {
            // The same row keeps its thickness along a wall (so joined logs line up); rows and columns differ.
            const radius = LOG_RADIUS * (1 + (((row * 3 + across + 4) % 3) - 1) * 0.06);
            return (
              <Log
                key={`${row}${across}`}
                position={[0, LOG_RADIUS + row * LOG_RADIUS * 1.86, across * LOG_RADIUS * 2]}
                radius={radius}
                turn={(row * 3 + across + 2) * 1.3}
                bark={BARKS[(row * 2 + across + 3) % BARKS.length]}
                ends={ends}
              />
            );
          }),
        )}
      </group>
      {[0, 1, 2, 3].map((k) => (
        <Twig
          key={k}
          position={[((seed * 3 + k * 7) % 9) * 0.07 - 0.28, 0.655 + k * 0.012, ((seed + k * 5) % 7) * 0.08 - 0.24]}
          turn={(seed + k * 2) * 1.1}
          length={0.26 + ((seed + k) % 4) * 0.06}
          color={TWIG_COLORS[(seed + k * 2) % TWIG_COLORS.length]}
        />
      ))}
    </group>
  );
}

const IRON = '#4a3a30';
const POST = 0.13;

/**
 * A hand lantern holding a candle: an iron frame with a copper roof and a carrying ring, glass on three sides and a
 * shiny copper back, so the candlelight leaves through the open front (local +x).
 */
function LanternBody({ calm }) {
  return (
    <group>
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.21, 0.23, 0.05, 20]} />
        <meshStandardMaterial color={WOOD} roughness={0.75} />
      </mesh>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * POST, 0.26, z * POST]} castShadow>
            <boxGeometry args={[0.025, 0.42, 0.025]} />
            <meshStandardMaterial color={IRON} roughness={0.5} metalness={0.4} />
          </mesh>
        )),
      )}
      {/* The copper back throws the light forward; the other sides are glass. */}
      <mesh position={[-POST, 0.26, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[POST * 2, 0.4]} />
        <meshPhysicalMaterial color="#d9955a" metalness={0.8} roughness={0.22} clearcoat={0.6} emissive="#ffb866" emissiveIntensity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {[-1, 1].map((z) => (
        <mesh key={z} position={[0, 0.26, z * POST]}>
          <planeGeometry args={[POST * 2, 0.4]} />
          <meshPhysicalMaterial color="#fff3d6" transparent opacity={0.22} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.54, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.24, 0.16, 4]} />
        <meshPhysicalMaterial color="#c9824a" metalness={0.7} roughness={0.3} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <torusGeometry args={[0.055, 0.012, 8, 20]} />
        {brassM('#c98a4a')}
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.05, 0.055, 0.15, 14]} />
        <meshStandardMaterial color="#f6ecd6" roughness={0.85} />
      </mesh>
      <group position={[0, 0.21, 0]}>
        <Flame calm={calm} />
      </group>
      <pointLight position={[0.1, 0.3, 0]} color="#ffb866" intensity={2.4} distance={2.4} />
    </group>
  );
}

/** The light: a candle lantern, its open side facing the way the light leaves; a turning one swings on a flower. */
export function CandleLantern({ tile, turn, calm }) {
  const head = useRef();
  const angle = (DIRECTION_ANGLE[tile.dir] ?? 0) - (tile.turnable ? (turn % 2) * (Math.PI / 2) : 0);
  useEffect(() => {
    gsap.to(head.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.6)' });
  }, [angle]);
  return (
    <group ref={head} rotation={[0, angle, 0]}>
      {tile.turnable && <LilyFlower />}
      <group position={[0, tile.turnable ? 0.06 : 0, 0]}>
        <LanternBody calm={calm} />
      </group>
    </group>
  );
}
