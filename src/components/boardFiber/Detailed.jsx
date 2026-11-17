/*
 * Detailed puzzle objects for the R3F board (owner: "every object designed separately and perfectly: a mirror should
 * look like a mirror, the light should look like a light, clouds like clouds"). Each reads at a glance:
 * - LanternLamp: a hurricane lantern (brass foot, glass globe, a real flame) that lights the tiles around it, with
 *   a brass lens hood on the side the beam leaves from.
 * - CrystalMirror: a standing cheval mirror, real mirror glass between two slim posts, on a cream base.
 * - Cloud: a fluffy cumulus cloud that bobs gently.
 * - ShadowShard: dark smoky obsidian shards: the "keep the light away" piece (it flares red if lit).
 * - StoneBlocker: a carved cream stone block with an X.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { BEAM_COLORS, BEAM_HEIGHT, facetedBlock, glowing, roundedRect } from './look.js';

const DIRECTION_ANGLE = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 };
const lathe = (points, segments = 40) =>
  new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
const BRASS = { color: '#d8a548', metalness: 0.75, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 };

/** A soft round glow on the floor under something bright (a radial gradient decal). */
let poolTexture = null;
function FloorGlow({ color, size, opacity = 0.7 }) {
  if (!poolTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const draw = canvas.getContext('2d');
    const gradient = draw.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    draw.fillStyle = gradient;
    draw.fillRect(0, 0, 128, 128);
    poolTexture = new THREE.CanvasTexture(canvas);
  }
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.172, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={poolTexture} color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/**
 * The light source: a hurricane lantern, built like the real thing. A stepped brass foot and oil font, a burner
 * collar, a clear glass globe that glows warm from the living flame inside, a brass cage of four wires with a
 * middle band, a domed cap with a vent ring and a carry handle, and a brass lens hood on the side where the beam
 * comes out. It casts real warm light on the tiles around it.
 */
export function LanternLamp({ tile, turn, calm }) {
  const flame = useRef();
  const hood = useRef();
  const light = useRef();
  const glow = useRef();
  const color = BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun;
  const foot = useMemo(
    () =>
      lathe([
        [0.001, 0],
        [0.25, 0],
        [0.26, 0.02],
        [0.24, 0.035],
        [0.2, 0.04],
        [0.19, 0.06],
        [0.001, 0.06],
      ]),
    [],
  );
  const font = useMemo(
    () =>
      lathe([
        [0.001, 0],
        [0.13, 0],
        [0.19, 0.04],
        [0.205, 0.09],
        [0.18, 0.13],
        [0.11, 0.155],
        [0.07, 0.16],
        [0.001, 0.16],
      ]),
    [],
  );
  const collar = useMemo(
    () =>
      lathe([
        [0.06, 0],
        [0.11, 0],
        [0.12, 0.02],
        [0.1, 0.04],
        [0.07, 0.04],
      ]),
    [],
  );
  const globe = useMemo(
    () =>
      lathe(
        [
          [0.075, 0],
          [0.13, 0.03],
          [0.17, 0.09],
          [0.18, 0.16],
          [0.165, 0.23],
          [0.12, 0.29],
          [0.08, 0.32],
        ],
        48,
      ),
    [],
  );
  const cap = useMemo(
    () =>
      lathe([
        [0.001, 0.08],
        [0.05, 0.078],
        [0.1, 0.06],
        [0.13, 0.03],
        [0.135, 0.01],
        [0.12, 0],
        [0.001, 0],
      ]),
    [],
  );
  const angle = (DIRECTION_ANGLE[tile.dir] ?? 0) - (tile.turnable ? (turn % 2) * (Math.PI / 2) : 0);

  useEffect(() => {
    gsap.to(hood.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.6)' });
  }, [angle]);
  useFrame(({ clock }) => {
    if (calm) return;
    const t = clock.elapsedTime;
    const lick = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.1) * 0.05;
    flame.current.scale.set(1 + Math.sin(t * 9) * 0.05, lick, 1 + Math.cos(t * 11) * 0.05);
    flame.current.rotation.z = Math.sin(t * 5) * 0.06;
    light.current.intensity = 1.2 + Math.sin(t * 11) * 0.12 + Math.sin(t * 17) * 0.08;
    glow.current.material.opacity = 0.16 + Math.sin(t * 9) * 0.03;
  });

  const brass = <meshPhysicalMaterial {...BRASS} />;
  return (
    <group position={[0, 0.17, 0]}>
      <FloorGlow color="#ffd27a" size={1.15} opacity={0.35} />
      <mesh geometry={foot} castShadow receiveShadow>
        {brass}
      </mesh>
      <mesh geometry={font} position={[0, 0.055, 0]} castShadow>
        {brass}
      </mesh>
      <mesh geometry={collar} position={[0, 0.21, 0]} castShadow>
        {brass}
      </mesh>
      {/* The flame: outer orange tongue, gold body, white-hot heart, on a dark wick. */}
      <group position={[0, 0.33, 0]}>
        <mesh position={[0, -0.075, 0]}>
          <cylinderGeometry args={[0.01, 0.012, 0.04, 8]} />
          <meshStandardMaterial color="#3b2a20" />
        </mesh>
        <group ref={flame} scale={1.6}>
          <mesh position={[0, 0.03, 0]} scale={[1, 1.7, 1]}>
            <sphereGeometry args={[0.05, 20, 14]} />
            <meshBasicMaterial color={glowing('#ff7a2e', 1.7)} toneMapped={false} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0.02, 0]} scale={[1, 1.6, 1]}>
            <sphereGeometry args={[0.032, 16, 12]} />
            <meshBasicMaterial color={glowing('#ffd84a', 3)} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.016, 12, 10]} />
            <meshBasicMaterial color={glowing('#ffffff', 6)} toneMapped={false} />
          </mesh>
        </group>
        <pointLight ref={light} color="#ffb85c" intensity={1.2} distance={2.2} decay={1.8} position={[0, 0.05, 0]} />
      </group>
      {/* The glass globe: clear glass with bright edges, warmly lit from inside. */}
      <mesh geometry={globe} position={[0, 0.215, 0]}>
        <meshPhysicalMaterial
          color="#fffaf0"
          roughness={0.03}
          clearcoat={1}
          clearcoatRoughness={0.02}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={glow} geometry={globe} position={[0, 0.215, 0]} scale={0.97}>
        <meshBasicMaterial color={glowing('#ffc56b', 1.3)} toneMapped={false} transparent opacity={0.16} depthWrite={false} />
      </mesh>
      {/* The brass cage: four wires and a middle band. */}
      {[0, 1, 2, 3].map((n) => {
        const a = (n / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={n} position={[Math.cos(a) * 0.19, 0.38, Math.sin(a) * 0.19]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.33, 6]} />
            {brass}
          </mesh>
        );
      })}
      <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.19, 0.008, 6, 48]} />
        {brass}
      </mesh>
      {/* Domed cap with a vent ring and a carry handle. */}
      <mesh geometry={cap} position={[0, 0.535, 0]} castShadow>
        {brass}
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.035, 0.01, 8, 24]} />
        {brass}
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <torusGeometry args={[0.09, 0.012, 10, 40, Math.PI]} />
        {brass}
      </mesh>
      {/* The lens hood: where the beam comes out (the way the lamp points). */}
      <group ref={hood} rotation={[0, angle, 0]}>
        <group position={[0.23, BEAM_HEIGHT - 0.17, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.055, 0.12, 28, 1, true]} />
            <meshPhysicalMaterial {...BRASS} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.08, 0.012, 8, 32]} />
            {brass}
          </mesh>
        </group>
        <mesh position={[0.285, BEAM_HEIGHT - 0.17, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.075, 28]} />
          <meshBasicMaterial color={glowing(color, 3)} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Real mirror glass: silvered, clear and bright, reflecting the room. */
