# Lumipals: project guide

Lumipals is a light-bending puzzle game: rotate mirrors and crystals to steer beams of light so every gem lights up. It is for all ages and is published at https://lumipals.app/ (GitHub Pages with a custom domain; the domain is at Cloudflare, DNS only; the old https://ringh0st.github.io/prism/ redirects there). The game is at `/play/`, the home page at `/`. The store name is "Rinny's Lumipals: Light Puzzle". It was called Prism before; the repository and `prism.*` storage keys keep that name on purpose, so players keep their progress.

## Product requirements (from the owner, apply to all work)

- **Best UX/UI:** polished, delightful, minimal and fun. Every interaction gets clear, juicy feedback.
- **Colors:** warm, relaxing and calm (owner feedback: bright yellow and red felt too fiery). **Purple and blue must not be the main colors.** Blue may appear only as a small in-game color (for example one beam color among several), never as the brand, UI or background color.
- **Addictive, dopamine-rich loop:** satisfying solve moments, stars, streaks, rewards, unlocks and progress you can see.
- **Levels with a difficulty rhythm:** mostly approachable levels, with a **Hard** level now and then and an occasional **Extra Hard** challenge level. These are clearly marked and give bigger rewards.
- **Challenging and game-like, not a web page:** 1000+ levels (50 worlds × 20, `npm run levels`), move limits, an adventure map, chunky outlined game UI, a mascot (Lumi) with funny lines, and surprises (disco/night/boss levels, chests).
- **Rewards:** 1–3 stars per level based on moves, world completion rewards, a daily puzzle with a streak, and cosmetic unlocks.
- **Accounts:** play as a guest immediately with local progress. Signing in with Google is optional and syncs progress, using Supabase. Apple sign-in comes later, when the iOS app ships.
- **Admin:** only the owner can use a level editor and publish levels. Levels are data in the database, so new levels appear without an app update.
- **Responsive and accessible:** phone-first, and works on tablet and desktop too. Full keyboard support, screen-reader labels, visible focus, good color contrast, reduced-motion support, and color is never the only signal (use shapes and symbols too).
- **Code quality:** best practices, reusable components and modules, consistent naming, small focused files, no dead code.

## Economy (see src/game/catalog.js and supabase/economy.sql)

- **Sparks** are earned by playing. **Diamonds** are premium: earned by finishing a world, 3-starring a world or every 7-day streak, or bought with real money (Lemon Squeezy, see PAYMENTS.md). Diamonds always require an account.
- **Helpers:** Hint, Lens, Auto-turn and Skip. They are capped so buying isn't a shortcut through the game: max 5 held per helper, 3 helpers bought with sparks per day, a per-attempt limit by difficulty (3/2/1), and star caps (Hint/Lens → 2★, Auto-turn/Skip → 1★). Sparks can never become diamonds.
- For signed-in players the **server is the source of truth**: every currency change goes through a `security definer` function in `supabase/economy.sql`, never a direct table write. Prices exist in both `catalog.js` and `economy.sql`; a test keeps them in sync.
- **Pals** (profile characters, src/game/pals.js and supabase/pals.sql): 48 Pals, including 8 Legendary and 10 Mythic ones from myths and legends (phoenix, qilin, griffin…). Each form adds that Pal's own visible growth (src/components/pals/palGrowth.jsx), not just size. Pick one starter on the first game, unlock the rest by playing. Only the partner Pal grows: every solved level (not a Skip) adds one, and 20 grow it into its next form (Baby, Junior, Buddy, Champ, Master); each Pal keeps its own count. Evolution can never be bought; sparks only buy cosmetic accessories.
- **The Grove** (src/game/grove.js, supabase/grove.sql): the Pals' home in the enchanted forest (Pals tab → Decorate); only the partner Pal is shown there. 18 decor items in 6 spots (home, seat, light, garden, water, sky), bought with sparks and placed one per spot. The Pal there is alive (`src/game/groveLife.js`, `usePalLife`): each Pal there (`GrovePal`) wanders, plays (jump, spin, dance…), uses placed decor (sits on the seat, splashes in the water…), follows the player's time of day (dawn/day/dusk/night sky) and naps 23:00–06:00; tapping pets it. The forest changes with the seasons (`seasonOf`: snow, petals, autumn leaves), one of your other Pals visits most daytimes (`visitingFriend`), and finishing a world throws a Grove party once (`useGroveParty`). After each win the partner cheers (`src/game/palCheers.js`). Once a day the partner says hello on the map beside PLAY (`palGreetings.js`, `PalHello`): news first (almost grown, event weekend, streak), otherwise a time-of-day hello; it waits for the splash (`useIsSplashShowing`).
- **Nicknames** (src/game/nicknames.js, supabase/nicknames.sql): players type their Top-board name or roll a random one. The same rules run in the game and on the server: 3–16 letters/numbers/spaces, no long digit runs, and a blocked-word list (kept in sync by a test).
- **Titles** (src/game/titles.js): earned by stars, each with its own color via TitleBadge.
- **Rarity and the Shop:** Pals are Basic, ★ Legendary (8, only from Lucky gifts or the Shop) or ✦ Mythic (10). Basic Pals can be adopted by choice (20💎); each day every player gets one random Legendary (40💎) and one random Mythic (60💎) pick, always shown before buying. **Lucky Pal gift:** every 200 solved levels a free random Pal you don't have (70% Basic, 20% Legendary, 10% Mythic, odds shown), drawn on the server for accounts (`claim_lucky_pal`).
- **Weekend events** (src/game/events.js, supabase/events.sql, `npm run events`): every Saturday and Sunday 10 themed puzzles (themes take turns: Mirror Madness, Portal Party…), made ahead of time in src/data/events/ (one file per weekend, a year ahead; run `npm run events` to add more). Open after World 1; no Skip; each solve grows the partner Pal. Finishing all 10 pays 150 sparks and that event's stamp (collected on the event page).
- **Pal quests** (src/game/quests.js, supabase/quests.sql): each week (Monday, UTC) the partner Pal asks for three goals (solve levels, ★★★ levels, Hard levels; the bigger or smaller of each takes turns), counted once per level per week and paid in sparks. The server counts from its own level results; a test keeps the quest list in sync.
- All-ages fairness: **no paid loot boxes**: anything bought is shown before paying. Random rewards are only free, earned gifts with their odds shown. No fake timers or pressure tactics, clear prices, and an "ask a parent" note wherever money is involved.

