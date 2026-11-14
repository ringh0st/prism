import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  build: {
    outDir: 'dist/play',
    emptyOutDir: true,
  },
});
