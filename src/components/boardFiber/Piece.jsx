import { isRotatable } from '../../game/beam.js';
import { TILE } from '../../game/constants.js';
import CrystalGem from './CrystalGem.jsx';
import { CrystalMirror, LanternLamp, ShadowShard, StoneBlocker } from './Detailed.jsx';
import { Marker } from './Blocks.jsx';

/** Each tile type's element; add a new piece here. Types without their own design get a plain marker. */
export default function Piece({ tile, turn, isLit, isDarkened, calm }) {
  switch (tile.type) {
    case TILE.EMITTER:
      return <LanternLamp tile={tile} turn={turn} calm={calm} />;
    case TILE.MIRROR:
    case TILE.SPLITTER:
      return <CrystalMirror tile={tile} turn={turn} isRotatable={isRotatable(tile)} />;
    case TILE.GEM:
      return <CrystalGem tile={tile} isLit={isLit} isDarkened={isDarkened} calm={calm} />;
    case TILE.WALL:
      return <StoneBlocker />;
    case TILE.SHADE:
      return <ShadowShard isLit={isLit} />;
    default:
      return <Marker />;
  }
}
