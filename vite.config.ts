import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        worker: resolve(__dirname, 'src/background/worker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'worker'
            ? 'src/background/[name].js'
            : 'assets/[name].[hash].js';
        },
      },
    },
  },
  publicDir: 'public',
});
