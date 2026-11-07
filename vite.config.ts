import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(rootDir, 'frontend'),
  publicDir: path.resolve(rootDir, 'frontend/public'),
  build: {
    outDir: path.resolve(rootDir, 'dist'),
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'frontend/src'),
    },
  },
  server: {
    port: 3000,
    hmr: false,
    watch: null,
  },
});
