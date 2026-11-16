/*
 * The 3D board's elements, one module each, looked up by tile type. To add a new piece: write its builder
 * (returning { group, …parts the scene animates }) in its own module and add it to ELEMENTS.
 */
import * as THREE from 'three';
import { TILE } from '../../../game/constants.js';
import { addShadowed, mat } from './shared.js';
import { makeMirror } from './mirror.js';
import { makeLamp } from './lamp.js';
import { makeGem } from './gem.js';
import { makePrism } from './prism.js';
import { makeFilter, makeShade, makeVoid, makeWall } from './blocks.js';
import { makeGate, makePortal, makeSwitch } from './pairs.js';

export { makeFog } from './fog.js';
export { BEAM_HEIGHT, BEAM_HEX, addShadowed, darkenedColor, glowSprite, mat } from './shared.js';

const ELEMENTS = {
  [TILE.MIRROR]: makeMirror,
  [TILE.SPLITTER]: makeMirror,
  [TILE.EMITTER]: makeLamp,
  [TILE.GEM]: makeGem,
  [TILE.WALL]: makeWall,
  [TILE.FILTER]: makeFilter,
  [TILE.SHADE]: makeShade,
  [TILE.PORTAL]: makePortal,
  [TILE.PRISM]: makePrism,
  [TILE.GATE]: makeGate,
  [TILE.SWITCH]: makeSwitch,
  [TILE.VOID]: makeVoid,
};

/** A plain marker for a type with no element yet, so the board still reads. */
function makeMarker() {
  const group = new THREE.Group();
  addShadowed(group, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 6), mat('#bfae96'))).position.y = 0.1;
  return { group };
}

/** Build a tile's 3D element. `context`: { environment, theme, isRotatable }. */
export function makePiece(tile, context) {
  return (ELEMENTS[tile.type] ?? makeMarker)(tile, context);
}
