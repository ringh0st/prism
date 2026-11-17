/*
 * The Library world on the R3F board: the room, oak parquet tiles you tap, every piece in library style, Lumi's
 * family as the targets and natural lamplight. It only draws: the rules, taps and solve are the game's own.
 */
import { isRotatable } from '../../../game/beam.js';
import { TILE } from '../../../game/constants.js';
import { cellPosition } from '../look.js';
import Piece from '../Piece.jsx';
import { BankerLamp, BookStack, FixedMirror, GearMirror } from './LibraryPieces.jsx';
import { LibraryRoom, ParquetTile } from './LibraryRoom.jsx';
import NaturalBeam from './NaturalBeam.jsx';
import RescuedLumi, { lumiAgeFor } from './RescuedLumi.jsx';
import { Flare } from './shared.jsx';

const TILE_TOP = 0.09;
const BEAM_Y = 0.47;
/** Pieces that turn the light: a soft glow where a beam meets one. */
const TURNERS = new Set([TILE.MIRROR, TILE.SPLITTER, TILE.PRISM, TILE.PORTAL]);

function LibraryPiece({ level, tile, index, turn, isLit, calm }) {
  switch (tile.type) {
    case TILE.EMITTER:
      return <BankerLamp tile={tile} turn={turn} />;
    case TILE.MIRROR:
      return isRotatable(tile) ? <GearMirror turn={turn} /> : <FixedMirror turn={turn} />;
    case TILE.WALL:
      return <BookStack />;
    case TILE.GEM:
      return (
        <group scale={1.25}>
          <RescuedLumi color={tile.color ?? 'sun'} age={lumiAgeFor(level.id, index)} isLit={isLit} calm={calm} />
        </group>
      );
    default:
      // Pieces without a library design yet keep their current look.
      return (
        <group position={[0, -0.08, 0]}>
          <Piece tile={tile} turn={turn} isLit={isLit} calm={calm} />
        </group>
      );
  }
}

export default function LibraryScene({ level, turns, trace, litCells, calm, onTap }) {
  const tileAt = new Map(level.tiles.map((tile, i) => [tile.y * level.width + tile.x, i]));
  return (
    <>
      <LibraryRoom level={level} />
      {Array.from({ length: level.width * level.height }, (_, cell) => {
        const x = cell % level.width;
        const y = Math.floor(cell / level.width);
        const [px, , pz] = cellPosition(level, x, y);
        return (
          <ParquetTile
            key={cell}
            cell={cell}
            x={x}
            y={y}
            position={[px, 0.05, pz]}
            isLit={litCells.has(cell)}
            onClick={(event) => onTap(event, cell)}
          />
        );
      })}
      {level.tiles.map((tile, i) => {
        const cell = tile.y * level.width + tile.x;
        const [px, , pz] = cellPosition(level, tile.x, tile.y);
        return (
          <group key={i} position={[px, TILE_TOP, pz]} onClick={(event) => onTap(event, cell)}>
            <LibraryPiece
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
            <NaturalBeam level={level} segment={segment} height={BEAM_Y} floorY={TILE_TOP + 0.01} calm={calm} />
            {turnsHere && <Flare position={[...cellPosition(level, segment.x2, segment.y2)].map((v, k) => (k === 1 ? BEAM_Y : v))} size={0.55} />}
          </group>
        );
      })}
    </>
  );
}
