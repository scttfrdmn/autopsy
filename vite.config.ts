/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [preact()],
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rolldownOptions: {
      input: {
        popup: resolve(import.meta.dirname, 'index.html'),
        worker: resolve(import.meta.dirname, 'src/background/worker.ts'),
      },
      output: {
        // The manifest points at a fixed worker path.
        entryFileNames: chunk =>
          chunk.name === 'worker' ? 'src/background/[name].js' : 'assets/[name].[hash].js',
      },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
