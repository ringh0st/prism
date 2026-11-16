import { useMemo } from 'react';
import * as THREE from 'three';
import { LOOK, cellPosition, pillow } from './look.js';

/**
 * The board: a chunky rounded tray in the world's board color with a raised lip, and a soft pillowy tile on every
 * cell in the world's two cell colors; tiles the light passes over warm towards honey.
 */
export default function Tray({ level, theme, litCells, onTileClick }) {
  const tray = useMemo(() => pillow(level.width + 0.55, level.height + 0.55, 0.42, 0.42, 0.14), [level]);
  const lip = useMemo(() => pillow(level.width + 0.75, level.height + 0.75, 0.3, 0.5, 0.12), [level]);
  const tile = useMemo(() => pillow(0.86, 0.86, 0.16, 0.22, 0.07), []);
  const honey = useMemo(() => new THREE.Color(LOOK.butter), []);
  const board = new THREE.Color(theme.board);
  return (
    <group>
      <mesh geometry={lip} position={[0, -0.42, 0]} receiveShadow>
        <meshStandardMaterial color={board.clone().multiplyScalar(0.86)} roughness={0.7} />
      </mesh>
      <mesh geometry={tray} position={[0, -0.36, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={board} roughness={0.65} />
      </mesh>
      {Array.from({ length: level.width * level.height }, (_, cell) => {
        const x = cell % level.width;
        const y = Math.floor(cell / level.width);
        const base = new THREE.Color((x + y) % 2 ? theme.cellAlt : theme.cell);
        const color = litCells.has(cell) ? base.clone().lerp(honey, 0.4) : base;
        return (
          <mesh
            key={cell}
            geometry={tile}
            position={cellPosition(level, x, y)}
            receiveShadow
            userData={{ cell }}
            onClick={(event) => onTileClick(event, cell)}
          >
            <meshPhysicalMaterial color={color} roughness={0.55} clearcoat={0.35} clearcoatRoughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}
