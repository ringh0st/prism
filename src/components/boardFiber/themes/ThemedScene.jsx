/*
 * A themed world on the R3F board: the theme's room, the tiles you tap, every piece in the theme's style, Lumi's
 * family as the targets and natural light. It only draws: the rules, taps and solve are the game's own.
 */
import { useMemo } from 'react';
import { isRotatable } from '../../../game/beam.js';
import { TILE } from '../../../game/constants.js';
import { cellPosition } from '../look.js';
import Piece from '../Piece.jsx';
import NaturalBeam from './NaturalBeam.jsx';
import RescuedLumi, { lumiAgeFor } from './RescuedLumi.jsx';
import { lumiCoatFor } from '../../../game/boardThemes.js';
import { Flare } from './shared.jsx';
import { floorGlowColor } from '../../../lib/beamStyle.js';

const BEAM_ABOVE_TILE = 0.38;
/** Pieces that turn the light: a soft glow where a beam meets one. */
const TURNERS = new Set([TILE.MIRROR, TILE.SPLITTER, TILE.PRISM, TILE.PORTAL]);

/** Which of the theme's pieces draws this tile (undefined when the theme hasn't drawn it yet). */
function themedPiece(pieces, tile) {
  switch (tile.type) {
    case TILE.EMITTER:
      return pieces.lamp;
    case TILE.MIRROR:
      return isRotatable(tile) ? pieces.mirror : pieces.fixedMirror;
    case TILE.SPLITTER:
      return isRotatable(tile) ? pieces.splitter : pieces.fixedSplitter;
    case TILE.FILTER:
      return pieces.filter;
    case TILE.WALL:
      return pieces.wall;
    default:
      return undefined;
  }
}

function ThemedPiece({ look, level, tile, index, turn, isLit, calm }) {
  if (tile.type === TILE.GEM) {
    const color = tile.color ?? 'sun';
    // Its place among the level's Lumis, so no two on a board share a coat.
    const order = level.tiles.slice(0, index).filter((other) => other.type === TILE.GEM).length;
    return (
      <group scale={1.25}>
        <RescuedLumi color={color} age={lumiAgeFor(level.id, index)} coat={lumiCoatFor(level, order, color)} isLit={isLit} calm={calm} />
      </group>
    );
  }
  const Themed = themedPiece(look.pieces, tile);
  if (Themed) return <Themed tile={tile} turn={turn} level={level} calm={calm} />;
  // Pieces without a design in this theme yet keep the plain board's look.
  return (
    <group position={[0, -0.08, 0]}>
      <Piece tile={tile} turn={turn} isLit={isLit} calm={calm} />
    </group>
  );
}

export default function ThemedScene({ look, level, turns, trace, litCells, calm, onTap }) {
  const { Room, Tile, tileY, tileTop } = look;
  const beamY = tileTop + BEAM_ABOVE_TILE;
  // Tiles under the light glow in the player's beam style (read once when the level opens).
  const glow = useMemo(floorGlowColor, []);
  const tileAt = new Map(level.tiles.map((tile, i) => [tile.y * level.width + tile.x, i]));
  return (
    <>
      <Room level={level} />
      {Array.from({ length: level.width * level.height }, (_, cell) => {
        const x = cell % level.width;
        const y = Math.floor(cell / level.width);
        const [px, , pz] = cellPosition(level, x, y);
        return (
          <Tile
            key={cell}
            cell={cell}
            x={x}
            y={y}
            position={[px, tileY, pz]}
            isLit={litCells.has(cell)}
            glow={glow}
            onClick={(event) => onTap(event, cell)}
          />
        );
      })}
      {level.tiles.map((tile, i) => {
        const cell = tile.y * level.width + tile.x;
        const [px, , pz] = cellPosition(level, tile.x, tile.y);
        return (
          <group key={i} position={[px, tileTop, pz]} onClick={(event) => onTap(event, cell)}>
            <ThemedPiece
              look={look}
              level={level}
              tile={tile}
              index={i}
              turn={turns[i] ?? 0}
              isLit={trace.litGems.has(i) || trace.litShades.has(i)}
              calm={calm}
            />
          </group>
        );
      })}
      {trace.segments.map((segment, i) => {
        const end = tileAt.get(segment.y2 * level.width + segment.x2);
        const turnsHere = end !== undefined && TURNERS.has(level.tiles[end].type);
        return (
          <group key={`${segment.x1},${segment.y1},${segment.x2},${segment.y2},${segment.color},${i}`}>
            <NaturalBeam level={level} segment={segment} height={beamY} floorY={tileTop + 0.01} calm={calm} />
            {turnsHere && <Flare position={[...cellPosition(level, segment.x2, segment.y2)].map((v, k) => (k === 1 ? beamY : v))} size={0.55} />}
          </group>
        );
      })}
    </>
  );
}
