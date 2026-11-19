# Lumipals in Unity: prototype brief

**Reader:** Claude Code, running on the owner's Mac, starting with no knowledge of this project.
**Written by:** the Claude Code session that built the web game. Everything below was checked against the web game's source.

Read the whole brief before doing anything. Section 13 is the order of work.

---

## 1. What this is and why

Lumipals is a finished light-bending puzzle game built with web technology (React, Vite, and React Three Fiber for a 3D board). It is live at https://lumipals.app/play/ and wrapped as an iPhone app with Capacitor. The 3D board became slow on the owner's iPhone once the rooms got detailed.

The owner wants to find out whether Unity gives a clearly faster and better-looking game. Your job is a **prototype that answers that question**: the core puzzle, 12 levels, one visual theme (the Library), running on her iPhone, good enough to put next to the web version and compare.

It is not a port of the whole game. Do not build anything in section 3's "out of scope" list, even if it looks easy.

### Success means

1. The owner plays 12 levels start to finish on her iPhone.
2. It holds 60 frames a second there, and you can show the number (section 11).
3. The Library room looks at least as good as the web version's (section 8), with real soft shadows and a glowing beam.
4. The puzzle rules behave exactly like the web game's (section 5), proven by tests (section 10).

## 2. Who you are working with

- The owner is the game's designer and product owner, not a programmer. She is comfortable running Terminal commands you give her and clicking through Xcode, but has never used Unity.
- Explain in plain language. When she must click something, give the exact menu path and button name, one step per line. Never assume she can read code or a Unity error.
- She writes in English and sometimes Hebrew. Reply in the language she uses.
- She has a Mac with Xcode, an iPhone, and a **free Apple ID** (not the paid Apple Developer Program). That means: signing with a "Personal Team", no Sign in with Apple, no push notifications, and an installed app stops opening after 7 days until it is installed again. Tell her that once, when she first installs.
- She cares a great deal about look and feel, and has given firm design rules (section 8). Follow them; they came from her rejecting earlier attempts.
- Do as much as possible yourself from the command line. Every manual step you ask of her should be one she truly has to do (installing Unity, signing in, plugging in the phone, pressing Run in Xcode).

## 3. Scope

### In scope

- The puzzle: lamps, mirrors that turn, mirrors that don't, walls, Lumis to rescue (section 5).
- 12 levels (section 6), played in order, each unlocking the next.
- Move limit, 1–3 stars, win and out-of-moves cards (section 7).
- One theme: the Library (section 8).
- A camera the player can turn, tilt and zoom, plus a reset button (section 9).
- A level-select screen and a title screen (section 7).
- Progress saved on the device (`PlayerPrefs`).
- A short sound for a turn, a rescue and a win (simple generated tones are fine).
- English only. Portrait only. iPhone first; it should also run in the Unity editor on the Mac.

### Out of scope (do not build)

Accounts and sign-in (Google, Apple), any server or database, payments, diamonds, the shop, sparks, Pals, the Grove, gifts, quests, missions, events, Light Rush, the daily puzzle, leaderboards, helpers and hints as items, boosters, the map with worlds, Spanish and Hebrew, the level editor, analytics, the website and domain, App Store submission, Android.

Also not needed yet: the other themes (Pond, Castle, Beach, Forest) and the later pieces (splitters, color glass, portals, prisms, gates, fog, the darkness). Section 5 lists them only so your data model does not block them later.

## 4. Reference material

The web game's source is the reference for anything this brief does not settle.

- Repository: `ringh0st/prism` on GitHub (private). The owner has it cloned on this Mac; ask her where if you cannot find a folder named `prism` in her home directory. **Read it, never change it.**
- Files worth reading there:
  - `CLAUDE.md`: the full product guide and every design rule the owner has given.
  - `src/game/constants.js`, `src/game/beam.js`: the rules of light (section 5 is taken from these).
  - `src/game/scoring.js`: move limits and stars.
  - `src/game/solver.js`: the solver (you only need a simple brute-force one, section 10).
  - `src/data/worlds/world-001.json`: the levels in section 6, and 8 more if wanted.
  - `src/components/boardFiber/library/LibraryPieces.jsx`, `LibraryRoom.jsx` and `themes/shared.jsx`, `themes/NaturalBeam.jsx`, `themes/LumiKin.jsx`: exact shapes, sizes and colors of the Library theme (section 8 summarises them). Sizes there are in board cells, 1 unit = 1 cell, the same scale to use in Unity.
- To see the target look, open https://lumipals.app/play/?theme=library on the Mac. `?theme=library` forces every level into the Library theme.

If the repository is not available, this brief is still enough to build the prototype.

## 5. The rules (must match exactly)

