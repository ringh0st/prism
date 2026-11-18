/*
 * A themed level on the R3F board: the theme's room, the tiles you tap, every piece in the theme's style (the later
 * worlds' pieces are shared by all themes, TwistPieces.jsx), Lumi's family as the targets and natural light. It only
 * draws: the rules, taps and solve are the game's own.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { isRotatable } from '../../../game/beam.js';
import { TILE } from '../../../game/constants.js';
import { lumiCoatFor } from '../../../game/boardThemes.js';
import { floorGlowColor } from '../../../lib/beamStyle.js';
import { cellPosition } from '../look.js';
import Bake from './Bake.jsx';
import NaturalBeam from './NaturalBeam.jsx';
import RescuedLumi, { lumiAgeFor } from './RescuedLumi.jsx';
import { Flare } from './shared.jsx';
import {
  CrackPips,
  DarkBack,
  FogCloud,
  GhostPath,
  HintGlow,
  LightGate,
  LightSwitch,
  Portal,
  PrismCrystal,
  ShadowCrystal,
  TwinMark,
  VoidHole,
} from './TwistPieces.jsx';

const BEAM_ABOVE_TILE = 0.38;
/** Pieces that turn the light: a soft glow where a beam meets one. */
const TURNERS = new Set([TILE.MIRROR, TILE.SPLITTER, TILE.PRISM, TILE.PORTAL]);
/** Pieces that never move or change: drawn as one baked mesh per material (Bake.jsx). Mirrors and lamps bake inside their own stands. */
const STANDS_STILL = new Set([TILE.WALL, TILE.FILTER]);

/** Which of the theme's own pieces draws this tile (undefined for the pieces every theme shares). */
function themedPiece(pieces, tile, isCracked) {
  // A cracked mirror can't turn any more, so it stands like a fixed one.
  const turns = isRotatable(tile) && !isCracked;
  switch (tile.type) {
    case TILE.EMITTER:
      return pieces.lamp;
    case TILE.MIRROR:
      return turns ? pieces.mirror : pieces.fixedMirror;
    case TILE.SPLITTER:
      return turns ? pieces.splitter : pieces.fixedSplitter;
    case TILE.FILTER:
      return pieces.filter;
    case TILE.WALL:
      return pieces.wall;
    default:
      return undefined;
  }
}

function ScenePiece({ look, level, tile, index, turn, turnsLeft, trace, isDarkened, calm }) {
  switch (tile.type) {
    case TILE.GEM: {
      const color = tile.color ?? 'sun';
      // Its place among the level's Lumis, so no two on a board share a coat.
      const order = level.tiles.slice(0, index).filter((other) => other.type === TILE.GEM).length;
      return (
        <group scale={1.25}>
          <RescuedLumi
            color={color}
            age={lumiAgeFor(level.id, index)}
            coat={lumiCoatFor(level, order, color)}
            isLit={trace.litGems.has(index) && !isDarkened}
            calm={calm}
          />
        </group>
      );
    }
    case TILE.SHADE:
      return <ShadowCrystal isLit={trace.litShades.has(index)} />;
    case TILE.PORTAL:
      return <Portal tile={tile} calm={calm} />;
    case TILE.PRISM:
      return (
        <Bake>
          <PrismCrystal />
        </Bake>
      );
    case TILE.GATE:
      return <LightGate tile={tile} isOpen={trace.openGates.has(tile.pair)} />;
    case TILE.SWITCH:
      return <LightSwitch tile={tile} isLit={trace.litSwitches.has(index)} />;
    case TILE.VOID:
      return <VoidHole calm={calm} />;
    default: {
      const isCracked = tile.fragile && turnsLeft === 0;
      const Themed = themedPiece(look.pieces, tile, isCracked);
      return (
        <>
          {STANDS_STILL.has(tile.type) ? (
            <Bake>
              <Themed tile={tile} turn={turn} level={level} calm={calm} />
            </Bake>
          ) : (
            <Themed tile={tile} turn={turn} level={level} calm={calm} />
          )}
          {tile.link && <TwinMark link={tile.link} />}
          {tile.fragile && <CrackPips turnsLeft={turnsLeft} />}
          {tile.oneSided !== undefined && <DarkBack tile={tile} orient={turn} />}
        </>
      );
    }
  }
}

/**
 * @param state { turns, trace, turnsLeft, revealedCells, darkenedTile, lookHere, ghost } (from Board)
 */
export default function ThemedScene({ look, level, state, litCells, calm, onTap }) {
  const { turns, trace, turnsLeft, revealedCells, darkenedTile, lookHere, ghost } = state;
  const { Room, Tile, tileY, tileTop } = look;
  const beamY = tileTop + BEAM_ABOVE_TILE;
  // Tiles under the light glow in the player's beam style (read once when the level opens).
  const glow = useMemo(floorGlowColor, []);
  const tileAt = new Map(level.tiles.map((tile, i) => [tile.y * level.width + tile.x, i]));
  const at = (x, y, height) => new THREE.Vector3(...cellPosition(level, x, y)).setY(height);
  return (
    <>
      <Bake>
        <Room level={level} />
      </Bake>
      {Array.from({ length: level.width * level.height }, (_, cell) => {
        const x = cell % level.width;
        const y = Math.floor(cell / level.width);
        const [px, , pz] = cellPosition(level, x, y);
        return (
          <group key={cell}>
            <Tile cell={cell} x={x} y={y} position={[px, tileY, pz]} isLit={litCells.has(cell)} glow={glow} onClick={(event) => onTap(event, cell)} />
            {lookHere?.has(cell) && !litCells.has(cell) && <HintGlow position={[px, tileTop + 0.012, pz]} calm={calm} />}
          </group>
        );
      })}
      {level.tiles.map((tile, i) => {
        const cell = tile.y * level.width + tile.x;
        const [px, , pz] = cellPosition(level, tile.x, tile.y);
        const isHidden = tile.fog && revealedCells !== null && !revealedCells.has(cell);
        return (
          <group key={i} position={[px, tileTop, pz]} onClick={(event) => onTap(event, cell)}>
            {isHidden ? (
              <FogCloud calm={calm} />
            ) : (
              <ScenePiece
                look={look}
                level={level}
                tile={tile}
                index={i}
                turn={turns[i] ?? 0}
                turnsLeft={turnsLeft?.[i]}
                trace={trace}
                isDarkened={darkenedTile === i}
                calm={calm}
              />
            )}
          </group>
        );
      })}
      {trace.segments.map((segment, i) => {
        const end = tileAt.get(segment.y2 * level.width + segment.x2);
        const turnsHere = end !== undefined && TURNERS.has(level.tiles[end].type);
        return (
          <group key={`${segment.x1},${segment.y1},${segment.x2},${segment.y2},${segment.color},${i}`}>
            <NaturalBeam level={level} segment={segment} height={beamY} floorY={tileTop + 0.01} calm={calm} />
            {turnsHere && <Flare position={at(segment.x2, segment.y2, beamY)} size={0.55} />}
          </group>
        );
      })}
      {ghost?.map((segment, i) => (
        <GhostPath key={i} from={at(segment.x1, segment.y1, beamY)} to={at(segment.x2, segment.y2, beamY)} />
      ))}
    </>
  );
}