function MirrorGlass(props) {
  return (
    <meshPhysicalMaterial
      color="#dff1fa"
      metalness={0.55}
      roughness={0.04}
      envMapIntensity={3}
      clearcoat={1}
      emissive="#cfe9f6"
      emissiveIntensity={0.45}
      {...props}
    />
  );
}

/** A curved turn-arrow lying on a base: an arc with an arrow head, in mint. */
function TurnArrow({ radius, start, sweep }) {
  const end = start + sweep;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, start]}>
        <torusGeometry args={[radius, 0.018, 10, 40, sweep]} />
        <meshPhysicalMaterial color="#3fb3a1" roughness={0.35} clearcoat={0.6} />
      </mesh>
      <mesh position={[Math.cos(end) * radius, 0, -Math.sin(end) * radius]} rotation={[0, end, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
          <coneGeometry args={[0.04, 0.08, 12]} />
          <meshPhysicalMaterial color="#3fb3a1" roughness={0.35} clearcoat={0.6} />
        </mesh>
      </mesh>
    </group>
  );
}

/**
 * A mirror: a standing cheval mirror. A pane of real mirror glass with a hair-thin pink rim, hung on gold pins
 * between two slim pink posts with gold finials, on a round cream base with a pink edge. A turnable one has two
 * mint turn arrows around its base; a fixed one is held down by four silver bolts. It swings a quarter turn with a
 * springy GSAP ease.
 */