### Board

- A grid `width` × `height` (3–10 each). Cell `(x, y)`: x grows to the right, **y grows downward** (toward the player in the default view).
- At most one tile per cell.

### Tiles in this prototype

| `type` | Fields | Behaviour |
| --- | --- | --- |
| `emitter` | `dir` (`up`/`right`/`down`/`left`), `color` (`sun`) | The lamp. Sends one beam in `dir`. Blocks any light that reaches it. |
| `mirror` | `orient` (0 or 1), optional `locked: true` | Reflects light. A tap flips `orient` unless `locked`. |
| `wall` | none | Blocks light. |
| `gem` | `color` (`sun`) | The target. Lit when a beam of its color reaches it. Light stops there. In the themed game it is drawn as a **Lumi** to rescue, never as a gem (section 8). |

### Directions and reflection

```
up = (0,-1)   right = (1,0)   down = (0,1)   left = (-1,0)

orient 0 is "/"  (runs bottom-left to top-right seen from above)
orient 1 is "\"  (runs top-left to bottom-right)

reflect((dx,dy), orient 0) = (-dy, -dx)
reflect((dx,dy), orient 1) = ( dy,  dx)
```

So a beam travelling right that hits a `/` mirror leaves travelling up.

### Tracing the light

For every emitter, start at its cell with its direction, then repeat:

