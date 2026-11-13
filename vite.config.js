import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The game is served from /prism/play/ next to the static home page in site/.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/play',
    emptyOutDir: true,
  },
});
