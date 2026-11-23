import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { version } = JSON.parse(readFileSync(new URL('./version.json', import.meta.url), 'utf8'));

// The Pals coloring book: its own small app in this repository, published at lumipals.app/coloring/.
export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  plugins: [react()],
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version) },
  build: { outDir: new URL('../dist/coloring', import.meta.url).pathname, emptyOutDir: true },
  server: { fs: { allow: ['..'] } },
});
