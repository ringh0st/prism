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
 * The light source: a hurricane lantern. A brass foot and oil font, a clear glass globe with a living flame inside,
 * a brass cap with a ring handle, and a brass lens hood on one side where the beam comes out. It casts real warm
 * light on the tiles around it, so it is plainly the thing that shines.
 */
export function LanternLamp({ tile, turn, calm }) {
  const flame = useRef();
  const hood = useRef();
  const light = useRef();
  const color = BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun;
  const foot = useMemo(
    () =>
      lathe([
        [0.001, 0],
        [0.24, 0],
        [0.25, 0.03],
        [0.2, 0.06],
        [0.12, 0.08],
        [0.001, 0.08],
      ]),
    [],
  );
  const font = useMemo(
    () =>
      lathe([
        [0.001, 0],
        [0.12, 0],
        [0.19, 0.05],
        [0.2, 0.1],
        [0.15, 0.15],
        [0.09, 0.17],
        [0.001, 0.17],
      ]),
    [],
  );
  const globe = useMemo(
    () =>
      lathe(
        [
          [0.08, 0],
          [0.15, 0.05],
          [0.19, 0.14],
          [0.18, 0.24],
          [0.12, 0.32],
          [0.09, 0.36],
        ],
        48,
      ),
    [],
  );
  const cap = useMemo(
    () =>
      lathe([
        [0.001, 0.06],
        [0.1, 0.05],
        [0.13, 0.02],
        [0.11, 0],
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
    flame.current.scale.set(1 + Math.sin(t * 9) * 0.06, 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7) * 0.05, 1 + Math.cos(t * 11) * 0.06);
    flame.current.rotation.z = Math.sin(t * 5) * 0.07;
    light.current.intensity = 1.2 + Math.sin(t * 11) * 0.15 + Math.sin(t * 17) * 0.1;
  });

  return (
    <group position={[0, 0.17, 0]}>
      <FloorGlow color="#ffd27a" size={1.2} opacity={0.4} />
      <mesh geometry={foot} castShadow receiveShadow>
        <meshPhysicalMaterial {...BRASS} />
      </mesh>
      <mesh geometry={font} position={[0, 0.07, 0]} castShadow>
        <meshPhysicalMaterial {...BRASS} />
      </mesh>
      {/* The flame inside the globe: outer orange, inner gold, white-hot heart, on a little wick. */}
      <group position={[0, 0.34, 0]}>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.05, 8]} />
          <meshStandardMaterial color="#3b2a20" />
        </mesh>
        <group ref={flame} scale={1.5}>
          <mesh position={[0, 0.05, 0]} scale={[1, 1.6, 1]}>
            <sphereGeometry args={[0.055, 20, 14]} />
            <meshBasicMaterial color={glowing('#ff7a2e', 1.7)} toneMapped={false} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0.04, 0]} scale={[1, 1.5, 1]}>
            <sphereGeometry args={[0.035, 16, 12]} />
            <meshBasicMaterial color={glowing('#ffd84a', 3)} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.018, 12, 10]} />
            <meshBasicMaterial color={glowing('#ffffff', 6)} toneMapped={false} />
          </mesh>
        </group>
        <pointLight ref={light} color="#ffb85c" intensity={1.2} distance={2.2} decay={1.8} position={[0, 0.06, 0]} />
      </group>
      <mesh geometry={globe} position={[0, 0.22, 0]}>
        <meshPhysicalMaterial
          color="#fff8ec"
          roughness={0.04}
          transmission={0.92}
          thickness={0.05}
          ior={1.45}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Brass cap, vent and ring handle. */}
      <mesh geometry={cap} position={[0, 0.58, 0]} castShadow>
        <meshPhysicalMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.69, 0]} castShadow>
        <torusGeometry args={[0.07, 0.014, 10, 32]} />
        <meshPhysicalMaterial {...BRASS} />
      </mesh>
      {/* Two thin guard wires from foot to cap. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, 0.4, side * 0.2]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.38, 6]} />
          <meshPhysicalMaterial {...BRASS} />
        </mesh>
      ))}
      {/* The lens hood: where the beam comes out (the way the lamp points). */}
      <group ref={hood} rotation={[0, angle, 0]}>
        <group position={[0.21, BEAM_HEIGHT - 0.17, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.075, 0.06, 0.1, 24, 1, true]} />
            <meshPhysicalMaterial {...BRASS} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <mesh position={[0.262, BEAM_HEIGHT - 0.17, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.07, 24]} />
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

/**
 * A mirror: a standing cheval mirror. A pane of real mirror glass with a hair-thin pink rim, hung on gold pins
 * between two slim pink posts, on a soft cream base. A turnable one has a mint turn-ring with arrows on its base;
 * a fixed one is held by silver bolts instead. It swings a quarter turn with a springy GSAP ease.
 */
