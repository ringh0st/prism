/*
 * The looks of the themed boards: for each theme its room, the tile you tap, its pieces and its light. A piece a
 * theme hasn't drawn yet falls back to the plain board's piece (ThemedScene).
 */
import { CastleWall, CrystalSplitter, PillarCrystal, PillarShield, ShieldMirror, StainedGlassTower, Torch } from '../castle/CastlePieces.jsx';
import { CASTLE_HEIGHT, CASTLE_PAD, CastleRoom, Flagstone } from '../castle/CastleRoom.jsx';
import { BeachHut, GlassFloat, Lighthouse, RingMirror, RingSplitter, SandcastleMirror, SandcastleSplitter } from '../beach/BeachPieces.jsx';
import { BEACH_HEIGHT, BEACH_PAD, BeachRoom, SandTile } from '../beach/BeachRoom.jsx';
import { BoulderMirror, BoulderSplitter, Campfire, GlassMushroom, StumpMirror, StumpSplitter, TreeClump } from '../forest/ForestPieces.jsx';
import { FOREST_HEIGHT, FOREST_PAD, ForestFloor, ForestRoom } from '../forest/ForestRoom.jsx';
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
  forest: {
    Room: ForestRoom,
    Tile: ForestFloor,
    tileY: 0.05,
    tileTop: 0.09,
    pieces: {
      lamp: Campfire,
      mirror: StumpMirror,
      fixedMirror: BoulderMirror,
      splitter: StumpSplitter,
      fixedSplitter: BoulderSplitter,
      filter: GlassMushroom,
      wall: TreeClump,
    },
    room: { pad: FOREST_PAD, height: FOREST_HEIGHT },
    light: { sky: '#fff3da', ground: '#3f5a40', fill: 0.8, sun: 1.3 },
    wall: 'linear-gradient(180deg, #eef3e2, #d9e8cf)',
  },
  beach: {
    Room: BeachRoom,
    Tile: SandTile,
    tileY: 0.05,
    tileTop: 0.09,
    pieces: {
      lamp: Lighthouse,
      mirror: RingMirror,
      fixedMirror: SandcastleMirror,
      splitter: RingSplitter,
      fixedSplitter: SandcastleSplitter,
      filter: GlassFloat,
      wall: BeachHut,
    },
    room: { pad: BEACH_PAD, height: BEACH_HEIGHT },
    // A late-afternoon sun: softer light, so the sand doesn't glare and the beam still shows.
    light: { sky: '#ffe9c9', ground: '#5f9d9a', fill: 0.55, sun: 0.95 },
    wall: 'linear-gradient(180deg, #cfe9e4, #f6dcb8)',
  },
};
