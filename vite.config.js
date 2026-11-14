import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// The player-facing version (package.json), shown on the splash screen and in Settings.
const APP_VERSION = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;

// A new id for every build. The game compares it with version.json to update itself (src/lib/autoUpdate.js).
const BUILD_ID = String(Date.now());

/** Writes version.json next to the game so open copies can tell a newer one was published. */
const versionFile = {
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) });
  },
};

// The game is served from /prism/play/ next to the static home page in site/.
export default defineConfig({
  plugins: [react(), versionFile],
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID), __APP_VERSION__: JSON.stringify(APP_VERSION) },
  build: {
    outDir: 'dist/play',
    emptyOutDir: true,
  },
});
