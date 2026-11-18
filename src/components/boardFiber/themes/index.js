/*
 * The looks of the themed boards: for each theme its room, the tile you tap, its pieces and its light. A piece a
 * theme hasn't drawn yet falls back to the plain board's piece (ThemedScene).
 */
import { CastleWall, CrystalSplitter, PillarCrystal, PillarShield, ShieldMirror, StainedGlassTower, Torch } from '../castle/CastlePieces.jsx';
import { CASTLE_HEIGHT, CASTLE_PAD, CastleRoom, Flagstone } from '../castle/CastleRoom.jsx';
import { BankerLamp, BookcaseWall, DeskGlass, FixedMirror, FixedSplitter, GearMirror, GearSplitter } from '../library/LibraryPieces.jsx';
import { LibraryRoom, ParquetTile, ROOM_HEIGHT, ROOM_PAD } from '../library/LibraryRoom.jsx';
import { CandleLantern, LilyGlass, LogWall, PondFixedMirror, PondFixedSplitter, PondMirror, PondSplitter } from '../pond/PondPieces.jsx';
import { LilyPad, POND_HEIGHT, POND_PAD, PondRoom } from '../pond/PondRoom.jsx';

export const THEME_LOOKS = {
  library: {
    Room: LibraryRoom,
    Tile: ParquetTile,
    tileY: 0.05,
    tileTop: 0.09,
    pieces: {
      lamp: BankerLamp,
      mirror: GearMirror,
      fixedMirror: FixedMirror,
      splitter: GearSplitter,
      fixedSplitter: FixedSplitter,
      filter: DeskGlass,
      wall: BookcaseWall,
    },
    room: { pad: ROOM_PAD, height: ROOM_HEIGHT },
    light: { sky: '#ffe6c4', ground: '#3a2418', fill: 0.65, sun: 1.1 },
    wall: null,
  },
  pond: {
    Room: PondRoom,
    Tile: LilyPad,
    tileY: 0.05,
    tileTop: 0.1,
    pieces: { lamp: CandleLantern, mirror: PondMirror, fixedMirror: PondFixedMirror, splitter: PondSplitter, fixedSplitter: PondFixedSplitter, filter: LilyGlass, wall: LogWall },
    room: { pad: POND_PAD, height: POND_HEIGHT },
    light: { sky: '#fff6e0', ground: '#5f8a66', fill: 0.8, sun: 1.35 },
    // The window's wall behind the pond: a soft meadow morning.
    wall: 'linear-gradient(180deg, #f3f1df, #dfead0)',
  },
  castle: {
    Room: CastleRoom,
    Tile: Flagstone,
    tileY: 0.05,
    tileTop: 0.09,
    pieces: {
      lamp: Torch,
      mirror: ShieldMirror,
      fixedMirror: PillarShield,
      splitter: CrystalSplitter,
      fixedSplitter: PillarCrystal,
      filter: StainedGlassTower,
      wall: CastleWall,
    },
    room: { pad: CASTLE_PAD, height: CASTLE_HEIGHT },
    light: { sky: '#fff1dc', ground: '#6b6258', fill: 0.75, sun: 1.3 },
    // The window's wall behind the castle: a warm evening sky.
    wall: 'linear-gradient(180deg, #fdf0e6, #f9dcd6)',
  },
};
