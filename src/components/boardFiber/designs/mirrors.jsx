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
