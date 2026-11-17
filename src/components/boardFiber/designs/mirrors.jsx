import { useMemo } from 'react';
import * as THREE from 'three';
import { LOOK } from '../look.js';

/** Mirror glass: pale silver with a little sky in it, glossy, and a white streak so it reads as a reflecting face. */
function MirrorGlass({ children, ...props }) {
  return (
    <mesh {...props} castShadow>
      {children}
      <meshPhysicalMaterial
        color="#d3eaf3"
        metalness={0.25}
        roughness={0.08}
        clearcoat={1}
        clearcoatRoughness={0.05}
        envMapIntensity={1.4}
        emissive="#eaf7fb"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

function Turntable() {
  return (
    <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[0.36, 0.38, 0.06, 48]} />
      <meshPhysicalMaterial color={LOOK.mint} roughness={0.5} clearcoat={0.4} />
    </mesh>
  );
}

/** A: Crystal blade. A low, long slab of mirror glass with rounded ends, gold end caps: the flat board's bar, made real. */
export function MirrorBlade() {
  const capsule = useMemo(() => {
    const geometry = new THREE.CapsuleGeometry(0.11, 0.62, 8, 24);
    geometry.rotateZ(Math.PI / 2);
    geometry.scale(1, 1, 0.38);
    return geometry;
  }, []);
  return (
    <group>
      <Turntable />
      <group position={[0, 0.36, 0]}>
        <MirrorGlass geometry={capsule} />
        {[-0.42, 0.42].map((x) => (
          <mesh key={x} position={[x, 0, 0]} castShadow>
            <sphereGeometry args={[0.07, 20, 14]} />
            <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.3} clearcoat={0.6} />
          </mesh>
        ))}
        {[0.045, -0.045].map((z) => (
          <mesh key={z} position={[-0.1, 0.03, z]} rotation={[0, z < 0 ? Math.PI : 0, 0.4]}>
            <planeGeometry args={[0.04, 0.16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** B: Vanity mirror. A round looking-glass in a thin gold ring on a little stem: the classic "mirror" shape. */
export function MirrorVanity() {
  return (
    <group>
      <Turntable />
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.16, 16]} />
        <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.3} />
      </mesh>
      <group position={[0, 0.6, 0]}>
        <MirrorGlass rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.04, 48]} />
        </MirrorGlass>
        <mesh castShadow>
          <torusGeometry args={[0.26, 0.035, 14, 48]} />
          <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.3} clearcoat={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/** C: Leaf mirror. A pointed-oval pane of mirror glass with a slim sage rim, standing like a leaf on its stem. */
export function MirrorLeaf() {
  const pane = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.42, 0);
    shape.quadraticCurveTo(0, 0.42, 0.42, 0);
    shape.quadraticCurveTo(0, -0.42, -0.42, 0);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.03,
      bevelSegments: 4,
      curveSegments: 24,
    });
    geometry.center();
    return geometry;
  }, []);
  const rim = useMemo(() => {
    const curve = new THREE.CurvePath();
    curve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.44, 0, 0), new THREE.Vector3(0, 0.44, 0), new THREE.Vector3(0.44, 0, 0)));
    curve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.44, 0, 0), new THREE.Vector3(0, -0.44, 0), new THREE.Vector3(-0.44, 0, 0)));
    return new THREE.TubeGeometry(curve, 64, 0.028, 10, true);
  }, []);
  return (
    <group>
      <Turntable />
      <group position={[0, 0.5, 0]}>
        <MirrorGlass geometry={pane} />
        <mesh geometry={rim} castShadow>
          <meshPhysicalMaterial color={LOOK.sage} roughness={0.35} clearcoat={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/** A square pane of mirror glass with rounded corners and a slim gold rim (no thick frame, so it never reads as a screen). */
function SquarePane({ size = 0.56 }) {
  const pane = useMemo(() => {
    const shape = roundedSquare(size, 0.08);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 3,
      curveSegments: 8,
    });
    geometry.center();
    return geometry;
  }, [size]);
  const rim = useMemo(() => {
    const shape = roundedSquare(size + 0.06, 0.1);
    shape.holes.push(roundedSquare(size - 0.005, 0.08));
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 3,
      curveSegments: 8,
    });
    geometry.center();
    return geometry;
  }, [size]);
  return (
    <group>
      <MirrorGlass geometry={pane} />
      <mesh geometry={rim} castShadow>
        <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.28} clearcoat={0.7} />
      </mesh>
      {[0.03, -0.03].map((z) => (
        <mesh key={z} position={[-0.1, 0.06, z]} rotation={[0, z < 0 ? Math.PI : 0, 0.7]}>
          <planeGeometry args={[0.05, 0.36]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function roundedSquare(size, radius) {
  const shape = new THREE.Shape();
  const h = size / 2;
  shape.moveTo(-h + radius, -h);
  shape.lineTo(h - radius, -h);
  shape.quadraticCurveTo(h, -h, h, -h + radius);
  shape.lineTo(h, h - radius);
  shape.quadraticCurveTo(h, h, h - radius, h);
  shape.lineTo(-h + radius, h);
  shape.quadraticCurveTo(-h, h, -h, h - radius);
  shape.lineTo(-h, -h + radius);
  shape.quadraticCurveTo(-h, -h, -h + radius, -h);
  return shape;
}

/** Square 1 · Slim square: a square mirror standing straight on its turntable in two little gold clips. */
export function MirrorSquareSlim() {
  return (
    <group>
      <Turntable />
      <group position={[0, 0.54, 0]}>
        <SquarePane />
      </group>
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.26, 0]} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.1]} />
          <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** Square 2 · Diamond: the same square turned onto its corner, held in a little gold cradle, sparkly and light. */
export function MirrorSquareDiamond() {
  return (
    <group>
      <Turntable />
      <group position={[0, 0.66, 0]} rotation={[0, 0, Math.PI / 4]}>
        <SquarePane size={0.5} />
      </group>
      <mesh position={[0, 0.27, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.08, 0.025, 10, 24, Math.PI]} />
        <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Square 3 · Leaning square: a square mirror leaning back on a little sage easel, like a hand mirror set down. */
export function MirrorSquareLean() {
  return (
    <group>
      <Turntable />
      <group position={[0, 0.5, -0.04]} rotation={[-0.32, 0, 0]}>
        <SquarePane />
      </group>
      <mesh position={[0, 0.42, -0.2]} rotation={[0.45, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.38, 0.05]} />
        <meshPhysicalMaterial color={LOOK.sage} roughness={0.35} clearcoat={0.7} />
      </mesh>
    </group>
  );
}

/** Square 4 · Glass cube: a clear square block of glass with a shining mirror across it corner to corner. */
export function MirrorSquareCube() {
  const box = useMemo(() => new THREE.BoxGeometry(0.6, 0.5, 0.6), []);
  return (
    <group>
      <Turntable />
      <mesh geometry={box} position={[0, 0.48, 0]} castShadow>
        <meshPhysicalMaterial color="#e9f7f3" roughness={0.04} transmission={0.85} thickness={0.4} clearcoat={1} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.48, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.82, 0.46, 0.025]} />
        <meshPhysicalMaterial color="#d3eaf3" metalness={0.3} roughness={0.06} clearcoat={1} emissive="#eaf7fb" emissiveIntensity={0.35} />
      </mesh>
      {[
        [-0.3, -0.3],
        [0.3, 0.3],
      ].map(([x, z]) => (
        <mesh key={x} position={[x, 0.48, z]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.52, 12]} />
          <meshPhysicalMaterial color={LOOK.gold} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