1. Step one cell in the current direction.
2. Outside the board: the beam ends half a cell past the last cell (it runs to the board's edge). Stop.
3. Empty cell: continue.
4. If this exact (cell, direction, color) was already visited: end the beam at this cell's center. Stop. (Guards against loops.)
5. `wall` or `emitter`: the beam ends half a cell **before** this cell's center (at its near face). Stop.
6. `gem`: the beam ends at the cell's center; record that this gem was hit by this color. Stop.
7. `mirror`: end the current straight segment at the cell's center, change direction with `reflect`, start a new segment from this center, continue.

Output: a list of straight segments `(x1, y1, x2, y2, color)` in cell units measured from cell centers, and the set of lit gems. A gem is lit only if hit by its own color (always `sun` here).

**Solved** = the level has at least one gem and every gem is lit.

Also compute the **lit cells**: every cell a segment passes through or ends in. Floor tiles under the light glow (section 8).

### Taps and moves

- State per level: `turns[i]` for each tile, starting at 0. A mirror's current orient is `(orient + turns) % 2`.
- Tapping a mirror that is not `locked` adds 1 to its turns and counts as **one move**.
- Tapping a `locked` mirror, a wall, a lamp, a Lumi or an empty cell is not a move. For a locked mirror, shake it briefly so the player sees it will not turn.
- After every move: retrace the light, update the display, then check for a win; if not won and no moves are left, the level is lost.

### Moves and stars (`par` comes from the level data)

```
moveLimit = par + max(1, ceil(par / 3))          for difficulty "normal"
moveLimit = par + max(1, ceil(par * 0.25))       for difficulty "hard"

twoStarLimit = par + ceil((moveLimit - par) / 2)
stars = 3 if moves <= par, else 2 if moves <= twoStarLimit, else 1
```

`par` is the fewest taps that solve the level. In text for the player say "Get ★★★ in N moves", never "par".

### Later pieces (design the data model so these fit; do not build them)

`splitter` (passes light straight on and also reflects it), `filter` (recolors the beam), `shade` (must stay unlit), `portal` (pairs), `prism`, `gate` + `switch`, `void`, turning lamps, and beam colors `coral`, `lime`, `sky`. Keep tile data as a general record (type plus optional fields) and keep the tracer one function over that record, so adding a tile type later is a new case, not a redesign.

## 6. The 12 levels

These are levels 1–12 of the web game's first world, unchanged. Save them as `Assets/Resources/levels.json` and load them at start. Level 5 and 10 are Hard; show a small "HARD" tag on them.

```json
[
  {"id": "w1-01", "name": "The Toasty Beam", "difficulty": "normal", "width": 4, "height": 4, "par": 1, "tiles": [
      {"x": 3, "y": 1, "type": "emitter", "dir": "left", "color": "sun"},
      {"x": 1, "y": 1, "type": "mirror", "orient": 0},
      {"x": 1, "y": 0, "type": "gem", "color": "sun"}
  ]},
  {"id": "w1-02", "name": "The Grumpy Comet", "difficulty": "normal", "width": 5, "height": 5, "par": 2, "tiles": [
      {"x": 0, "y": 3, "type": "emitter", "dir": "right", "color": "sun"},
      {"x": 3, "y": 3, "type": "mirror", "orient": 1},
      {"x": 3, "y": 1, "type": "mirror", "orient": 0},
      {"x": 1, "y": 1, "type": "gem", "color": "sun"},
      {"x": 0, "y": 4, "type": "mirror", "orient": 0}
  ]},
  {"id": "w1-03", "name": "The Shiny Llama", "difficulty": "normal", "width": 5, "height": 5, "par": 2, "tiles": [
      {"x": 0, "y": 1, "type": "emitter", "dir": "right", "color": "sun"},
      {"x": 1, "y": 1, "type": "mirror", "orient": 0},
      {"x": 1, "y": 2, "type": "mirror", "orient": 1},
      {"x": 3, "y": 2, "type": "mirror", "orient": 0},
      {"x": 3, "y": 4, "type": "gem", "color": "sun"},
      {"x": 2, "y": 1, "type": "mirror", "orient": 1},
      {"x": 4, "y": 4, "type": "mirror", "orient": 1}
  ]},
  {"id": "w1-04", "name": "The Glowing Photon", "difficulty": "normal", "width": 5, "height": 5, "par": 3, "tiles": [
      {"x": 2, "y": 4, "type": "emitter", "dir": "up", "color": "sun"},
      {"x": 2, "y": 1, "type": "mirror", "orient": 1},
      {"x": 4, "y": 1, "type": "mirror", "orient": 1},
      {"x": 4, "y": 0, "type": "mirror", "orient": 0},
      {"x": 3, "y": 0, "type": "gem", "color": "sun"},
      {"x": 1, "y": 0, "type": "mirror", "orient": 0},
      {"x": 3, "y": 2, "type": "mirror", "orient": 0},
      {"x": 1, "y": 4, "type": "wall"}
  ]},
  {"id": "w1-05", "name": "Hold My Prism", "difficulty": "hard", "width": 7, "height": 7, "par": 5, "tiles": [
      {"x": 5, "y": 6, "type": "emitter", "dir": "up", "color": "sun"},
      {"x": 5, "y": 3, "type": "mirror", "orient": 1},
      {"x": 6, "y": 3, "type": "mirror", "orient": 1},
      {"x": 6, "y": 0, "type": "mirror", "orient": 0},
      {"x": 3, "y": 0, "type": "mirror", "orient": 1},
      {"x": 3, "y": 3, "type": "mirror", "orient": 0},
      {"x": 1, "y": 3, "type": "mirror", "orient": 1},
      {"x": 1, "y": 6, "type": "gem", "color": "sun"},
      {"x": 6, "y": 4, "type": "mirror", "orient": 1},
      {"x": 4, "y": 6, "type": "wall"},
      {"x": 0, "y": 1, "type": "wall"},
      {"x": 6, "y": 5, "type": "wall"},
      {"x": 2, "y": 6, "type": "wall"},
      {"x": 2, "y": 5, "type": "wall"},
      {"x": 3, "y": 4, "type": "wall"},
      {"x": 1, "y": 2, "type": "wall"},
      {"x": 0, "y": 2, "type": "wall"},
      {"x": 2, "y": 1, "type": "wall"}
  ]},
  {"id": "w1-06", "name": "The Wiggly Firefly", "difficulty": "normal", "width": 7, "height": 7, "par": 1, "tiles": [
      {"x": 0, "y": 3, "type": "emitter", "dir": "right", "color": "sun"},
      {"x": 1, "y": 3, "type": "mirror", "orient": 1},
      {"x": 1, "y": 1, "type": "mirror", "orient": 1},
      {"x": 0, "y": 1, "type": "mirror", "orient": 0},
      {"x": 0, "y": 2, "type": "gem", "color": "sun"},
      {"x": 3, "y": 1, "type": "mirror", "orient": 0},
      {"x": 1, "y": 0, "type": "wall"},
      {"x": 6, "y": 1, "type": "wall"}
  ]},
  {"id": "w1-07", "name": "The Dizzy Unicorn", "difficulty": "normal", "width": 7, "height": 7, "par": 3, "tiles": [
      {"x": 6, "y": 5, "type": "emitter", "dir": "left", "color": "sun"},
      {"x": 4, "y": 5, "type": "mirror", "orient": 0},
      {"x": 4, "y": 6, "type": "mirror", "orient": 0},
      {"x": 3, "y": 6, "type": "mirror", "orient": 0},
      {"x": 3, "y": 4, "type": "mirror", "orient": 1},
      {"x": 4, "y": 4, "type": "mirror", "orient": 1},
      {"x": 4, "y": 3, "type": "gem", "color": "sun"},
      {"x": 2, "y": 4, "type": "mirror", "orient": 0},
      {"x": 2, "y": 5, "type": "wall"}
  ]},
  {"id": "w1-08", "name": "The Spicy Lantern", "difficulty": "normal", "width": 5, "height": 5, "par": 4, "tiles": [
      {"x": 4, "y": 2, "type": "emitter", "dir": "left", "color": "sun"},
      {"x": 2, "y": 4, "type": "emitter", "dir": "up", "color": "sun"},
      {"x": 1, "y": 2, "type": "mirror", "orient": 0},
      {"x": 1, "y": 1, "type": "mirror", "orient": 1},
      {"x": 4, "y": 1, "type": "gem", "color": "sun"},
      {"x": 2, "y": 3, "type": "mirror", "orient": 0},
      {"x": 1, "y": 3, "type": "mirror", "orient": 0},
      {"x": 1, "y": 4, "type": "mirror", "orient": 1},
      {"x": 0, "y": 4, "type": "gem", "color": "sun"},
      {"x": 3, "y": 3, "type": "mirror", "orient": 1},
      {"x": 0, "y": 3, "type": "wall"}
  ]},
  {"id": "w1-09", "name": "The Tiny Disco Ball", "difficulty": "normal", "width": 4, "height": 4, "par": 3, "tiles": [
      {"x": 0, "y": 2, "type": "emitter", "dir": "right", "color": "sun"},
      {"x": 1, "y": 2, "type": "mirror", "orient": 1},
      {"x": 1, "y": 1, "type": "mirror", "orient": 0},
      {"x": 0, "y": 1, "type": "mirror", "orient": 0},
      {"x": 0, "y": 0, "type": "gem", "color": "sun"},
      {"x": 2, "y": 0, "type": "mirror", "orient": 0}
  ]},
  {"id": "w1-10", "name": "No Peeking", "difficulty": "hard", "width": 6, "height": 6, "par": 4, "tiles": [
      {"x": 1, "y": 5, "type": "emitter", "dir": "up", "color": "sun"},
      {"x": 1, "y": 2, "type": "mirror", "orient": 1},
      {"x": 4, "y": 2, "type": "mirror", "orient": 0},
      {"x": 4, "y": 5, "type": "mirror", "orient": 1},
      {"x": 3, "y": 5, "type": "mirror", "orient": 0},
      {"x": 3, "y": 4, "type": "mirror", "orient": 1, "locked": true},
      {"x": 2, "y": 4, "type": "gem", "color": "sun"},
      {"x": 2, "y": 0, "type": "mirror", "orient": 1},
      {"x": 5, "y": 4, "type": "mirror", "orient": 1},
      {"x": 0, "y": 1, "type": "wall"}
  ]},
  {"id": "w1-11", "name": "The Wobbly Mirror", "difficulty": "normal", "width": 4, "height": 4, "par": 3, "tiles": [
      {"x": 0, "y": 1, "type": "emitter", "dir": "right", "color": "sun"},
      {"x": 1, "y": 1, "type": "mirror", "orient": 0},
      {"x": 1, "y": 2, "type": "mirror", "orient": 0},
      {"x": 2, "y": 2, "type": "mirror", "orient": 0},
      {"x": 2, "y": 3, "type": "gem", "color": "sun"},
      {"x": 1, "y": 3, "type": "mirror", "orient": 1}
  ]},
  {"id": "w1-12", "name": "The Fancy Penguin", "difficulty": "normal", "width": 6, "height": 6, "par": 3, "tiles": [
      {"x": 0, "y": 4, "type": "emitter", "dir": "right", "color": "sun"},
      {"x": 5, "y": 2, "type": "emitter", "dir": "left", "color": "sun"},
      {"x": 3, "y": 5, "type": "emitter", "dir": "up", "color": "sun"},
      {"x": 2, "y": 4, "type": "mirror", "orient": 1, "locked": true},
      {"x": 2, "y": 5, "type": "mirror", "orient": 1},
      {"x": 0, "y": 5, "type": "gem", "color": "sun"},
      {"x": 4, "y": 2, "type": "mirror", "orient": 1},
      {"x": 4, "y": 3, "type": "mirror", "orient": 0},
      {"x": 3, "y": 3, "type": "gem", "color": "sun"},
      {"x": 3, "y": 4, "type": "mirror", "orient": 0},
      {"x": 4, "y": 4, "type": "mirror", "orient": 0},
      {"x": 4, "y": 5, "type": "gem", "color": "sun"},
      {"x": 5, "y": 4, "type": "mirror", "orient": 1},
      {"x": 1, "y": 1, "type": "wall"}
  ]}
]
```

What they teach, in order: one mirror (1), more mirrors (2–3), walls (4), a wall maze (5), a one-tap level as a breather (6), a long route (7), two lamps and two Lumis (8), a tiny tricky board (9), the first fixed mirror, marked `locked` (10), another tiny board (11), three lamps and three Lumis (12).

Some mirrors are decoys that no solution needs. That is deliberate.

## 7. Screens and flow

Keep the interface small. Build it in code (section 12), so nothing depends on hand-arranged editor layouts.

1. **Title:** the name "Lumipals", a big Play button. Play opens the first unsolved level.
2. **Level select:** a grid of 12 round buttons numbered 1–12, each showing its stars (0–3). Solved levels and the first unsolved one are open; the rest show a lock. Reached from a button on the title and from the back arrow in a level.
3. **Play:**
   - Top bar: back arrow, "Level N" with the level's name under it.
   - Meter: moves left (big number), three stars that show the best result still possible (drop a star the moment `moves` passes `par`, and the second when it passes `twoStarLimit`), and one small Lumi icon per Lumi on the board, filled in when rescued.
   - The 3D board fills the middle, inside a rounded window with a cream rim.
   - Bottom: a Restart button (resets turns and moves; free). A round "reset view" button sits on the window's lower edge.
   - Level 1 only: a soft pulsing ring on the one mirror, until it is tapped.
4. **Win card:** "All home safe!", the stars earned (pop in one by one), a big **Next** button, and a smaller Replay. Keep the best stars per level. After level 12, Next goes to the level select.
5. **Out of moves card:** a kind message ("So close! Try again?"), a Try again button. Never harsh, no red screen.

### Look of the interface ("Calm Meadow")

| Use | Color |
| --- | --- |
| Page background (cream) | `#FAF6EE` |
| Text (warm near-black) | `#2B2118` |
| Main buttons (sage), dark label `#10291C` | `#58AC82` |
| Stars and rewards (honey) | `#F0C14E` |
| Hard tag, warm accents (peach) | `#F2A67E` |
| Success, meter bar (mint) | `#4FBFAD` |

- Matte surfaces, soft warm shadows, chunky rounded buttons with a solid darker "ledge" under them. No outlines, glass effects, neon glows or gradient text. Only the light beam glows.
- **Blue and purple must never be main colors.** Warm, calm, relaxing; bright yellow and red felt "too fiery" to the owner.
- Font: Fredoka (Google Fonts, open licence), rounded and friendly. If you cannot fetch it, use the default TextMesh Pro font and tell the owner.
- Buttons at least 44 points tall. Respect the iPhone's safe area (notch and home bar).

## 8. The Library theme

A little library room that sits whole on the page like a model, seen from above at an angle. One unit = one board cell.

### Mapping the grid into the world

Center the board on the origin. Cell `(x, y)` → world position `(x - width/2 + 0.5, 0, -(y - height/2 + 0.5))`. So grid "up" is world +Z (away from the default camera) and grid "right" is world +X.

A `/` mirror (orient 0) is a vertical pane whose surface runs along world direction `(1, 0, 1)`; a `\` mirror (orient 1) runs along `(1, 0, -1)`. Get this right first and check it against level 1: the lamp at (3,1) shines left, the mirror at (1,1) starts as `/` and sends the light **down**, away from the Lumi at (1,0); one tap makes it `\` and sends the light up into the Lumi.

### The room

- **Base:** a wooden slab with rounded corners, reaching 0.95 past the board on every side, about 0.5 thick, with a soft shadow under it on the page. Warm oak, mid brown (around `#94623E`), visible planks.
- **Rug:** under the board, three thin layers: a dark red rug (`#7D2F2A`) reaching 0.35 past the board on each side, a gold band (`#C99A5A`) reaching 0.15 past it, and a red center (`#8A3530`) reaching 0.075 past it. It reads as a red rug with a gold border.
- **Floor tiles:** one oak parquet tile per cell, 0.95 × 0.95 and 0.08 thick, with thin dark gaps between tiles so cells read clearly. Turn the grain 90° on every other tile (checkerboard). A tile under the light glows warm (emissive honey, about 25% strength), fading in and out over about 0.3 s.
- **Shelves:** low bookshelves along the back edge and the left edge of the base (dark wood `#6B4430`, shelf boards `#7D5136`, rows of books in muted colors: `#7A3B33`, `#2F5F73`, `#3F6B4C`, `#A36B2A`, `#5A3B5C`, `#C49A4A`, `#8A4A3A`, `#2E4A3A`, `#B5503F`, `#3D5A80`; each spine has a thin gold band). Keep them low (the room is about 1.5 high) so the board stays large on a phone.
- **Page behind the room:** plain cream; the room is framed by a rounded window with a cream rim, so zooming in never ends in a hard square edge.
- **Lighting:** warm. One directional "sun" from the upper left front (around direction from `(-6, 7, 4)` toward the origin in the web scene's axes; adapt for the flipped Z), color `#FFE2B0`, soft shadows. Ambient: warm sky `#FFE6C4` above, dark brown `#3A2418` below.

### Pieces

- **Lamp (emitter): a green banker's lamp.** Round brass foot (radius 0.2), brass stem about 0.34 tall, a short brass arm, and a glossy dark green shade (`#2F6E57`) lying on its side, its open mouth facing the way the light leaves, with a bright warm disc inside (`#FFF0C8`, emissive, the one thing besides the beam that glows). Brass is `#D6A347` (metallic, fairly glossy) with highlights `#E8C06A`.
- **Mirror that turns: a round brass mirror on one leg on a gear wheel.** A flat brass gear on the floor (radius 0.32, 14 teeth, 0.05 thick); one thin brass leg in the middle (0.2 long); on it a round mirror: a brass ring (radius 0.29, tube 0.02) around a silver glass disc (radius 0.26) with two or three faint diagonal shine streaks. The mirror's center sits about 0.5 above the floor. When tapped, mirror and gear swing a quarter turn together in 0.5 s with a springy overshoot ("back out" ease).
- **Mirror that does not turn (`locked`): the same round mirror bolted to a heavy wooden plinth.** Plinth 0.56 × 0.12 × 0.42 (`#5E3A26`) with a thinner top board (`#6F4630`) and four small brass corner blocks; the mirror stands on **two** legs, one each side, with a **dark iron** ring and legs (`#3D3836`) instead of brass, and a small knob on top. No gear.
- **Wall: a bookcase that fills its whole cell** (1 × 0.62 high × 1). Bookcases on neighbouring cells must join into one long run of shelves: draw book spines only on the sides that face open floor, never between two joined cases. Plain lighter top board (`#7D5136`), nothing lying on top.
- **Lumi (gem): a small round creature, Lumi's family, waiting to be rescued.** A soft round body about 0.3 across sitting on the tile, two thin antennae with a little ball on each tip, two dot eyes, a tiny smile, small translucent wings. Before rescue: eyes closed (asleep), slightly dim. When the light reaches it: it wakes, glows softly, does one happy hop, and stays awake while lit (it goes back to sleep if the light leaves). Each Lumi on a board wears a different **pastel coat**, taken in order from: `#FFB7D2` (pink), `#AECFFA` (blue), `#FF9D9D` (red), `#B2E6B4` (green), `#D0B8F7` (purple), `#A5E6D8` (mint), `#F6ADD6`, `#B9C0F9`. The meter's Lumi icons use the same coats.

### The beam

- A straight glowing shaft about 0.5 above the floor (the height of the mirrors' centers), from segment start to end: a bright thin core (nearly white, tinted warm `#FFE2A8`) inside a wider, soft, additive halo. Use bloom so it really glows.
- A soft pool of warm light on the floor under it (this is the tile glow above).
- A few slow dust specks drifting along each beam (2 per cell of length is plenty).
- When a tap changes the path, the new stretch should appear quickly (about 0.15 s), not pop.

### The owner's design rules (firm)

1. Never lean on brown, yellow and beige alone. Use good colors, detail and contrast. In the Library the wood is the setting, so the brass, the green lamp, the colorful books and the pastel Lumis must carry the color.
2. Lumis are pastel, never honey or brown, and never the same color as the surface they sit on. No two alike on one board.
3. **Mirrors that turn stand on one leg on a wheel. Mirrors that do not turn stand on two legs with no wheel.** The two kinds also have different frame colors (brass versus dark iron).
4. Walls fill their whole square and join with their neighbours into one long wall.
5. Floor and lamp must belong to the theme.
6. Not too bright or glaring. Soft, late-afternoon warmth.
7. Show, don't tell: rewards and states read from color, light, size, symbols and sound, not sentences. Color is never the only signal (a locked mirror differs in shape, not just color).
8. Every interaction answers at once with clear, pleasing feedback: a crisp click on every turn, a chime and a hop on a rescue, stars that pop.

## 9. Camera and touch

- Perspective camera, narrow field of view (about 28°), looking at the board's center, tilted about 35° from straight above by default.
- Step the camera back until every corner of the room (the base, plus the shelves' height) fits inside the window, for any board size from 4×4 to 7×7.
- One finger drag: turn the room around its vertical axis and tilt it (tilt limited from almost straight above to about 65° from vertical). Two-finger pinch: zoom, limited so the room neither fills beyond the window by much nor shrinks to a dot. Smooth, with a little glide after the finger lifts.
- **A drag is never a tap.** A touch that moved more than about 8 points between down and up does not turn a mirror.
- A tap is found by casting a ray from the touch into the scene and taking the board cell it lands on (make the whole cell tappable, not just the thin mirror).
- The reset button returns to the default view with a short ease.
- In the editor, the mouse does the same: drag to turn, wheel to zoom, click to tap.

## 10. Tests (run them yourself)

Put the rules in plain C# with no Unity scene types (no `MonoBehaviour`, no `GameObject`), so they run as EditMode tests from the command line.

Required tests:

1. **Reflection:** all 8 combinations of 4 directions × 2 orients against the formulas in section 5.
2. **Level 1 by hand:** before any tap the Lumi is not lit; after one tap on the mirror it is, and the level is solved.
3. **Every level's `par` is right:** a brute-force solver tries every combination of the turnable mirrors (each is flipped or not; at most 2^10 here), finds the fewest flips that solve the level, and that number equals the level's `par`. Also assert no level starts solved.
4. **Walls and lamps block:** a beam aimed at a wall, and one aimed at another lamp, end half a cell before it.
5. **Move limit and stars:** par 1 → limit 2; par 3 → limit 4; par 4 hard → limit 5; par 5 hard → limit 7; and the star thresholds from the formula.
6. **Locked mirrors:** tapping one changes nothing and costs no move.

If test 3 fails for a level, your tracer is wrong, not the data: these levels are played daily in the live game.

## 11. Speed

The whole point is speed, so measure it.

- Target: 60 frames a second on the owner's iPhone on every level, including while a mirror turns and while the room is dragged.
- Add a small on-screen readout (frames per second, averaged over a second) that a triple tap on the level title shows and hides. Leave it in the build.
- Set `Application.targetFrameRate = 60`.
- Keep it cheap: the Universal Render Pipeline with mobile settings, one directional light with soft shadows (one cascade, 1024 map), baked or static batching for the room, shared materials (the SRP batcher), GPU instancing for the floor tiles, bloom on but check its cost by toggling it.
- Aim for under about 150 draw calls on a 7×7 level. Report the real number from the Frame Debugger or the Stats window.
- For comparison, the web version needs 200–460 draw calls per frame for the same kind of scene after heavy optimisation, renders at 1.5× pixels without anti-aliasing on phones, and only draws about 20 frames a second while idle to stay cool. Unity should do full resolution, 4× anti-aliasing and 60 a second.

## 12. How to build it

### Tools

- **Unity:** the newest Unity 6 LTS, installed through Unity Hub, with the **iOS Build Support** module. A free Unity Personal licence is right for this.
- **Editor for code:** none needed for you. If the owner wants to look at code, JetBrains Rider (free for non-commercial use) is the one that resembles the WebStorm she knows.
- **Xcode:** already installed.

### Project

- Create a new folder and git repository **outside** the `prism` folder, named `lumipals-unity`. Add Unity's standard `.gitignore` (ignore `Library/`, `Temp/`, `Obj/`, `Build/`, `Builds/`, `Logs/`, `UserSettings/`). Commit after each working step with a plain message. Do not push anywhere unless the owner asks.
- Template: Universal 3D (URP).
- Bundle identifier: `app.lumipals.unity` (different from the web app's `app.lumipals`, so both can sit on her phone side by side). Product name: "Lumipals Unity". Portrait only. Minimum iOS 15.

### Build everything from code

You cannot see the Unity editor, and the owner cannot arrange scenes for you. So:

- One scene containing one object with a `Bootstrap` script. Everything else (camera, lights, room, pieces, interface) is created by code at run time.
- Build shapes from Unity primitives and generated meshes (lathe shapes for the lamp's foot and shade, a gear from a cylinder plus teeth, rounded slabs). Create materials in code. Paint simple textures in code (wood planks, book spines) with `Texture2D`.
- Create the scene file, the build settings and the player settings with an **editor script** (`[MenuItem]` plus a static method you can call from the command line), so no clicking is needed.
- Interface: uGUI or UI Toolkit, built in code, with TextMesh Pro.
- Animation: small tween helpers in coroutines (ease out, back out). Do not add paid or third-party packages.
- Sound: generate short tones into `AudioClip`s in code (a soft click, a rising chime, a three-note win). Keep them quiet and kind.

Suggested layout:

```
Assets/
  Scripts/
    Rules/        LevelData.cs  Tracer.cs  Scoring.cs  Solver.cs   (plain C#, own assembly definition)
    Game/         Bootstrap.cs  GameState.cs  Progress.cs  LevelLoader.cs
    Board/        BoardView.cs  CameraRig.cs  BeamView.cs  TapInput.cs
    Library/      LibraryRoom.cs  LibraryPieces.cs  LumiView.cs  Shapes.cs  Paint.cs
    UI/           TitleScreen.cs  LevelSelect.cs  PlayHud.cs  ResultCard.cs  Theme.cs
    Audio/        Tones.cs
  Editor/         ProjectSetup.cs  Builder.cs
  Tests/EditMode/ RulesTests.cs
  Resources/      levels.json
```

### Running Unity from the command line

Unity can run without its window ("batch mode"). The project must **not** be open in the Unity editor at the same time, so ask the owner to close Unity before you run these.

```bash
UNITY="/Applications/Unity/Hub/Editor/<version>/Unity.app/Contents/MacOS/Unity"

# Tests
"$UNITY" -batchmode -projectPath . -runTests -testPlatform EditMode -testResults TestResults.xml -logFile -

# One-off setup, then an iOS build that produces an Xcode project in Builds/iOS
"$UNITY" -batchmode -quit -projectPath . -executeMethod ProjectSetup.Run -logFile -
"$UNITY" -batchmode -quit -projectPath . -buildTarget iOS -executeMethod Builder.BuildiOS -logFile -
```

Find the real version folder with `ls /Applications/Unity/Hub/Editor/`. Read the log for `error CS` lines after every run; a failed compile makes batch mode exit without doing the work.

### Seeing your own work

You cannot look at the game, so build ways to check it:

- An editor method that loads a level, renders the camera to a PNG file (`Camera.Render` into a `RenderTexture`, saved to `Screenshots/`), and exits. Run it in batch mode with graphics (no `-nographics`) and read the PNG yourself. Do this for at least levels 1, 5, 10 and 12 before showing the owner anything, and compare with https://lumipals.app/play/?theme=library.
- If batch-mode rendering does not work on her Mac, ask her to press Play in the editor and send a screenshot.

### Getting it onto the iPhone

`Builder.BuildiOS` writes an Xcode project. Then the owner does this (give her these steps, adjusted to what you see):

1. Plug the iPhone into the Mac and unlock it.
2. Open `Builds/iOS/Unity-iPhone.xcodeproj` in Xcode.
3. Click **Unity-iPhone** at the top of the left column, then the **Signing & Capabilities** tab.
4. Tick **Automatically manage signing** and pick her name with "(Personal Team)" under **Team**.
5. Choose her iPhone at the top of the window and press the Play button.
6. First time only, on the phone: Settings → General → VPN & Device Management → her Apple ID → Trust.

You can set the team in the build so she does not have to pick it each time: ask her for the Team ID shown in Xcode (not a secret) and put it in the player settings (`PlayerSettings.iOS.appleDeveloperTeamID`, automatic signing on).

## 13. Order of work

Stop and show the owner at each ★.

1. Check the tools: is Unity Hub installed, which editor version, is the iOS module there, where is the `prism` folder. Walk her through installing whatever is missing.
2. Create the project and repository; `ProjectSetup` makes the scene and settings. An empty scene builds without errors.
3. Rules in plain C# and all the tests of section 10 passing. No visuals yet.
4. A plain board: flat tiles, simple shapes for the pieces, the beam as a line, taps turning mirrors, win detection. Level 1 playable in the editor. ★ (ask her to press Play and try it)
5. The camera and touch rules of section 9.
6. The Library room and pieces of section 8, checked with your own screenshots. ★ (screenshots)
7. The beam with glow, lit tiles, Lumis waking, turn animation, sounds.
8. The interface: title, level select, play screen with the meter, win and out-of-moves cards, saved progress. ★
9. First iPhone build. Measure speed (section 11). ★ (she plays all 12 levels)
10. Polish from her feedback.

## 14. Finishing

When the owner has played it on her phone, give her a short written comparison she can read in two minutes:

- Frames per second on her iPhone, idle and while turning the room, next to how the web version feels on the same phone.
- Draw calls on the largest level.
- App size.
- What was easy in Unity and what was slow or awkward, honestly, including what the full game would still need (section 3's out-of-scope list is roughly 85% of the real game, mostly screens, and Hebrew right-to-left text is a known weak spot in Unity).
- Your recommendation: rebuild in Unity, stay on the web, or keep the web app and trim its 3D rooms.

Do not oversell the result. She is deciding whether to spend months on a rebuild.

## 15. Things never to do

- Never ask her to paste a password, an API key or any secret into the chat.
- Never put her name, email or other personal details into requests to outside services.
- Never change, commit to or push the `prism` repository. It is the live game.
- Never add sign-in, payments, tracking or network calls to this prototype.
- Never copy another game's characters, art, music or name.
- Never say something works without having run it (tests, a build, or a screenshot you looked at).
