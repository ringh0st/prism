import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { version } = JSON.parse(readFileSync(new URL('./version.json', import.meta.url), 'utf8'));

// The marbles game: its own small app in this repository, published next to Lumipals at lumipals.app/marbles/.
export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  plugins: [react()],
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version) },
  build: { outDir: new URL('../dist/marbles', import.meta.url).pathname, emptyOutDir: true },
});
