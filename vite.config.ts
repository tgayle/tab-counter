import { chromeExtension } from '@crxjs/vite-plugin';
import zip from 'rollup-plugin-zip';
import manifest from './src/manifest';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  build: {
    sourcemap: 'inline',
  },
  plugins: [
    react(),
    chromeExtension({ manifest, contentScripts: { preambleCode: false } }),
    isProduction && zip({ dir: 'releases' }),
  ],
});
