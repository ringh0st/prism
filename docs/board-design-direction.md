# Board design direction (owner decisions)

Decisions from the design rounds on the `r3f-level-160` branch (concept scenes in `sheet/concepts.jsx`).

- **Themed levels.** Each theme dresses every piece in its own world: the Library first (banker's lamp, brass
  mirrors, book stacks, ink pot, dust sheet, magic-book portals, bookcase gate and desk-bell switch). Next ideas:
  Pond (a log blocks light), Sea (a lighthouse is the lamp), Space (rocks), and one more.
- **Mirrors.** A mirror that turns stands on a brass gear wheel; a fixed mirror is the same brass mirror bolted on a
  heavy wooden base with no gear.
- **Natural light.** A soft shaft with feathered edges, a thin bright core and floating dust, a warm pool of light on
  the floor under it, and a soft glow where it meets a mirror or a target (no solid glowing tubes, no tiles turning
  solid yellow).
- **Floor.** Real wood plank floor for the room; the puzzle tiles are lighter polished oak parquet.
- **Targets are Lumi's family, not gems.** Smudge traps them in smoky shadow bubbles (greyed, asleep); light bursts
  the bubble and they wake glowing in their color. Family members: baby, kid, little sister, mom, dad, grandma (more
  later). Each wears the color of the light it needs, and its antenna tips carry the color's shape (gold ◆, coral ●,
  green ▲, blue ■) so color is never the only clue.
- **Win message:** "All home safe!"
- **Glowbugs stay a separate collection** (unchanged).

## Built so far (branch `library-world`)

- World 1 is the Library (`BOARD_THEMES` in `src/game/boardThemes.js`): drawn by `src/components/boardFiber/library/`
  on the R3F board (room, parquet tiles, banker's lamp, gear/fixed mirrors, book stacks, natural beams, Lumi's family
  as targets with the rescue faces). Pieces without a library design yet keep their current look.
- Themed worlds' win headline is "All home safe!"; the first-steps tag says "Lumi".
- Still to do: the gem icons in the meter and level card as Lumis, Lumi's lines that say "gem", the remaining pieces
  in library style (splitter, glass, prism, portals, gates, fog, shadows), tests for the themed board, and the next
  themes.
