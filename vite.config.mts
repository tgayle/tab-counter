import { crx } from '@crxjs/vite-plugin';
import zip from 'rollup-plugin-zip';
import manifest from './src/manifest';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/popup/index.html'),
        sidePanel: resolve(__dirname, 'src/pages/sidePanel/index.html'),
      },
    },
  },
  plugins: [
    react(),
    crx({ manifest }),
    isProduction && zip({ dir: 'releases' }),
  ],
});
