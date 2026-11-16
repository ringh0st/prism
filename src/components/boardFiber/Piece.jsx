import { isRotatable } from '../../game/beam.js';
import { TILE } from '../../game/constants.js';
import { FacetedGem, FacetedLamp, FacetedMirror } from './Faceted.jsx';
import { Marker, ShadeCrystal, Wall } from './Blocks.jsx';

/** Each tile type's element; add a new piece here. Types without their own design get a plain marker. */
export default function Piece({ tile, turn, isLit, isDarkened, calm }) {
  switch (tile.type) {
    case TILE.EMITTER:
      return <FacetedLamp tile={tile} turn={turn} calm={calm} />;
    case TILE.MIRROR:
    case TILE.SPLITTER:
      return <FacetedMirror tile={tile} turn={turn} isRotatable={isRotatable(tile)} />;
    case TILE.GEM:
      return <FacetedGem tile={tile} isLit={isLit} isDarkened={isDarkened} calm={calm} />;
    case TILE.WALL:
      return <Wall />;
    case TILE.SHADE:
      return <ShadeCrystal isLit={isLit} />;
    default:
      return <Marker />;
  }
}
