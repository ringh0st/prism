import { useMemo } from 'react';
import * as THREE from 'three';
import { LOOK, cellPosition, facetedBlock } from './look.js';

/**
 * The board: a chunky rounded tray in the world's board color with a raised lip, and a soft pillowy tile on every
 * cell in the world's two cell colors; tiles the light passes over warm towards honey.
 */
export default function Tray({ level, theme, litCells, onTileClick }) {
  const tray = useMemo(() => facetedBlock(level.width + 0.5, level.height + 0.5, 0.42, 0.3, 0.06), [level]);
  const lip = useMemo(() => facetedBlock(level.width + 0.7, level.height + 0.7, 0.3, 0.4, 0.06), [level]);
  const tile = useMemo(() => facetedBlock(0.94, 0.94, 0.16, 0.1, 0.035), []);
  const honey = useMemo(() => new THREE.Color(LOOK.butter), []);
  const board = new THREE.Color(theme.board);
  return (
    <group>
      <mesh geometry={lip} position={[0, -0.42, 0]} receiveShadow>
        <meshStandardMaterial color={board.clone().multiplyScalar(0.82)} roughness={0.75} flatShading />
      </mesh>
      <mesh geometry={tray} position={[0, -0.36, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={board} roughness={0.7} flatShading />
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
            <meshStandardMaterial color={color} roughness={0.75} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}
