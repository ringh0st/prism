# Lumipals

A light-bending puzzle game for all ages. Rotate mirrors and crystals to bend beams of light and light up every gem.

- **Play:** https://ringh0st.github.io/prism/play/
- **Home page:** https://ringh0st.github.io/prism/
- **Privacy Policy:** https://ringh0st.github.io/prism/privacy.html

## Features

- **1000 levels** in 50 funny-named worlds (20 each), loaded per world on demand. Worlds 1–4 introduce mirrors, splitters, color filters and shadow crystals; later worlds mix them on boards up to 10×10.
- A difficulty rhythm: every 5th level is **Hard**, every 20th a **Boss**. Every level has a **move limit**; run out and you retry.
- Lumi, the mascot, reacts to everything; levels get silly names; surprise disco, night and boss levels; reward chests every 10 levels; hot streaks.
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
src/data/worlds/           Built-in level pack, one JSON file per world (generated)
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
5. Run `supabase/progression.sql` for the 1000-level pack and reward chests.

Payments setup: see [PAYMENTS.md](PAYMENTS.md).
