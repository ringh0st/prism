/*
 * Speed for phones: a themed scene is built from hundreds of small meshes, and every mesh is a separate draw. `Bake`
 * melts everything inside it that doesn't move into one mesh per kind of material (same color, shine and texture),
 * once, when it appears. Use it round things that stay as they are (a room, a wall, a mirror on its stand: the stand
 * may turn as a whole). Skip parts that animate on their own by marking them `userData={{ live: true }}`.
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Two materials that draw the same way share a key. */
function materialKey(material) {
  return [
    material.type,
    material.color?.getHexString(),
    material.emissive?.getHexString(),
    material.emissiveIntensity,
    material.roughness,
    material.metalness,
    material.clearcoat,
    material.iridescence,
    material.map?.uuid,
    material.bumpMap?.uuid,
    material.transparent,
    material.opacity,
    material.side,
    material.flatShading,
    material.blending,
    material.toneMapped,
    material.depthWrite,
  ].join('|');
}

/** A geometry moved into the bake's own space, with just the attributes every geometry has. */
function placed(mesh, toBake) {
  const source = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', source.getAttribute('position'));
  geometry.setAttribute(
    'normal',
    source.getAttribute('normal') ?? new THREE.BufferAttribute(new Float32Array(source.getAttribute('position').count * 3), 3),
  );
  geometry.setAttribute('uv', source.getAttribute('uv') ?? new THREE.BufferAttribute(new Float32Array(source.getAttribute('position').count * 2), 2));
  return geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toBake, mesh.matrixWorld));
}

const isLive = (object, root) => {
  for (let node = object; node && node !== root; node = node.parent) if (node.userData?.live) return true;
  return false;
};

export default function Bake({ children }) {
  const group = useRef();
  useLayoutEffect(() => {
    const root = group.current;
    root.updateWorldMatrix(true, true);
    const toBake = root.matrixWorld.clone().invert();
    const kinds = new Map();
    root.traverse((object) => {
      if (!object.isMesh || isLive(object, root)) return;
      const key = materialKey(object.material);
      if (!kinds.has(key)) kinds.set(key, { material: object.material, parts: [], castShadow: false, receiveShadow: false });
      const kind = kinds.get(key);
      kind.parts.push(object);
      kind.castShadow ||= object.castShadow;
      kind.receiveShadow ||= object.receiveShadow;
    });
    const baked = [];
    for (const { material, parts, castShadow, receiveShadow } of kinds.values()) {
      if (parts.length < 2) continue;
      const geometry = mergeGeometries(parts.map((mesh) => placed(mesh, toBake)));
      if (!geometry) continue;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      parts.forEach((part) => (part.visible = false));
      root.add(mesh);
      baked.push({ mesh, parts });
    }
    return () =>
      baked.forEach(({ mesh, parts }) => {
        root.remove(mesh);
        mesh.geometry.dispose();
        parts.forEach((part) => (part.visible = true));
      });
  }, []);
  return <group ref={group}>{children}</group>;
}
