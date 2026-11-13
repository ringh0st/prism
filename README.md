# Prism

A light-bending puzzle game for all ages. Rotate mirrors and crystals to bend beams of light and light up every gem.

- **Play:** https://ringh0st.github.io/prism/play/
- **Home page:** https://ringh0st.github.io/prism/
- **Privacy Policy:** https://ringh0st.github.io/prism/privacy.html

## Features

- 5 worlds with 60 levels. Each world introduces a new idea: mirrors, splitters, color filters, shadow crystals that must stay dark, and an expert world (Prism Peak) with 9×9–10×10 boards.
- A difficulty rhythm: mostly approachable levels, a **Hard** level every 4th, and an **Extra Hard** finale per world.
- 1–3 stars per level (fewer moves = more stars), sparks to spend on hints, worlds unlocked by stars, unlockable beam styles.
- A daily puzzle, the same for everyone, with a streak.
- Helpers (Hint, Lens, Auto-turn, Skip) and a store with sparks and diamonds; real-money diamonds via Lemon Squeezy (see PAYMENTS.md).
- Play as a guest, or sign in with Google to sync progress (Supabase).
- Admin-only level editor with a built-in solver: draw a level, scramble it, test it and publish. Players get it instantly.
- Phone-first, installable from the browser (Add to Home Screen), works offline, light and dark mode, full keyboard and screen-reader support.

## Project structure

```
site/                      Static home page and privacy policy
src/game/                  Pure game logic (no React): beams, solver, generator, scoring, progress
src/state/                 React contexts: auth, player progress, levels
src/components/            Reusable UI (Button, Dialog, Stars, Board…)
src/screens/               Map, Play, Settings, Admin (lazy-loaded)
src/data/seedLevels.json   Built-in level pack (generated)
scripts/                   Level pack generator
supabase/                  Database schema and admin setup SQL
```

## Develop

```bash
npm install
npm run dev
```

```bash
npm test          # game logic tests
npm run lint
npm run levels    # regenerate the built-in level pack
```

Every push to `main` runs the tests, builds the game into `dist/play`, adds the home page from `site/`, and deploys to GitHub Pages.

## Database setup (one time)

1. Supabase → **SQL Editor** → paste `supabase/schema.sql` → **Run**.
2. Sign in to the game with Google once.
3. Run `supabase/make-admin.sql` to make your account an admin. **Settings → Level editor** then appears in the game.
4. Run `supabase/economy.sql` for diamonds, helpers and the store.
5. In the Level editor, press **Import built-in** so world rewards know every level.

Payments setup: see [PAYMENTS.md](PAYMENTS.md).