## Brand palette ("Calm Meadow", relaxing and warm)

| Token | Hex | Use |
| --- | --- | --- |
| `--color-sage` | `#58AC82` | Primary: buttons, current level, active tab (dark label `#10291C`) |
| `--color-honey` | `#F0C14E` | Stars, rewards, chests |
| `--color-peach` | `#F2A67E` | Sparks, hard levels, warm accents |
| `--color-terracotta` | `#DF7458` | Boss levels, danger (never as the main color) |
| `--color-mint` | `#4FBFAD` | Diamonds, success |
| `--surface-page` | `#FAF6EE` | Light background (cream) |
| `--text-strong` | `#2B2118` | Text (warm near-black) |
| night `--surface-page` | `#1C1A16` | Dark-mode background |

Style: "Sunlit Paper". Matte surfaces, warm layered shadows and solid "ledge" buttons. No outlines, glass, neon glows or gradient text; only light beams glow. Each colored surface uses the `--action|reward|warm|alert|calm-*` tokens (fill, ledge, label) so text keeps WCAG contrast.

## Conventions

- React + Vite, plain CSS with design tokens (CSS custom properties) defined once and themed for light and dark.
- Components: `PascalCase.jsx`, one component per file, colocated `ComponentName.module.css`.
- Hooks: `useSomething.js`. Pure game logic (beam tracing, level validation, scoring) lives in `src/game/` with no React or DOM, so it can be unit tested.
- Names describe intent: `traceBeam`, `isLevelSolved`, `starsForMoves`, not `doStuff` or `helper`.
- Sound and haptics live in `src/audio/` (generated music-box tones, no files). Each moment has its own named sound (`sfx.outOfMoves`, `sfx.palGrow`…) and a haptic strength; keep failure sounds kind, never harsh. Inside a world, the level-start jingle, gem chimes and win fanfare use that world's voice (`src/audio/worldVoices.js`: scale, instrument, motif and a nature sound; set by `sfx.setWorldVoice`). iPhone haptics use the hidden-switch trick in `haptics.js`.
- **Pieces and twists** (`src/game/pieces.js`): new pieces are taught one per level with a "New piece!" card, never two introductions in a row (a test walks worlds 1–15): mirrors 1-1, walls 1-4, fixed mirrors 1-10, splitters 2-1, color glass 3-1, shadow crystals 4-1, **twin mirrors** 6-1 (same mark = turn together; `link`), **portals** 8-1 (same pair = light jumps across; `pair`), **cracking mirrors** 10-1 (`fragile`: 3 turns, then fixed; hints treat cracked ones as locked), **fog** 12-1 (`fog` on gems/walls/shades: hidden until light touches the cell), **prism crystals** 14-1 (fixed `prism` tile: light splits out to both sides). The solver treats twins as one switch. After changing `generatorPresetFor`, run `npm run levels -- <worlds>`.
- Level data is versioned JSON validated by one schema shared by the game and the editor.
- **Level landscapes** (`src/screens/play/WorldBackdrop.jsx`, `backdrop/`): each level gets its own arrangement of the world's scenery plus two of the world's animals (`BIOME_CREATURES`: camels, lizards and tumbleweeds in the desert, ducks at the lagoon…), seeded by level id. Keep them small, slow and quiet; nothing moves for reduced motion.
- **Solve replay** (`src/game/replay.js`, `src/lib/replay/`, `ReplayShare`): the win screen's "Share replay" records the winning taps as an 8–15 s vertical MP4 (canvas + MediaRecorder, drawn in the game's light style, ending with the stars and lumipals.app) and opens the share sheet, or downloads it. Hidden where the browser can't record.
- **Splash and version** (`src/components/splash/SplashScreen.jsx`, `src/lib/appInfo.js`): a 4-second opening screen with the game name, "A Ringhost's Games production" and the version from `package.json` (bump it for each release). Tap, Enter or Escape skips it; pop-ups wait until it's gone.
- **iPhone app** (IOS.md): Capacitor wraps the built game (`ios/`, bundle id `app.lumipals`, `npm run ios`). Use `isNativeApp` from `src/lib/platform.js` for app-only behavior: no web purchases or auto-update in the app, native haptics, sign-in via a Safari sheet returning to `app.lumipals://auth`, and Sign in with Apple.
- Never commit secrets. Only the Supabase URL and publishable (anon) key may appear in client code. Payment keys live in GitHub secrets and Supabase function secrets.
