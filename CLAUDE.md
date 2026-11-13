# Prism: project guide

Prism is a light-bending puzzle game: rotate mirrors and crystals to steer beams of light so every gem lights up. It is for all ages and is published on GitHub Pages at https://ringh0st.github.io/prism/.

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
- All-ages fairness: no loot boxes or random rewards, no fake timers or pressure tactics, clear prices, and an "ask a parent" note wherever money is involved.

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
- Level data is versioned JSON validated by one schema shared by the game and the editor.
- Never commit secrets. Only the Supabase URL and publishable (anon) key may appear in client code. Payment keys live in GitHub secrets and Supabase function secrets.
