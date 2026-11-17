import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LOOK, cellPosition, facetedBlock } from './look.js';

/**
 * The board: a chunky rounded tray in the world's board color with a raised lip, and a soft pillowy tile on every
 * cell in the world's two cell colors; tiles the light passes over warm towards honey.
 */
export default function Tray({ level, theme, litCells, hintCells = null, calm = false, onTileClick }) {
  const tray = useMemo(() => facetedBlock(level.width + 0.5, level.height + 0.5, 0.42, 0.3, 0.06), [level]);
  const lip = useMemo(() => facetedBlock(level.width + 0.7, level.height + 0.7, 0.3, 0.4, 0.06), [level]);
  const tile = useMemo(() => facetedBlock(0.94, 0.94, 0.16, 0.1, 0.035), []);
  const honey = useMemo(() => new THREE.Color(LOOK.butter).lerp(new THREE.Color('#ffffff'), 0.2), []);
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
        // Where light passes the tile glows honey-gold (the floor's own lit color if it has one).
        const color = litCells.has(cell) ? (theme.lit ? new THREE.Color(theme.lit) : base.clone().lerp(honey, 0.4)) : base;
        if (hintCells?.has(cell) && !litCells.has(cell)) {
          return (
            <HintTile
              key={cell}
              geometry={tile}
              position={cellPosition(level, x, y)}
              base={base}
              calm={calm}
              onClick={(event) => onTileClick(event, cell)}
            />
          );
        }
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

/** A tile in the hint's "look around here" area: it softly pulses towards honey (still for reduced motion). */
function HintTile({ geometry, position, base, calm, onClick }) {
  const material = useRef();
  const honey = useMemo(() => new THREE.Color('#f7d47a'), []);
  useFrame(({ clock }) => {
    const mix = calm ? 0.45 : 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 3.5));
    material.current.color.copy(base).lerp(honey, mix);
  });
  return (
    <mesh geometry={geometry} position={position} receiveShadow onClick={onClick}>
      <meshStandardMaterial ref={material} color={base} roughness={0.75} flatShading />
    </mesh>
  );
}