export function CrystalMirror({ tile, turn, isRotatable }) {
  const rotor = useRef();
  const base = useMemo(() => facetedBlock(0.56, 0.56, 0.07, 0.2, 0.025), []);
  const pane = useMemo(() => {
    const geometry = new THREE.ExtrudeGeometry(roundedRect(0.5, 0.42, 0.06), {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2,
    });
    geometry.center();
    return geometry;
  }, []);
  const rim = useMemo(() => {
    const shape = roundedRect(0.53, 0.45, 0.075);
    shape.holes.push(roundedRect(0.505, 0.425, 0.062));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false, curveSegments: 10 });
    geometry.center();
    return geometry;
  }, []);
  const isSplitter = tile.type === 'splitter';
  const angle = -THREE.MathUtils.degToRad(-45 + turn * 90);
  useEffect(() => {
    gsap.to(rotor.current.rotation, { y: angle, duration: 0.45, ease: 'back.out(1.8)' });
  }, [angle]);
  const pink = <meshPhysicalMaterial color="#ee8fb3" roughness={0.3} clearcoat={0.9} />;
  return (
    <group>
      <mesh geometry={base} position={[0, 0.17, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#fbf3e6" roughness={0.5} clearcoat={0.5} />
      </mesh>
      {isRotatable
        ? [0, Math.PI].map((start) => (
            <group key={start} position={[0, 0.245, 0]} rotation={[0, start, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0.3]}>
                <torusGeometry args={[0.24, 0.014, 8, 32, Math.PI * 0.6]} />
                <meshStandardMaterial color="#4fbfad" />
              </mesh>
              <mesh
                position={[Math.cos(0.3 + Math.PI * 0.6) * 0.24, 0, -Math.sin(0.3 + Math.PI * 0.6) * 0.24]}
                rotation={[Math.PI / 2, 0, -(0.3 + Math.PI * 0.6)]}
              >
                <coneGeometry args={[0.035, 0.07, 10]} />
                <meshStandardMaterial color="#4fbfad" />
              </mesh>
            </group>
          ))
        : [
            [-0.2, -0.2],
            [0.2, -0.2],
            [-0.2, 0.2],
            [0.2, 0.2],
          ].map(([x, z]) => (
            <mesh key={`${x},${z}`} position={[x, 0.25, z]}>
              <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
              <meshPhysicalMaterial color="#d7dde3" metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
      <group ref={rotor} rotation={[0, angle, 0]} position={[0, 0.24, 0]}>
        {/* Two slim posts with gold pivot knobs. */}
        {[-0.29, 0.29].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.2, 0]} castShadow>
              <cylinderGeometry args={[0.016, 0.02, 0.4, 10]} />
              {pink}
            </mesh>
            <mesh position={[x, 0.33, 0]}>
              <sphereGeometry args={[0.028, 14, 10]} />
              <meshPhysicalMaterial {...BRASS} />
            </mesh>
          </group>
        ))}
        <group position={[0, 0.33, 0]}>
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
                opacity={0.65}
              />
            ) : (
              <MirrorGlass />
            )}
          </mesh>
          {/* A soft diagonal reflection streak on each face. */}
          {[0.017, -0.017].map((z) => (
            <mesh key={z} position={[-0.08, 0.03, z]} rotation={[0, z < 0 ? Math.PI : 0, 0.7]}>
              <planeGeometry args={[0.07, 0.5]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
            </mesh>
          ))}
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
      [0, 0.06, 0, 0.2],
      [-0.17, 0, 0.04, 0.15],
      [0.17, 0.01, -0.02, 0.16],
      [0.07, 0.15, 0.03, 0.14],
      [-0.08, 0.13, -0.05, 0.13],
      [0.02, -0.02, 0.15, 0.13],
      [-0.03, -0.01, -0.15, 0.13],
      [0.26, -0.03, 0.06, 0.1],
      [-0.26, -0.04, -0.03, 0.1],
    ],
    [],
  );
  useFrame(({ clock }) => {
    if (!calm) group.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 1.3) * 0.025;
  });
  return (
    <group ref={group} position={[0, 0.5, 0]}>
      {puffs.map(([x, y, z, r], n) => (
        <mesh key={n} position={[x, y, z]} scale={[1, 0.85, 1]} castShadow>
          <sphereGeometry args={[r, 24, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={1} emissive="#f4f1ff" emissiveIntensity={0.18} />
        </mesh>
      ))}
    </group>
  );
}

/** A shadow crystal: dark smoky obsidian shards (keep the light away!); they flare red if light touches them. */
export function ShadowShard({ isLit }) {
  const shards = useMemo(() => {
    const make = (r, h) => {
      const body = new THREE.CylinderGeometry(r, r * 1.1, h, 5);
      body.translate(0, h / 2, 0);
      const tip = new THREE.ConeGeometry(r, r * 1.8, 5);
      tip.translate(0, h + r * 0.9, 0);
      return [body, tip];
    };
    return [
      { parts: make(0.1, 0.3), position: [0, 0, 0], rotation: [0, 0, 0] },
      { parts: make(0.06, 0.16), position: [0.1, 0, 0.05], rotation: [0.2, 0.5, -0.5] },
      { parts: make(0.06, 0.14), position: [-0.09, 0, -0.06], rotation: [-0.2, 1.4, 0.5] },
    ];
  }, []);
  return (
    <group position={[0, 0.2, 0]} scale={1.45}>
      {shards.map((shard, n) => (
        <group key={n} position={shard.position} rotation={shard.rotation}>
          {shard.parts.map((geometry, k) => (
            <mesh key={k} geometry={geometry} castShadow>
              <meshPhysicalMaterial
                color="#2f2a31"
                roughness={0.15}
                clearcoat={1}
                flatShading
                emissive={isLit ? '#ff3b30' : '#3a2f3d'}
                emissiveIntensity={isLit ? 1.4 : 0.25}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** A wall: a carved cream stone block with a pink X inset on top. */
export function StoneBlocker() {
  const block = useMemo(() => facetedBlock(0.78, 0.78, 0.46, 0.14, 0.04), []);
  return (
    <group position={[0, 0.17, 0]}>
      <mesh geometry={block} castShadow receiveShadow>
        <meshStandardMaterial color="#efe3cf" roughness={0.85} flatShading />
      </mesh>
      {[1, -1].map((tilt) => (
        <mesh key={tilt} position={[0, 0.465, 0]} rotation={[-Math.PI / 2, 0, (tilt * Math.PI) / 4]}>
          <planeGeometry args={[0.46, 0.08]} />
          <meshStandardMaterial color="#e48aa9" />
        </mesh>
      ))}
    </group>
  );
}