export function CrystalMirror({ tile, turn, isRotatable }) {
  const rotor = useRef();
  const base = useMemo(
    () =>
      lathe(
        [
          [0.001, 0],
          [0.3, 0],
          [0.315, 0.015],
          [0.31, 0.04],
          [0.29, 0.055],
          [0.001, 0.055],
        ],
        56,
      ),
    [],
  );
  const pane = useMemo(() => {
    const geometry = new THREE.ExtrudeGeometry(roundedRect(0.52, 0.44, 0.07), {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 2,
    });
    geometry.center();
    return geometry;
  }, []);
  const rim = useMemo(() => {
    const shape = roundedRect(0.55, 0.47, 0.085);
    shape.holes.push(roundedRect(0.525, 0.445, 0.072));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.032, bevelEnabled: false, curveSegments: 12 });
    geometry.center();
    return geometry;
  }, []);
  const isSplitter = tile.type === 'splitter';
  const angle = -THREE.MathUtils.degToRad(-45 + turn * 90);
  useEffect(() => {
    gsap.to(rotor.current.rotation, { y: angle, duration: 0.45, ease: 'back.out(1.8)' });
  }, [angle]);
  const pink = <meshPhysicalMaterial color="#ee8fb3" roughness={0.28} clearcoat={0.9} />;
  const gold = <meshPhysicalMaterial {...BRASS} />;
  return (
    <group position={[0, 0.17, 0]}>
      <mesh geometry={base} castShadow receiveShadow>
        <meshPhysicalMaterial color="#fbf4e8" roughness={0.45} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.31, 0.012, 8, 64]} />
        {pink}
      </mesh>
      {isRotatable ? (
        <group position={[0, 0.065, 0]}>
          <TurnArrow radius={0.24} start={0.35} sweep={Math.PI * 0.55} />
          <TurnArrow radius={0.24} start={0.35 + Math.PI} sweep={Math.PI * 0.55} />
        </group>
      ) : (
        [0.785, 2.356, 3.927, 5.498].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.23, 0.065, Math.sin(a) * 0.23]}>
            <cylinderGeometry args={[0.028, 0.028, 0.02, 16]} />
            <meshPhysicalMaterial color="#dfe5ea" metalness={0.9} roughness={0.22} />
          </mesh>
        ))
      )}
      <group ref={rotor} rotation={[0, angle, 0]} position={[0, 0.055, 0]}>
        {/* Two slim posts with gold finials and gold pivot pins. */}
        {[-0.3, 0.3].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.22, 0]} castShadow>
              <cylinderGeometry args={[0.014, 0.02, 0.44, 12]} />
              {pink}
            </mesh>
            <mesh position={[x, 0.455, 0]}>
              <sphereGeometry args={[0.024, 14, 10]} />
              {gold}
            </mesh>
            <mesh position={[x, 0.29, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, 0.04, 12]} />
              {gold}
            </mesh>
          </group>
        ))}
        <group position={[0, 0.29, 0]}>
          <mesh geometry={rim} castShadow>
            {pink}
          </mesh>
          <mesh geometry={pane}>
            {isSplitter ? (
              <meshPhysicalMaterial
                color="#f2fbff"
                roughness={0.03}
                transmission={0.7}
                thickness={0.02}
                iridescence={0.8}
                clearcoat={1}
                transparent
                opacity={0.6}
              />
            ) : (
              <MirrorGlass />
            )}
          </mesh>
          {/* Soft reflection streaks on each face. */}
          {[0.017, -0.017].flatMap((z) =>
            [
              [-0.09, 0.07],
              [0.02, 0.03],
            ].map(([x, width]) => (
              <mesh key={`${z},${x}`} position={[x, 0.02, z]} rotation={[0, z < 0 ? Math.PI : 0, 0.7]}>
                <planeGeometry args={[width, 0.48]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
              </mesh>
            )),
          )}
        </group>
      </group>
    </group>
  );
}

