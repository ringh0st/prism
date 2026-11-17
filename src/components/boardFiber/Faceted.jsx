/*
 * The faceted style (owner's example: crisp low-poly shapes, flat facets, chamfered blocks): the mirror, lamp and gem
 * for the R3F board, in the LumiPals palette. Flat shading gives each face one clean tone, so pieces read clearly.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { BEAM_COLORS, BEAM_HEIGHT, LOOK, WARM, chamferedRect, facetedBlock, glowing } from './look.js';

const matte = (color) => <meshStandardMaterial color={color} roughness={0.7} flatShading />;
const DIRECTION_ANGLE = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 };

/** A chamfered frame (an octagon ring) around a pane of mirror glass. */
function frameGeometry(size, border) {
  const shape = chamferedRect(size, size, size * 0.24);
  shape.holes.push(chamferedRect(size - border * 2, size - border * 2, (size - border * 2) * 0.24));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  geometry.center();
  return geometry;
}

/**
 * Mirror: a square pane of pale mirror glass in a chamfered coral frame, standing straight on a low faceted plinth;
 * it swings a quarter turn with a springy GSAP ease. A fixed one stands on a stone plinth; a splitter's frame is mint.
 */
export function FacetedMirror({ tile, turn, isRotatable, pieceColor = WARM.piece }) {
  const rotor = useRef();
  const frame = useMemo(() => frameGeometry(0.62, 0.09), []);
  const pane = useMemo(() => new THREE.ShapeGeometry(chamferedRect(0.46, 0.46, 0.11)), []);
  const plinth = useMemo(() => facetedBlock(0.5, 0.5, 0.08, 0.12, 0.02), []);
  const isSplitter = tile.type === 'splitter';
  const angle = -THREE.MathUtils.degToRad(-45 + turn * 90);
  useEffect(() => {
    gsap.to(rotor.current.rotation, { y: angle, duration: 0.45, ease: 'back.out(1.8)' });
  }, [angle]);
  return (
    <group>
      <mesh geometry={plinth} position={[0, 0.17, 0]} castShadow receiveShadow>
        {matte(isRotatable ? WARM.standRotating : LOOK.stone)}
      </mesh>
      <group ref={rotor} rotation={[0, angle, 0]} position={[0, 0.25 + 0.31, 0]}>
        <mesh geometry={frame} castShadow receiveShadow>
          {matte(isSplitter ? '#e9a99a' : pieceColor)}
        </mesh>
        {[0.012, -0.012].map((z) => (
          <mesh key={z} geometry={pane} position={[0, 0, z]} rotation={[0, z < 0 ? Math.PI : 0, 0]}>
            <meshPhysicalMaterial
              color={isSplitter ? '#dff6ef' : '#cfe7f1'}
              metalness={0.3}
              roughness={0.05}
              clearcoat={1}
              emissive="#eef8fb"
              emissiveIntensity={0.4}
              transparent={isSplitter}
              opacity={isSplitter ? 0.7 : 1}
            />
          </mesh>
        ))}
        {/* Two diagonal glints across the glass: the classic "this is a mirror" mark. */}
        {[-0.07, 0.05].map((x, n) => (
          <mesh key={x} position={[x, 0.02, 0.016]} rotation={[0, 0, 0.75]}>
            <planeGeometry args={[n ? 0.025 : 0.05, 0.36]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Lamp: a faceted coral crystal sitting on a chamfered cream pedestal, with a glowing white port on the side the light
 * leaves from; it breathes gently (GSAP). A turning lamp's pedestal is sage.
 */
export function FacetedLamp({ tile, turn, calm, pieceColor = WARM.piece, pieceDeep = WARM.pieceDeep }) {
  const head = useRef();
  const port = useRef();
  const pedestal = useMemo(() => facetedBlock(0.62, 0.62, 0.22, 0.16, 0.03), []);
  const crystal = useMemo(() => new THREE.CylinderGeometry(0.2, 0.28, 0.4, 6), []);
  const tip = useMemo(() => new THREE.ConeGeometry(0.2, 0.2, 6), []);
  const color = BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun;
  const angle = (DIRECTION_ANGLE[tile.dir] ?? 0) - (tile.turnable ? (turn % 2) * (Math.PI / 2) : 0);
  useEffect(() => {
    gsap.to(head.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.6)' });
  }, [angle]);
  useEffect(() => {
    if (calm) return undefined;
    const pulse = gsap.to(port.current.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    return () => pulse.kill();
  }, [calm]);
  return (
    <group>
      <mesh geometry={pedestal} position={[0, 0.17, 0]} castShadow receiveShadow>
        {matte(tile.turnable ? WARM.standRotating : WARM.stand)}
      </mesh>
      <group ref={head} rotation={[0, angle, 0]}>
        <mesh geometry={crystal} position={[0, 0.59, 0]} castShadow>
          {matte(pieceColor)}
        </mesh>
        <mesh geometry={tip} position={[0, 0.89, 0]} castShadow>
          {matte(pieceDeep)}
        </mesh>
        <group position={[0.25, BEAM_HEIGHT, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <circleGeometry args={[0.1, 6]} />
            <meshBasicMaterial color={glowing('#fffdf2', 5)} toneMapped={false} />
          </mesh>
          <mesh ref={port} position={[0, 0, 0.01]}>
            <circleGeometry args={[0.16, 6]} />
            <meshBasicMaterial color={glowing(color, 2)} toneMapped={false} transparent opacity={0.45} depthWrite={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Each color keeps its own outline from above: diamond 8 facets, round 12, triangle 3, square 4. */
const SIDES = { sun: 8, coral: 12, lime: 3, sky: 4 };

/**
 * Gem: a brilliant-cut crystal, pale and faceted, standing on a little faceted stand. When light reaches it, it fills
 * with its color, pops (GSAP) and throws out rays and sparks, then turns slowly while it stays lit.
 */
export function FacetedGem({ tile, isLit, isDarkened, calm }) {
  const jewel = useRef();
  const material = useRef();
  const rays = useRef();
  const sparks = useRef([]);
  const color = BEAM_COLORS[tile.color] ?? BEAM_COLORS.sun;
  const sides = SIDES[tile.color] ?? 8;
  const geometry = useMemo(() => {
    const outline = [
      [0.001, -0.3],
      [0.3, 0.0],
      [0.3, 0.04],
      [0.19, 0.18],
      [0.001, 0.18],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(outline, sides, sides === 4 ? Math.PI / 4 : 0);
  }, [sides]);
  const stand = useMemo(() => facetedBlock(0.34, 0.34, 0.12, 0.09, 0.02), []);
  const idle = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.6), [color]);

  useEffect(() => {
    const m = material.current;
    const target = isDarkened ? new THREE.Color('#8c8378') : isLit ? new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.15) : idle;
    gsap.to(m.color, { r: target.r, g: target.g, b: target.b, duration: 0.35 });
    gsap.to(m, { emissiveIntensity: isLit && !isDarkened ? 0.7 : 0, duration: 0.4 });
    gsap.to(rays.current.scale, { x: isLit ? 1 : 0.001, y: isLit ? 1 : 0.001, z: isLit ? 1 : 0.001, duration: 0.45, ease: 'back.out(2)' });
    if (isLit && !calm) {
      gsap
        .timeline()
        .to(jewel.current.scale, { x: 0.85, y: 0.85, z: 0.85, duration: 0.1 })
        .to(jewel.current.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.2, ease: 'back.out(3)' })
        .to(jewel.current.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
      sparks.current.forEach((spark, n) => {
        const a = (n / sparks.current.length) * Math.PI * 2;
        gsap.fromTo(
          spark.position,
          { x: 0, y: 0.6, z: 0 },
          { x: Math.cos(a) * 0.6, y: 0.75 + (n % 3) * 0.12, z: Math.sin(a) * 0.6, duration: 0.8, ease: 'power2.out' },
        );
        gsap.fromTo(spark.scale, { x: 1, y: 1, z: 1 }, { x: 0.01, y: 0.01, z: 0.01, duration: 0.8, ease: 'power1.in' });
      });
    }
  }, [isLit, isDarkened, calm, color, idle]);

  useFrame((_, dt) => {
    if (calm) return;
    jewel.current.rotation.y += dt * (isLit ? 0.9 : 0.15);
    rays.current.rotation.z += dt * 0.3;
  });

  return (
    <group>
      <mesh geometry={stand} position={[0, 0.17, 0]} castShadow receiveShadow>
        {matte(WARM.stand)}
      </mesh>
      <group ref={jewel} position={[0, 0.62, 0]}>
        <mesh geometry={geometry} castShadow>
          <meshPhysicalMaterial
            ref={material}
            color={idle}
            roughness={0.1}
            clearcoat={1}
            iridescence={0.8}
            flatShading
            emissive={color}
            emissiveIntensity={0}
          />
        </mesh>
      </group>
      {/* Rays fanning out behind a lit gem, always facing the camera (a billboard of thin wedges). */}
      <Billboard position={[0, 0.62, 0]}>
        <group ref={rays} scale={0.001}>
          {Array.from({ length: 10 }, (_, n) => (
            <mesh key={n} rotation={[0, 0, (n / 10) * Math.PI * 2]} position={[0, 0, -0.05]}>
              <planeGeometry args={[0.06, 1.3]} />
              <meshBasicMaterial color={glowing(color, 1.6)} toneMapped={false} transparent opacity={n % 2 ? 0.25 : 0.45} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </Billboard>
      {Array.from({ length: 10 }, (_, n) => (
        <mesh key={n} ref={(mesh) => (sparks.current[n] = mesh)} position={[0, 0.6, 0]} scale={0.01}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshBasicMaterial color={glowing('#ffe9a8', 3)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Keeps its children turned to face the camera. */
function Billboard({ children, ...props }) {
  const group = useRef();
  useFrame(({ camera }) => group.current?.quaternion.copy(camera.quaternion));
  return (
    <group ref={group} {...props}>
      {children}
    </group>
  );
}
