/*
 * The looks of the themed boards: for each theme its room, the tile you tap, its pieces and its light. A piece a
 * theme hasn't drawn yet falls back to the plain board's piece (ThemedScene).
 */
import { BankerLamp, BookStack, FixedMirror, GearMirror } from '../library/LibraryPieces.jsx';
import { LibraryRoom, ParquetTile, ROOM_HEIGHT, ROOM_PAD } from '../library/LibraryRoom.jsx';
import { CandleLantern, LogPile, PondFixedMirror, PondFixedSplitter, PondMirror, PondSplitter } from '../pond/PondPieces.jsx';
import { LilyPad, POND_HEIGHT, POND_PAD, PondRoom } from '../pond/PondRoom.jsx';

export const THEME_LOOKS = {
  library: {
    Room: LibraryRoom,
    Tile: ParquetTile,
    tileY: 0.05,
    tileTop: 0.09,
    pieces: { lamp: BankerLamp, mirror: GearMirror, fixedMirror: FixedMirror, wall: BookStack },
    room: { pad: ROOM_PAD, height: ROOM_HEIGHT },
    light: { sky: '#ffe6c4', ground: '#3a2418', fill: 0.65, sun: 1.1 },
    wall: null,
  },
  pond: {
    Room: PondRoom,
    Tile: LilyPad,
    tileY: 0.05,
    tileTop: 0.1,
    pieces: { lamp: CandleLantern, mirror: PondMirror, fixedMirror: PondFixedMirror, splitter: PondSplitter, fixedSplitter: PondFixedSplitter, wall: LogPile },
    room: { pad: POND_PAD, height: POND_HEIGHT },
    light: { sky: '#fff6e0', ground: '#5f8a66', fill: 0.8, sun: 1.35 },
    // The window's wall behind the pond: a soft meadow morning.
    wall: 'linear-gradient(180deg, #f3f1df, #dfead0)',
  },
};
