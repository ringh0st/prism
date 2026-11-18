/*
 * Color glass shared by the themes: each light's glass color and the shape that names it (so color is never the
 * only clue), the shape as a little 3D mark, and a glass bell that themes stand on their own base.
 */
export const GLASS = {
  sun: { color: '#ffcf4a', shape: 'diamond' },
  coral: { color: '#ff7a68', shape: 'round' },
  lime: { color: '#7bd464', shape: 'triangle' },
  sky: { color: '#63b6ee', shape: 'square' },
};

export function ShapeMark({ shape, color }) {
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

/**
 * Color glass as a glass bell: a rounded dome of colored glass with its shape on top. Light passing through from
 * any side leaves in its color. `children` is the theme's own base under the bell.
 */
export function GlassBell({ tile, children }) {
  const { color, shape } = GLASS[tile.color] ?? GLASS.sun;
  const glass = (
    <meshPhysicalMaterial color={color} roughness={0.06} clearcoat={1} transparent opacity={0.6} emissive={color} emissiveIntensity={0.45} />
  );
  return (
    <group>
      {children}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.32, 24]} />
        {glass}
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <sphereGeometry args={[0.24, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {glass}
      </mesh>
      <group position={[0, 0.8, 0]}>
        <ShapeMark shape={shape} color={color} />
      </group>
    </group>
  );
}