/** Fog: a fluffy cumulus cloud resting over a cell, gently bobbing, hiding what's under it until light reaches it. */
export function Cloud({ calm }) {
  const group = useRef();
  const puffs = useMemo(
    () => [
      [0, 0.08, 0, 0.19],
      [-0.15, 0.03, 0.05, 0.15],
      [0.16, 0.04, -0.03, 0.16],
      [0.06, 0.18, 0.02, 0.13],
      [-0.08, 0.15, -0.05, 0.12],
      [0.02, 0.0, 0.16, 0.13],
      [-0.04, 0.0, -0.16, 0.13],
      [0.27, -0.02, 0.07, 0.1],
      [-0.27, -0.02, -0.03, 0.1],
      [0.15, -0.02, 0.15, 0.1],
      [-0.16, -0.02, -0.15, 0.1],
      [0.13, 0.12, 0.1, 0.1],
    ],
    [],
  );
  useFrame(({ clock }) => {
    if (!calm) group.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 1.3) * 0.025;
  });
  return (
    <group ref={group} position={[0, 0.5, 0]}>
      {puffs.map(([x, y, z, r], n) => (
        <mesh key={n} position={[x, y, z]} scale={[1, 0.82, 1]} castShadow>
          <sphereGeometry args={[r, 28, 18]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.9} sheen={1} sheenColor="#f1ecff" emissive="#f6f3ff" emissiveIntensity={0.22} />
        </mesh>
      ))}
    </group>
  );
}

/** A smoky dark halo on the floor (a radial gradient decal), under the shadow crystal. */
let smokeTexture = null;
function Smoke() {
  if (!smokeTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const draw = canvas.getContext('2d');
    const gradient = draw.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(40,32,44,0.55)');
    gradient.addColorStop(0.6, 'rgba(40,32,44,0.2)');
    gradient.addColorStop(1, 'rgba(40,32,44,0)');
    draw.fillStyle = gradient;
    draw.fillRect(0, 0, 128, 128);
    smokeTexture = new THREE.CanvasTexture(canvas);
  }
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.172, 0]}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshBasicMaterial map={smokeTexture} transparent depthWrite={false} />
    </mesh>
  );
}

/** A shadow crystal: dark smoky obsidian shards over a pool of shadow (keep the light away!); they flare red if lit. */
export function ShadowShard({ isLit }) {
  const shards = useMemo(() => {
    const make = (r, h) => {
      const body = new THREE.CylinderGeometry(r, r * 1.12, h, 5);
      body.translate(0, h / 2, 0);
      const tip = new THREE.ConeGeometry(r, r * 1.9, 5);
      tip.translate(0, h + r * 0.95, 0);
      return [body, tip];
    };
    return [
      { parts: make(0.1, 0.3), position: [0, 0, 0], rotation: [0, 0, 0] },
      { parts: make(0.06, 0.16), position: [0.1, 0, 0.05], rotation: [0.2, 0.5, -0.5] },
      { parts: make(0.06, 0.14), position: [-0.09, 0, -0.06], rotation: [-0.2, 1.4, 0.5] },
      { parts: make(0.04, 0.08), position: [0.02, 0, -0.11], rotation: [-0.5, 0.3, 0] },
    ];
  }, []);
  return (
    <group>
      <Smoke />
      <group position={[0, 0.2, 0]} scale={1.45}>
        {shards.map((shard, n) => (
          <group key={n} position={shard.position} rotation={shard.rotation}>
            {shard.parts.map((geometry, k) => (
              <mesh key={k} geometry={geometry} castShadow>
                <meshPhysicalMaterial
                  color="#2b262e"
                  roughness={0.12}
                  clearcoat={1}
                  flatShading
                  emissive={isLit ? '#ff3b30' : '#3a2f3d'}
                  emissiveIntensity={isLit ? 1.4 : 0.22}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

/** A wall: a carved cream stone block with a recessed top and a raised pink X. */
export function StoneBlocker() {
  const block = useMemo(() => facetedBlock(0.8, 0.8, 0.46, 0.14, 0.04), []);
  const top = useMemo(() => facetedBlock(0.62, 0.62, 0.02, 0.1, 0.008), []);
  return (
    <group position={[0, 0.17, 0]}>
      <mesh geometry={block} castShadow receiveShadow>
        <meshStandardMaterial color="#efe3cf" roughness={0.85} flatShading />
      </mesh>
      <mesh geometry={top} position={[0, 0.455, 0]} receiveShadow>
        <meshStandardMaterial color="#f7eddc" roughness={0.8} flatShading />
      </mesh>
      {[1, -1].map((tilt) => (
        <mesh key={tilt} position={[0, 0.49, 0]} rotation={[0, (tilt * Math.PI) / 4, 0]} castShadow>
          <boxGeometry args={[0.44, 0.025, 0.07]} />
          <meshPhysicalMaterial color="#e98aab" roughness={0.35} clearcoat={0.8} />
        </mesh>
      ))}
    </group>
  );
}
