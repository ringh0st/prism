import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { version } = JSON.parse(readFileSync(new URL('./version.json', import.meta.url), 'utf8'));

// A new id for every build, written to version.json next to the app so an open copy can tell a newer one is out
// (../src/lib/autoUpdate.js, shared with Lumipals).
const BUILD_ID = String(Date.now());
const buildFile = {
  name: 'build-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID, version }) });
  },
};

// The marbles game: its own small app in this repository, published next to Lumipals at lumipals.app/marbles/.
export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  plugins: [react(), buildFile],
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version), __BUILD_ID__: JSON.stringify(BUILD_ID) },
  build: { outDir: new URL('../dist/marbles', import.meta.url).pathname, emptyOutDir: true },
});
